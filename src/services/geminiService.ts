import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import { supabase } from "./supabase";
import type { JobAnalysis, ResumeProfile, ExperienceBlock } from "../types";
import { getSecureItem, setSecureItem, removeSecureItem, migrateToSecureStorage } from "../utils/secureStorage";

// Migrate old unencrypted API key to secure storage on first load
let migrationDone = false;
const migrateApiKeyIfNeeded = async () => {
    if (!migrationDone) {
        await migrateToSecureStorage('gemini_api_key', 'api_key');
        migrationDone = true;
    }
};

const getApiKey = async (): Promise<string | null> => {
    await migrateApiKeyIfNeeded();
    return (await getSecureItem('api_key')) || import.meta.env.VITE_API_KEY || null;
};

// Export functions for API key management
export const saveApiKey = async (key: string): Promise<void> => {
    await setSecureItem('api_key', key);
};

export const clearApiKey = (): void => {
    removeSecureItem('api_key');
};

// Helper: Get Model (Direct or Proxy)
const getModel = async (params: any) => {
    const key = await getApiKey();

    // 1. BYOK Mode (Direct to Google)
    if (key) {
        const genAI = new GoogleGenerativeAI(key);
        return genAI.getGenerativeModel(params);
    }

    // 2. Pro Mode (Proxy via Supabase)
    // Returns an object that mimics the `model` interface
    return {
        generateContent: async (payload: any) => {
            console.log("Using Gemini Proxy (Edge Function)...");

            // Construct request body for the Edge Function
            const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                body: {
                    payload: payload,
                    modelName: params.model,
                    generationConfig: params.generationConfig
                }
            });

            if (error) throw new Error(`Proxy Error: ${error.message}`);
            if (data?.error) throw new Error(`AI Error: ${data.error}`);

            // Return compatible response object
            return {
                response: {
                    text: () => data.text
                }
            };
        }
    };
};

