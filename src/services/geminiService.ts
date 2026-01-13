import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import type { JobAnalysis, ResumeProfile, ExperienceBlock } from "../types";

const getApiKey = () => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_API_KEY;
};

const getAI = () => {
    const key = getApiKey();
    if (!key) {
        throw new Error("API Key missing. Please add your Gemini API Key in Settings.");
    }
    return new GoogleGenerativeAI(key);
};

export const validateApiKey = async (key: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        await model.generateContent("Test");
        return { isValid: true };
    } catch (error: unknown) {
        const e = error as Error;

        // If Quota Exceeded (429), the key IS valid, just exhausted.
        // We should allow the user to save it.
        if (e.message && (e.message.includes("429") || e.message.includes("Quota") || e.message.includes("quota"))) {
            return { isValid: true, error: "High traffic. Please wait a moment." };
        }

        // Extract a friendly error message
        let errorMessage = "Invalid API Key. Please check and try again.";
        if (e.message) {
            if (e.message.includes("403")) errorMessage = "Permission denied. Check API key restrictions.";
            else if (e.message.includes("404")) errorMessage = "Model not found. Try a different key or region.";
            else if (e.message.includes("400")) errorMessage = "Invalid API Key format.";
            else errorMessage = `Validation failed: ${e.message}`;
        }
        return { isValid: false, error: errorMessage };
    }
}

