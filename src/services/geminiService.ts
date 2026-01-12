import { GoogleGenAI, Type } from "@google/genai";
import type { JobAnalysis, ResumeProfile, ExperienceBlock } from "../types";

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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        distilledJob: {
                            type: Type.OBJECT,
                            properties: {
                                companyName: { type: Type.STRING },
                                roleTitle: { type: Type.STRING },
                                applicationDeadline: { type: Type.STRING, nullable: true },
                                keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                                coreResponsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ["companyName", "roleTitle", "keySkills", "coreResponsibilities"]
                        },
                        compatibilityScore: { type: Type.INTEGER },
                        bestResumeProfileId: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tailoringInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendedBlockIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["compatibilityScore", "bestResumeProfileId", "reasoning", "strengths", "weaknesses", "tailoringInstructions", "distilledJob", "recommendedBlockIds"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as JobAnalysis;

    } catch (error) {
        console.error("Analysis failed", error);
        throw new Error("Failed to analyze job fit.");
    }
};

export const generateCoverLetter = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    additionalContext?: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
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

    INSTRUCTIONS:
    - Keep it under 250 words.
    - Tone: Professional, enthusiastic, confident.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Could not generate cover letter.";
    } catch (error) {
        console.error("Cover letter generation failed", error);
        throw new Error("Failed to generate cover letter.");
    }
};

// New function to parse PDF/Image into structured blocks
export const parseResumeFile = async (
    fileBase64: string,
    mimeType: string
): Promise<ExperienceBlock[]> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: fileBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ["summary", "work", "education", "project", "skill", "other"] },
                            title: { type: Type.STRING },
                            organization: { type: Type.STRING },
                            dateRange: { type: Type.STRING },
                            bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["type", "title", "organization", "bullets"]
                    }
                }
            }
        });

        const text = response.text;
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
        console.error("File parsing failed", error);
        throw new Error("Failed to parse file.");
    }
};