export const validateApiKey = async (key: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        await model.generateContent("Test");
        return { isValid: true };
    } catch (error: unknown) {
        //...
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
    You are a ruthless technical recruiter. Your job is to screen candidates for this role.
    
    INPUT DATA:
    1. RAW JOB TEXT (Scraped): 
    "${jobDescription.substring(0, 15000)}"

    2. MY EXPERIENCE PROFILES (Blocks with IDs):
    ${resumeContext}

    TASK:
    1. DISTILL: Extract the messy job text into a structured format.
    2. ANALYZE: Compare the Job to my experience blocks with extreme scrutiny.
    3. MATCH BREAKDOWN: Identify key strengths (PROVEN skills only) and weaknesses (MISSING requirements).
    4. SCORE: Rate compatibility (0-100). Be harsh. matching < 50% = reject.
    5. TAILORING: 
       - Select the specific BLOCK_IDs that are VITAL to this job. Exclude anything irrelevant.
       - Provide concise instructions. Don't say "Highlight your skills." Say "Rename 'Software Engineer' to 'React Developer' to match line 4 of job description."
    
    Return ONLY JSON.
  `;

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: "gemini-2.0-flash", // Use 2.0-flash for structured data extraction
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
                    temperature: 0.0,
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
): Promise<{ text: string; promptVersion: string }> => {
    // ... (prompt definition) ...
    const resumeText = stringifyProfile(selectedResume);

    const PROMPT_VARIANTS = {
        'v1_direct': {
            model: 'gemini-2.0-flash',
            template: `
            You are an expert copywriter. Write a professional cover letter.
            
            INSTRUCTIONS:
            - Structure:
              1. THE HOOK: Open strong. Mention the specific role/company and ONE key reason you fit.
              2. THE EVIDENCE: Connect 1-2 specific achievements from my resume directly to their hardest requirements.
              3. THE CLOSE: Brief, confident call to action.
            - Tone: Professional but conversational (human), not robotic.
            - Avoid cliches like "I am writing to apply..." start fresher.
            `
        },
        'v2_storytelling': {
            model: 'gemini-2.0-flash',
            template: `
            You are a career coach helping a candidate stand out. Write a cover letter that tells a compelling story.
            
            INSTRUCTIONS:
            - DO NOT start with "I am writing to apply". Start with a statement about the company's mission or a specific problem they are solving.
            - Narrative Arc: "I've always been passionate about [Industry/Problem]... which is why [Company] caught my eye."
            - Then pivot to: "In my role at [Previous Org], I faced a similar challenge..." (Insert Resume Evidence).
            - Ending: "I'd love to bring this energy to [Company]."
            - Tone: Enthusiastic, genuine, slightly less formal than a standard corporate letter.
            `
        },
        'v3_experimental_pro': {
            model: 'gemini-1.5-pro', // Testing a stronger model
            template: `
            You are a senior executive writing a cover letter. Write a sophisticated, high-level strategic letter.
            Focus on value proposition and ROI, not just skills.
            `
        }
    };

    // A/B Test Selection (Random)
    const keys = Object.keys(PROMPT_VARIANTS);
    const promptVersion = keys[Math.floor(Math.random() * keys.length)];
    const selectedVariant = PROMPT_VARIANTS[promptVersion as keyof typeof PROMPT_VARIANTS];

    const prompt = `
    ${selectedVariant.template}

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
  `;

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: selectedVariant.model,
            });
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            const text = response.response.text() || "Could not generate cover letter.";
            return { text, promptVersion };
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
            const model = await getModel({
                model: 'gemini-2.0-flash', // Use 2.0 Flash for high-quality cover letter writing
            });
            const response = await model.generateContent({
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
            const model = await getModel({
                model: 'gemini-2.0-flash',
                generationConfig: {
                    temperature: 0.0,
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

// Helper to extract text from PDF (Client Side) to avoid 6MB payload limit
const extractPdfText = async (base64: string): Promise<string> => {
    try {
        // Use global PDF.js from CDN
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
            console.error("PDF.js library not found on window");
            return "";
        };

        const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    } catch (e) {
        console.warn("Client-side PDF extraction failed", e);
        return "";
    }
}

// New function to parse PDF/Image into structured blocks
export const parseResumeFile = async (
    fileBase64: string,
    mimeType: string
): Promise<ExperienceBlock[]> => {

    // 1. Optimize Payload: Process PDF client-side if possible
    let promptParts: any[] = [];

    if (mimeType === 'application/pdf') {
        const extractedText = await extractPdfText(fileBase64);
        if (extractedText.length > 50) {
            console.log("PDF Text Extracted Client-Side", extractedText.length, "chars");
            promptParts = [{ text: `RESUME CONTENT:\n${extractedText}` }];
        } else {
            throw new Error("Could not extract text from PDF. Please upload a text-based PDF, not an image scan.");
        }
    } else {
        // Images must go as binary
        promptParts = [{ inlineData: { mimeType, data: fileBase64 } }];
    }

    const prompt = `
    Analyze this resume content. 
    Break it down into discrete "Experience Blocks". 
    For each job, education, or project, create a block.

    CRITICAL SAFETY CHECK:
    If this document is NOT a resume/CV (e.g. it is a receipt, a random photo, spam, hate speech, or offensive content), 
    return a single block with type="other", title="INVALID_DOCUMENT", and put the reason in the bullets.
    
    Return a JSON Array of objects with this schema:
    {
      "type": "summary" | "work" | "education" | "project" | "skill" | "other",
      "title": "Job Title or Degree",
      "organization": "Company or School Name",
      "dateRange": "e.g. 2020-2022",
      "bullets": ["bullet point 1", "bullet point 2"]
    }
  `;

    // Add prompt instructions
    promptParts.push({ text: prompt });

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: 'gemini-2.0-flash', // Using 2.0-flash as standard model
                generationConfig: {
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

            const response = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: promptParts
                    }
                ]
            });

            const text = response.response.text();
            if (!text) return [];

            // Add IDs to the parsed blocks
            const parsed = JSON.parse(text) as Omit<ExperienceBlock, 'id' | 'isVisible'>[];

            // Safety Check
            if (parsed.length > 0 && parsed[0].title === 'INVALID_DOCUMENT') {
                throw new Error(`Upload rejected: ${parsed[0].bullets[0] || "File does not appear to be a resume."}`);
            }

            return parsed.map(p => ({
                ...p,
                id: crypto.randomUUID(),
                isVisible: true,
                dateRange: p.dateRange || ''
            }));

        } catch (error: any) {
            console.error("Parse Resume Failed:", error);
            // Return empty array or throw? UI expects void or array.
            throw error;
        }
    });
};

// New function to parse raw HTML into JobFeedItems (Client-Side Fallback)
export const parseJobListing = async (
    html: string,
    baseUrl: string
): Promise<any[]> => {
    // Truncate HTML to save tokens
    const cleanHtml = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
        .replace(/\s+/g, " ")
        .substring(0, 20000);

    const prompt = `
    You are a smart scraper. Extract job listings from this HTML. 
    
    CRITICAL INSTRUCTIONS:
    1. Look for lists of jobs, tables, or repeated "card" elements.
    2. For TTC/SAP sites, jobs might be in a "current opportunities" section or a search results table.
    3. Tables often have "Job Title", "Date", "Location" columns.
    4. If you see a "Search Jobs" button but NO results, return an empty array (do not hallucinate).
    5. Extract the REAL link (href). Resolving relative URLs against "${baseUrl}".
    
    Return ONLY a JSON array. No markdown.
    
    Schema:
    [
      {
        "title": "string (The clear job title)",
        "url": "string (The absolute URL to the specific job details)",
        "company": "string (Default to 'TTC' if not found)",
        "location": "string (e.g. Toronto)",
        "postedDate": "string (ISO date or 'Recently')"
      }
    ]

    HTML Content:
    ${cleanHtml}
  `;

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: 'gemini-2.0-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING },
                                url: { type: SchemaType.STRING },
                                company: { type: SchemaType.STRING },
                                location: { type: SchemaType.STRING },
                                postedDate: { type: SchemaType.STRING }
                            },
                            required: ["title", "url", "company"]
                        }
                    }
                }
            });

            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const text = response.response.text();
            if (!text) return [];

            return JSON.parse(text);
        } catch (error) {
            console.error("Client-side parse failed:", error);
            return [];
        }
    });
};

export const tailorExperienceBlock = async (
    block: ExperienceBlock,
    jobDescription: string,
    instructions: string[]
): Promise<string[]> => {

    // Safety check for empty/invalid blocks
    if (!block.bullets || block.bullets.length === 0) return [];

    const prompt = `
    You are an expert resume writer. 
    Rewrite the bullet points for this specific job experience to perfectly match the target job description.

    TARGET JOB:
    ${jobDescription.substring(0, 3000)}

    MY EXPERIENCE BLOCK:
    Title: ${block.title}
    Company: ${block.organization}
    Original Bullets:
    ${block.bullets.map(b => `- ${b}`).join('\n')}

    TAILORING INSTRUCTIONS (Strategy):
    ${instructions.join('\n')}

    TASKS:
    1. Rewrite the bullets to use keywords from the Target Job.
    2. Shift the focus to relevant skills (e.g. if job needs "Leadership", emphasize leading the team).
    3. Quantify impact where possible.
    4. Keep the same number of bullets (or fewer if some are irrelevant).
    5. Tone: Action-oriented, professional, high-impact.

    Return ONLY a JSON array of strings: ["bullet 1", "bullet 2"]
    `;

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: 'gemini-2.0-flash',
                generationConfig: {
                    temperature: 0.3, // Little bit of creativity allowed for phrasing
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING }
                    }
                }
            });

            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const text = response.response.text();
            if (!text) return block.bullets; // Fallback

            return JSON.parse(text);
        } catch (error) {
            console.error("Tailoring failed:", error);
            // Fallback to original bullets on error
            return block.bullets;
        }
    });
};