// Helper for exponential backoff retries on 429 errors
// User requested more conservative polling and detailed error surfacing
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> => {
    let currentDelay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: unknown) {
            const err = error as Error;
            const errorMessage = err.message || '';

            // Check for specific quota violations
            const isDailyQuota = errorMessage.includes("PerDay");
            if (isDailyQuota) {
                // If we hit the daily limit, no point in retrying immediately
                throw new Error("DAILY_QUOTA_EXCEEDED: You have reached your free tier limit for the day.");
            }

            const isQuotaError = (
                errorMessage.includes("429") ||
                errorMessage.includes("Quota") ||
                errorMessage.includes("quota") ||
                errorMessage.includes("High traffic")
            );

            if (isQuotaError && i < retries - 1) {
                // Shared Quota/Traffic Jam - Retry with backoff
                console.log(`Hit rate limit. Retrying in ${currentDelay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = currentDelay * 2; // Exponential backoff (5s -> 10s -> 20s)
            } else {
                if (isQuotaError) {
                    throw new Error(`RATE_LIMIT_EXCEEDED: Server is busy (High Traffic). Please try again in a minute.`);
                }
                throw error;
            }
        }
    }
    throw new Error("Request failed after max retries.");
};

// Helper to turn blocks back into a readable string for the AI
const stringifyProfile = (profile: ResumeProfile): string => {
    return profile.blocks
        .filter(b => b.isVisible)
        .map(b => {
            return `
BLOCK_ID: ${b.id}
ROLE: ${b.title}
ORG: ${b.organization}
DATE: ${b.dateRange}
DETAILS:
${b.bullets.map(bull => `- ${bull}`).join('\n')}
`;
        })
        .join('\n---\n');
};

export const analyzeJobFit = async (
    jobDescription: string,
    resumes: ResumeProfile[]
): Promise<JobAnalysis> => {

    const resumeContext = resumes
        .map(r => `PROFILE_NAME: ${r.name}\nPROFILE_ID: ${r.id}\nEXPERIENCE BLOCKS:\n${stringifyProfile(r)}\n`)
        .join("\n=================\n");

    const prompt = `
    You are a career strategist. 
    
    INPUT DATA:
    1. RAW JOB TEXT (Scraped): 
    "${jobDescription.substring(0, 15000)}"

    2. MY EXPERIENCE PROFILES (Blocks with IDs):
    ${resumeContext}

    TASK:
    1. DISTILL: Extract the messy job text into a structured format.
    2. ANALYZE: Compare the Job to my experience blocks.
    3. MATCH BREAKDOWN: Identify key strengths and weaknesses.
    4. SCORE: Rate compatibility (0-100).
    5. TAILORING: 
       - Select the specific BLOCK_IDs that are most relevant to this job. Exclude irrelevant ones to keep the resume focused (aim for 1-page relevance).
       - Provide concise instructions on how to tweak the selected blocks.
    
    Return ONLY JSON.
  `;

    return callWithRetry(async () => {
        try {
            const model = getAI().getGenerativeModel({
                model: "gemini-1.5-flash-8b", // Use Flash-8B for structured data extraction
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                ],
            });
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            distilledJob: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    companyName: { type: SchemaType.STRING },
                                    roleTitle: { type: SchemaType.STRING },
                                    applicationDeadline: { type: SchemaType.STRING, nullable: true },
                                    keySkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                    coreResponsibilities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                },
                                required: ["companyName", "roleTitle", "keySkills", "coreResponsibilities"]
                            },
                            compatibilityScore: { type: SchemaType.INTEGER },
                            bestResumeProfileId: { type: SchemaType.STRING },
                            reasoning: { type: SchemaType.STRING },
                            strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            tailoringInstructions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            recommendedBlockIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                        },
                        required: ["compatibilityScore", "bestResumeProfileId", "reasoning", "strengths", "weaknesses", "tailoringInstructions", "distilledJob", "recommendedBlockIds"]
                    }
                }
            });

            const text = response.response.text();
            if (!text) throw new Error("No response from AI");

            // Increment local request counter on success
            const today = new Date().toISOString().split('T')[0];
            const currentCount = JSON.parse(localStorage.getItem('jobfit_daily_usage') || '{}');
            if (currentCount.date !== today) {
                currentCount.date = today;
                currentCount.count = 0;
            }
            currentCount.count++;
            localStorage.setItem('jobfit_daily_usage', JSON.stringify(currentCount));

            return JSON.parse(text) as JobAnalysis;

        } catch (error) {
            throw error; // Re-throw to trigger retry
        }
    });
};


export const generateCoverLetter = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    additionalContext?: string
): Promise<string> => {
    // ... (prompt definition) ...
    const resumeText = stringifyProfile(selectedResume);

    const prompt = `
    You are an expert copywriter. Write a professional cover letter.

    JOB DESCRIPTION:
    ${jobDescription}

    MY EXPERIENCE:
    ${resumeText}

    STRATEGY:
    ${tailoringInstructions.join("\n")}

    ${additionalContext ? `MY ADDITIONAL CONTEXT (Important):
    ${additionalContext}
    Include this context naturally if relevant to the job requirements.` : ''}

    ${tailoringInstructions.includes("CRITIQUE_FIX") ? `
    IMPORTANT - REVISION INSTRUCTIONS:
    The previous draft was reviewed by a hiring manager. Fix these specific issues:
    ${additionalContext} 
    (Note: The text above is the critique feedback, not personal context in this case).
    ` : ''}

    INSTRUCTIONS:
    - Structure:
      1. THE HOOK: Open strong. Mention the specific role/company and ONE key reason you fit (not generic).
      2. THE EVIDENCE: Connect 1-2 specific achievements from my resume directly to their hardest requirements. "You need X, I did X at [Company] by..."
      3. THE CLOSE: Brief, confident call to action.
    - Constraint: Do NOT just repeat resume bullets. Tell the "story" or context behind the achievement. Show *how* you work.
    - Tone: Professional but conversational (human), not robotic.
    - Avoid cliches like "I am writing to apply..." start fresher.
  `;

    return callWithRetry(async () => {
        try {
            const response = await getAI().getGenerativeModel({
                model: 'gemini-2.0-flash', // Use 2.0 Flash for high-quality cover letter writing
            }).generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            return response.response.text() || "Could not generate cover letter.";
        } catch (error) {
            throw error;
        }
    });
};

export const generateTailoredSummary = async (
    jobDescription: string,
    resumes: ResumeProfile[],
): Promise<string> => {

    const resumeContext = resumes
        .map(r => `PROFILE_NAME: ${r.name}\n${stringifyProfile(r)}`)
        .join("\n---\n");

    const prompt = `
    You are an expert resume writer. 
    Write a 2-3 sentence "Professional Summary" for the top of my resume.
    
    TARGET JOB:
    ${jobDescription.substring(0, 5000)}

    MY BACKGROUND:
    ${resumeContext}

    INSTRUCTIONS:
    - Pitch me as the perfect candidate for THIS specific role.
    - Use keywords from the job description.
    - Keep it concise, punchy, and confident (no "I believe", just facts).
    - Do NOT include a header or "Summary:", just the text.
    `;

    return callWithRetry(async () => {
        try {
            const response = await getAI().getGenerativeModel({
                model: 'gemini-1.5-flash-8b', // Use Flash-8B for fast summary generation
            }).generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            return response.response.text() || "Experienced professional with relevant skills.";
        } catch (error) {
            throw error;
        }
    });
};

export const critiqueCoverLetter = async (
    jobDescription: string,
    coverLetter: string
): Promise<{ score: number; decision: 'interview' | 'reject' | 'maybe'; feedback: string[]; strengths: string[] }> => {

    const prompt = `
    You are a strict technical hiring manager. Review this cover letter for the job below.

    JOB:
    ${jobDescription.substring(0, 5000)}

    CANDIDATE LETTER:
    ${coverLetter}

    TASK:
    1. Would you interview this person based *only* on the letter?
    2. Score it 0-10.
    
    CRITIQUE CRITERIA:
    - Does it have a strong "Hook" (referencing the company/role specifically) or is it generic?
    - Is it just repeating the resume? (Bad) vs Telling a story? (Good)
    - Is it concise?

    3. List 3 strengths.
    4. List 3 specific improvements needed to make it a "Must Hire".

    Return specific JSON:
    {
      "score": number, 
      "decision": "interview" | "reject" | "maybe",
      "strengths": ["string"],
      "feedback": ["string"]
    }
    `;

    return callWithRetry(async () => {
        try {
            const model = getAI().getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            score: { type: SchemaType.INTEGER },
                            decision: { type: SchemaType.STRING, enum: ["interview", "reject", "maybe"], format: "enum" },
                            strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            feedback: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                        },
                        required: ["score", "decision", "strengths", "feedback"]
                    }
                }
            });

            const response = await model.generateContent(prompt);
            const text = response.response.text();
            if (!text) throw new Error("No response");
            return JSON.parse(text);
        } catch (error) {
            throw error;
        }
    });
};

// New function to parse PDF/Image into structured blocks
export const parseResumeFile = async (
    fileBase64: string,
    mimeType: string
): Promise<ExperienceBlock[]> => {

    const prompt = `
    Analyze this resume image/document. 
    Break it down into discrete "Experience Blocks". 
    For each job, education, or project, create a block.
    
    Return a JSON Array of objects with this schema:
    {
      "type": "summary" | "work" | "education" | "project" | "skill" | "other",
      "title": "Job Title or Degree",
      "organization": "Company or School Name",
      "dateRange": "e.g. 2020-2022",
      "bullets": ["bullet point 1", "bullet point 2"]
    }
  `;

    return callWithRetry(async () => {
        try {
            const model = getAI().getGenerativeModel({
                model: 'gemini-1.5-flash-8b', // Using cheapest model to avoid rate limits
            });

            const response = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { inlineData: { mimeType, data: fileBase64 } },
                            { text: prompt }
                        ]
                    }
                ],
                // ... (generationConfig) ...
                generationConfig: { // re-inserted since I truncated it in my mental model
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                type: { type: SchemaType.STRING, enum: ["summary", "work", "education", "project", "skill", "other"], format: "enum" },
                                title: { type: SchemaType.STRING },
                                organization: { type: SchemaType.STRING },
                                dateRange: { type: SchemaType.STRING },
                                bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                            },
                            required: ["type", "title", "organization", "bullets"]
                        }
                    }
                }
            });

            const text = response.response.text();
            if (!text) return [];

            // Add IDs to the parsed blocks
            const parsed = JSON.parse(text) as Omit<ExperienceBlock, 'id' | 'isVisible'>[];
            return parsed.map(p => ({
                ...p,
                id: crypto.randomUUID(),
                isVisible: true,
                dateRange: p.dateRange || ''
            }));

        } catch (error) {
            throw error;
        }
    });
};
