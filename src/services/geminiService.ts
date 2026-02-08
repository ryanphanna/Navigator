import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { supabase } from "./supabase";
import type {
    JobAnalysis,
    ResumeProfile,
    ExperienceBlock,
    CustomSkill,
    DistilledJob,
    RoleModelProfile,
    GapAnalysisResult,
    RoadmapMilestone,
    Transcript,
    VerificationCache
} from "../types";
import { getSecureItem, setSecureItem, removeSecureItem, migrateToSecureStorage } from "../utils/secureStorage";
import { getUserFriendlyError, getRetryMessage } from "../utils/errorMessages";
import { API_CONFIG, CONTENT_VALIDATION, AI_MODELS, AI_TEMPERATURE, STORAGE_KEYS } from "../constants";
import { ANALYSIS_PROMPTS } from "../prompts/analysis";
import { PARSING_PROMPTS } from "../prompts/parsing";

// Callback type for retry progress
export type RetryProgressCallback = (message: string, attempt: number, maxAttempts: number) => void;

// Migrate old unencrypted API key to secure storage on first load
let migrationDone = false;
const migrateApiKeyIfNeeded = async () => {
    if (!migrationDone) {
        await migrateToSecureStorage('gemini_api_key', STORAGE_KEYS.API_KEY);
        migrationDone = true;
    }
};

const getApiKey = async (): Promise<string | null> => {
    await migrateApiKeyIfNeeded();
    return (await getSecureItem(STORAGE_KEYS.API_KEY)) || import.meta.env.VITE_API_KEY || null;
};

// Export functions for API key management
export const saveApiKey = async (key: string): Promise<void> => {
    await setSecureItem(STORAGE_KEYS.API_KEY, key);
};

export const clearApiKey = (): void => {
    removeSecureItem(STORAGE_KEYS.API_KEY);
};

// Helper: Get Model (Direct or Proxy)
interface ModelParams {
    model: string;
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
        responseSchema?: any;
    };
}

const getModel = async (params: ModelParams) => {
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
                    text: () => data.text as string
                }
            };
        }
    };
};

export const validateApiKey = async (key: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });
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
            else errorMessage = `Validation failed: ${e.message} `;
        }
        return { isValid: false, error: errorMessage };
    }
}

// Helper for persistent logging to Supabase
const logToSupabase = async (params: {
    event_type: string;
    model_name: string;
    prompt_text: string;
    response_text?: string;
    latency_ms?: number;
    status: 'success' | 'error';
    error_message?: string;
    metadata?: Record<string, unknown>;
}) => {
    // Helper: Redact PII (Emails, Phones) before logging
    const redactContent = (text?: string) => {
        if (!text) return text;
        return text
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
            .replace(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g, "[PHONE_REDACTED]");
    };

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        await supabase.from('logs').insert({
            user_id: userId,
            event_type: params.event_type,
            model_name: params.model_name,
            prompt_text: redactContent(params.prompt_text),
            response_text: redactContent(params.response_text),
            latency_ms: params.latency_ms,
            status: params.status,
            error_message: params.error_message,
            metadata: params.metadata || {}
        });

        // 2. Update Daily Usage Metrics (Fire & Forget)
        const tokenUsage = (params.metadata?.token_usage as any)?.totalTokens;
        if (tokenUsage && typeof tokenUsage === 'number') {
            supabase.rpc('track_usage', { p_tokens: tokenUsage }).then(({ error }) => {
                if (error) {
                    // Silent fail - the user might not have applied the migration yet
                    // console.warn("Usage tracking skipped (RPC not found or db error)");
                }
            });
        }

    } catch (err) {
        console.error("Failed to write log to Supabase:", err);
    }
};

// Helper for exponential backoff retries on 429 errors
// User requested more conservative polling and detailed error surfacing
const callWithRetry = async <T>(
    fn: (executionMetadata: Record<string, any>) => Promise<T>,
    context: { event_type: string; prompt: string; model: string; metadata?: Record<string, unknown> },
    retries: number = API_CONFIG.MAX_RETRIES,
    initialDelay = API_CONFIG.INITIAL_RETRY_DELAY_MS,
    onProgress?: RetryProgressCallback
): Promise<T> => {
    let currentDelay = initialDelay;
    const startTime = Date.now();

    for (let i = 0; i < retries; i++) {
        const executionMetadata: Record<string, any> = {}; // Container for inner func to write to
        try {
            const result = await fn(executionMetadata);

            // Log successful attempt
            const latency = Date.now() - startTime;
            logToSupabase({
                event_type: context.event_type,
                model_name: context.model,
                prompt_text: context.prompt,
                response_text: typeof result === 'string' ? result : JSON.stringify(result),
                latency_ms: latency,
                status: 'success',
                metadata: { ...context.metadata, ...executionMetadata }
            });

            return result;
        } catch (error: unknown) {
            const err = error as Error;
            const errorMessage = err.message || '';

            // Check for specific quota violations
            const isDailyQuota = errorMessage.includes("PerDay");
            if (isDailyQuota) {
                // Log failure
                logToSupabase({
                    event_type: context.event_type,
                    model_name: context.model,
                    prompt_text: context.prompt,
                    status: 'error',
                    error_message: errorMessage,
                    latency_ms: Date.now() - startTime
                });

                const friendlyError = getUserFriendlyError("DAILY_QUOTA_EXCEEDED");
                throw new Error(friendlyError);
            }

            const isQuotaError = (
                errorMessage.includes("429") ||
                errorMessage.includes("Quota") ||
                errorMessage.includes("quota") ||
                errorMessage.includes("High traffic")
            );

            if (isQuotaError && i < retries - 1) {
                // Shared Quota/Traffic Jam - Retry with backoff
                const delaySeconds = currentDelay / 1000;
                const retryMsg = getRetryMessage(i + 1, retries, delaySeconds);
                console.log(retryMsg);

                // Notify UI of retry progress
                if (onProgress) {
                    onProgress(retryMsg, i + 1, retries);
                }

                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = currentDelay * 2; // Exponential backoff (2s -> 4s -> 8s)
            } else {
                // Log final failure
                logToSupabase({
                    event_type: context.event_type,
                    model_name: context.model,
                    prompt_text: context.prompt,
                    status: 'error',
                    error_message: errorMessage,
                    latency_ms: Date.now() - startTime,
                    metadata: { attempt: i + 1 }
                });

                if (isQuotaError) {
                    const friendlyError = getUserFriendlyError("RATE_LIMIT_EXCEEDED");
                    throw new Error(friendlyError);
                }
                // Convert technical error to friendly message
                throw new Error(getUserFriendlyError(err));
            }
        }
    }
    throw new Error("Request failed after multiple attempts. Please try again later.");
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

// Helper: Sanitize input to remove internal metadata like BLOCK_ID
const sanitizeInput = (text: string): string => {
    return text.replace(/BLOCK_ID:\s*[a-zA-Z0-9-]+/g, '')
        .replace(/\(BLOCK_ID:\s*[a-zA-Z0-9-]+\)/g, '');
};

// Helper to clean JSON output from AI (handles markdown code blocks and surrounding text)
const cleanJsonOutput = (text: string): string => {
    let cleaned = text.trim();
    // Try to extract content inside markdown code blocks first
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
        cleaned = codeBlockMatch[1];
    }
    // Fallback: simple strip of start/end if regex failed but it still looks like markdown
    else {
        cleaned = cleaned.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
    }
    return cleaned.trim();
};

// STAGE 1: Extract job metadata and clean description (Flash - fast, cheap, small output)
const extractJobInfo = async (
    rawJobText: string
): Promise<{ distilledJob: DistilledJob; cleanedDescription: string }> => {

    console.log('🤖 Stage 1/2: Extracting job details (Flash)');

    const extractionPrompt = `You are a job posting analyzer. Extract key information and clean this job posting.

RAW JOB POSTING:
${rawJobText.substring(0, CONTENT_VALIDATION.MAX_JOB_DESCRIPTION_LENGTH)}

TASK:
1. Extract metadata:
   - company name (e.g. "Google", "TTC", "City of Toronto")
   - job title (**CRITICAL**: Look for specific role titles. In messy SuccessFactors/SAP scrapings, the title is often near the top, sometimes following "Career Opportunities:". **EXAMPLES**: "Transit Operator", "Technical Specialist", "Project Manager". **STRICT RULE**: Do NOT return "Job Post", "Job Description", "Career Opportunities", "This Candidate", or "N/A". If the title is missing, INFER it from the responsibilities, e.g. "Software Engineer" or "Administrative Assistant".)
   - location (e.g. "Toronto", "Remote", "Hybrid")
   - application deadline (if mentioned, else null)
   - salary range (if mentioned, else null)
   - source (e.g. "LinkedIn", "Company Website", "Indeed", "SuccessFactors")
2. Extract required skills with proficiency levels:
   - 'learning': Familiarity, exposure, want to learn, junior-level
   - 'comfortable': Proficient, strong understanding, 2-5 years
   - 'expert': Advanced, lead, deep knowledge, 5-8+ years
   - **STRICT RULE**: DO NOT include generic soft skills like "Communication", "Interpersonal skills", "Organizational", "Detail-oriented", "Motivated", "Team player" UNLESS the role is purely administrative.
   - **STRICT RULE**: Group synonyms (e.g. "Urban Planning / Urban Studies", "React / React.js", "Adobe Suite (Ps, Ai, Id)").
3. Extract key skills (simple list format) - Apply the same strict rules as above. Focus on hard technical skills, tools, software, and specific domain knowledge.
4. Extract core responsibilities
5. **CRITICAL: Clean the job description AGGRESSIVELY.**
   - REMOVE: generic company intros ("We offer specific positions...", "The TTC is North America's third largest..."), mission statements, equal opportunity disclaimers, "About Us" sections, and generic recruitment process text.
   - KEEP ONLY: The specific role description, daily responsibilities, and concrete eligibility/qualifications.

Return JSON with: distilledJob (object) and cleanedDescription (string)`;

    return callWithRetry(async () => {
        const model = await getModel({ model: AI_MODELS.FLASH });
        const promptParts = [{ text: extractionPrompt }];
        const response = await model.generateContent({
            contents: [{ role: "user", parts: promptParts }],
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        distilledJob: {
                            type: SchemaType.OBJECT,
                            properties: {
                                companyName: { type: SchemaType.STRING },
                                roleTitle: { type: SchemaType.STRING },
                                location: { type: SchemaType.STRING, nullable: true },
                                applicationDeadline: { type: SchemaType.STRING, nullable: true },
                                salaryRange: { type: SchemaType.STRING, nullable: true },
                                source: { type: SchemaType.STRING, nullable: true },
                                requiredSkills: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            name: { type: SchemaType.STRING },
                                            level: { type: SchemaType.STRING, enum: ["learning", "comfortable", "expert"], format: "enum" }
                                        },
                                        required: ["name", "level"]
                                    }
                                },
                                keySkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                coreResponsibilities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                            },
                            required: ["companyName", "roleTitle", "keySkills", "requiredSkills", "coreResponsibilities"]
                        },
                        cleanedDescription: { type: SchemaType.STRING }
                    },
                    required: ["distilledJob", "cleanedDescription"]
                }
            }
        });

        const text = response.response.text();
        if (!text || !text.trim()) throw new Error("Empty response from extraction");

        const parsed = JSON.parse(cleanJsonOutput(text));

        if (!parsed.distilledJob || !parsed.cleanedDescription) {
            throw new Error("Missing required fields in extraction response");
        }

        console.log('✅ Stage 1 complete');
        return parsed;
    }, {
        event_type: 'job_extraction',
        prompt: extractionPrompt,
        model: AI_MODELS.FLASH
    });
};

// STAGE 2 + MAIN EXPORT: Analyze compatibility (Pro - smarter, higher token limit)
export const analyzeJobFit = async (
    jobDescription: string,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[] = [],
    onProgress?: RetryProgressCallback
): Promise<JobAnalysis> => {

    // Stage 1: Extract and clean (Flash)
    if (onProgress) onProgress("Extracting job details...", 1, 2);
    const { distilledJob, cleanedDescription } = await extractJobInfo(jobDescription);

    // Stage 2: Analyze with Pro model (ONLY if resumes exist)
    if (resumes.length === 0) {
        console.log('⚠️ No resumes provided. Skipping Stage 2 (Analysis). Returning extraction only.');
        return {
            distilledJob,
            cleanedDescription,
            // Return Partial Analysis
        } as JobAnalysis;
    }

    if (onProgress) onProgress("Analyzing your fit (Pro model)...", 2, 2);
    console.log('🧠 Stage 2/2: Analyzing compatibility (Pro)');

    const resumeContext = resumes
        .map(r => `PROFILE_NAME: ${r.name} \nPROFILE_ID: ${r.id} \nEXPERIENCE BLOCKS: \n${stringifyProfile(r)} \n`)
        .join("\n=================\n");

    const skillContext = userSkills.length > 0
        ? `YOUR SKILLS: \n${userSkills.map(s => `- ${s.name}: ${s.proficiency} (Evidence: ${s.evidence})`).join('\n')} \n`
        : '';

    const analysisPrompt = `You are a ruthless technical recruiter analyzing candidate fit.

JOB POSTING:
Company: ${distilledJob.companyName}
Role: ${distilledJob.roleTitle}
${distilledJob.salaryRange ? `Salary: ${distilledJob.salaryRange}` : ''}
${distilledJob.applicationDeadline ? `Deadline: ${distilledJob.applicationDeadline}` : ''}

REQUIREMENTS(Cleaned):
${cleanedDescription}

MY EXPERIENCE:
${resumeContext}

${skillContext}

TASK:
1. SCORE: Rate compatibility 0 - 100.
2. MATCH BREAKDOWN: Identify PROVEN strengths and MISSING / UNDER-LEVELLED weaknesses.
3. BEST RESUME: Pick the profile ID that fits best.
4. REASONING: Explain the score in 2 - 3 sentences.
5. TAILORING INSTRUCTIONS: Provide TWO SEPARATE lists of specific tailoring advice:
   - resumeTailoringInstructions: Tips for optimizing the RESUME (ATS keywords, relevant blocks, phrasing). Select specific BLOCK_IDs that are VITAL.
   - coverLetterTailoringInstructions: Tips for writing a compelling COVER LETTER (tone, storytelling, addressing gaps).
6. PERSONA: Address as "You", not "The Candidate"

Return ONLY JSON with: compatibilityScore, bestResumeProfileId, reasoning, strengths, weaknesses, resumeTailoringInstructions, coverLetterTailoringInstructions, recommendedBlockIds`;


    const analysis = await callWithRetry(async (meta) => {
        const model = await getModel({ model: AI_MODELS.PRO });
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        compatibilityScore: { type: SchemaType.NUMBER },
                        bestResumeProfileId: { type: SchemaType.STRING },
                        reasoning: { type: SchemaType.STRING },
                        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        resumeTailoringInstructions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        coverLetterTailoringInstructions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        recommendedBlockIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    },
                    required: ["compatibilityScore", "bestResumeProfileId", "reasoning", "strengths", "weaknesses", "resumeTailoringInstructions", "coverLetterTailoringInstructions"]
                }
            }
        });

        const usageMetadata = (response as any).usageMetadata;
        if (usageMetadata) {
            meta.token_usage = {
                promptTokens: usageMetadata.promptTokenCount,
                outputTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount
            };
            console.log('📊 Token Usage:', meta.token_usage);
        }

        const text = response.response.text();
        if (!text || !text.trim()) throw new Error("Empty response from analysis");

        const today = new Date().toISOString().split('T')[0];
        const currentCount = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_USAGE) || '{}');
        if (currentCount.date !== today) {
            currentCount.date = today;
            currentCount.count = 0;
        }
        currentCount.count++;
        localStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(currentCount));

        const parsed = JSON.parse(cleanJsonOutput(text));

        if (!parsed.compatibilityScore || !parsed.bestResumeProfileId) {
            throw new Error("Missing required fields in analysis response");
        }

        console.log('✅ Stage 2 complete');
        return parsed;
    }, {
        event_type: 'analysis',
        prompt: analysisPrompt,
        model: AI_MODELS.PRO
    }, 3, 2000, onProgress);

    return {
        ...analysis,
        distilledJob,
        cleanedDescription
    };
};


export const generateCoverLetter = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    additionalContext?: string,
    forceVariant?: string,
    trajectoryContext?: string
): Promise<{ text: string; promptVersion: string }> => {
    // ... (prompt definition) ...
    // Sanitize resume text to remove BLOCK IDs
    const resumeText = sanitizeInput(stringifyProfile(selectedResume));

    // Use extracted templates/prompts
    const PROMPT_VARIANTS = ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS;

    // A/B Test Selection (Random or Forced)
    const keys = Object.keys(PROMPT_VARIANTS);
    const promptVersion = forceVariant && keys.includes(forceVariant)
        ? forceVariant
        : keys[Math.floor(Math.random() * keys.length)];
    const selectedVariantTemplate = PROMPT_VARIANTS[promptVersion as keyof typeof PROMPT_VARIANTS];
    const selectedModel = promptVersion === 'v3_experimental_pro' ? AI_MODELS.PRO : AI_MODELS.FLASH;

    const prompt = ANALYSIS_PROMPTS.COVER_LETTER.GENERATE(
        selectedVariantTemplate,
        jobDescription,
        resumeText,
        tailoringInstructions,
        additionalContext,
        trajectoryContext
    );

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: selectedModel,
            });
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            const text = response.response.text() || "Could not generate cover letter.";
            return { text, promptVersion };
        } catch (error) {
            throw error;
        }
    }, {
        event_type: 'cover_letter',
        prompt: prompt,
        model: selectedModel,
        metadata: {
            prompt_variant: promptVersion,
            is_ab_test: !!forceVariant
        }
    });
};

// Pro Feature: Smart Quality-Gated Cover Letter Generation
// Logic: Try until score >= 75, but stop early if quality improves
// If attempt 2 gets worse, try once more (max 3 attempts)
export const generateCoverLetterWithQuality = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    additionalContext?: string,
    onProgress?: (message: string) => void,
    trajectoryContext?: string
): Promise<{ text: string; promptVersion: string; score: number; attempts: number }> => {
    const QUALITY_THRESHOLD = 75;
    const PROMPT_VARIANTS = Object.keys(ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS);
    const usedVariants: string[] = [];
    const attempts: Array<{ text: string; promptVersion: string; score: number }> = [];

    // Attempt 1: Random variant
    onProgress?.("Generating cover letter...");
    const attempt1 = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, additionalContext, undefined, trajectoryContext);
    usedVariants.push(attempt1.promptVersion);

    onProgress?.("Evaluating quality...");
    const critique1 = await critiqueCoverLetter(jobDescription, attempt1.text);
    attempts.push({ ...attempt1, score: critique1.score });

    console.log(`[Quality Gate] Attempt 1(${attempt1.promptVersion}): Score ${critique1.score}/100`);

    // Stop if threshold met
    if (critique1.score >= QUALITY_THRESHOLD) {
        return { ...attempt1, score: critique1.score, attempts: 1 };
    }

    // Attempt 2: Different variant (score was < 75)
    onProgress?.("Optimizing quality...");
    const availableVariants2 = PROMPT_VARIANTS.filter(v => !usedVariants.includes(v));
    const variant2 = availableVariants2[Math.floor(Math.random() * availableVariants2.length)];

    const attempt2 = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, additionalContext, variant2, trajectoryContext);
    usedVariants.push(attempt2.promptVersion);

    onProgress?.("Evaluating quality...");
    const critique2 = await critiqueCoverLetter(jobDescription, attempt2.text);
    attempts.push({ ...attempt2, score: critique2.score });

    console.log(`[Quality Gate] Attempt 2 (${attempt2.promptVersion}): Score ${critique2.score}/100`);

    // Stop if threshold met
    if (critique2.score >= QUALITY_THRESHOLD) {
        return { ...attempt2, score: critique2.score, attempts: 2 };
    }

    // Stop if quality improved (even if still below threshold)
    if (critique2.score >= critique1.score) {
        console.log(`[Quality Gate] Quality improved (${critique2.score} >= ${critique1.score}). Stopping.`);
        return { ...attempt2, score: critique2.score, attempts: 2 };
    }

    // Attempt 3: Quality got worse, try once more
    console.log(`[Quality Gate] Quality decreased (${critique2.score} < ${critique1.score}). Final attempt.`);
    onProgress?.("Final optimization...");

    const availableVariants3 = PROMPT_VARIANTS.filter(v => !usedVariants.includes(v));
    const variant3 = availableVariants3.length > 0
        ? availableVariants3[Math.floor(Math.random() * availableVariants3.length)]
        : PROMPT_VARIANTS[Math.floor(Math.random() * PROMPT_VARIANTS.length)];

    const attempt3 = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, additionalContext, variant3, trajectoryContext);

    onProgress?.("Evaluating quality...");
    const critique3 = await critiqueCoverLetter(jobDescription, attempt3.text);
    attempts.push({ ...attempt3, score: critique3.score });

    console.log(`[Quality Gate] Attempt 3 (${attempt3.promptVersion}): Score ${critique3.score}/100`);

    // Return best of all 3 attempts
    const best = attempts.reduce((prev, curr) => curr.score > prev.score ? curr : prev);
    console.log(`[Quality Gate] Final: Using best attempt with score ${best.score}/100`);
    return { text: best.text, promptVersion: best.promptVersion, score: best.score, attempts: 3 };
};

export const generateTailoredSummary = async (
    jobDescription: string,
    resumes: ResumeProfile[],
): Promise<string> => {

    const resumeContext = resumes
        .map(r => `PROFILE_NAME: ${r.name}\n${sanitizeInput(stringifyProfile(r))}`) // Sanitize input
        .join("\n---\n");

    const prompt = ANALYSIS_PROMPTS.TAILORED_SUMMARY(jobDescription, resumeContext);

    return callWithRetry(async (meta) => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            summary: { type: SchemaType.STRING }
                        },
                        required: ["summary"]
                    }
                }
            });
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            // Log Token Usage
            const usageMetadata = (response as any).usageMetadata;
            if (usageMetadata) {
                meta.token_usage = {
                    promptTokens: usageMetadata.promptTokenCount,
                    outputTokens: usageMetadata.candidatesTokenCount,
                    totalTokens: usageMetadata.totalTokenCount
                };
            }

            const text = response.response.text();
            if (!text) return "Summary generation failed.";
            const parsed = JSON.parse(text);
            return parsed.summary;
            // Note: We are now moving towards JSON for summary if possible, but currently keep text.
            // If we switch prompt to JSON, we'd use responseMimeType: "application/json".
            // For now, assuming text response.
        } catch (error) {
            throw error;
        }
    }, {
        event_type: 'tailored_summary',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

export const critiqueCoverLetter = async (
    jobDescription: string,
    coverLetter: string
): Promise<{ score: number; decision: 'interview' | 'reject' | 'maybe'; feedback: string[]; strengths: string[] }> => {

    const prompt = ANALYSIS_PROMPTS.CRITIQUE_COVER_LETTER(jobDescription, coverLetter);

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH,
                generationConfig: {
                    temperature: AI_TEMPERATURE.STRICT,
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

            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });
            const text = response.response.text();
            if (!text) throw new Error("No response");

            // No regex needed
            return JSON.parse(text) as { score: number; decision: 'interview' | 'reject' | 'maybe'; feedback: string[]; strengths: string[] };
        } catch (error) {
            throw error;
        }
    }, {
        event_type: 'critique',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

// Helper to extract text from PDF (Client Side) to avoid 6MB payload limit
const extractPdfText = async (base64: string): Promise<string> => {
    try {
        // Use global PDF.js from CDN
        const pdfjsLib = (window as unknown as Record<string, any>).pdfjsLib;
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
            const pageText = (textContent.items as Array<{ str: string }>).map((item) => item.str).join(' ');
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
        if (extractedText.length > CONTENT_VALIDATION.MIN_PDF_TEXT_LENGTH) {
            console.log("PDF Text Extracted Client-Side", extractedText.length, "chars");
            promptParts = [{ text: `RESUME CONTENT:\n${extractedText}` }];
        } else {
            throw new Error("Could not extract text from PDF. Please upload a text-based PDF, not an image scan.");
        }
    } else {
        // Images must go as binary
        promptParts = [{ inlineData: { mimeType, data: fileBase64 } }];
    }

    const prompt = PARSING_PROMPTS.RESUME_PARSE();

    // Add prompt instructions
    promptParts.push({ text: prompt });

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH, // Using 2.0-flash as standard model
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

            // Strip markdown code blocks if present
            const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

            // Add IDs to the parsed blocks
            const parsed = JSON.parse(cleanedText) as Omit<ExperienceBlock, 'id' | 'isVisible'>[];

            // Safety Check
            if (parsed.length > 0 && (parsed[0] as any).title === 'INVALID_DOCUMENT') {
                throw new Error(`Upload rejected: ${(parsed[0] as any).bullets[0] || "File does not appear to be a resume."}`);
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
    }, {
        event_type: 'parsing',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

export const analyzeMAEligibility = async (
    transcript: Transcript,
    targetProgram: string
): Promise<{
    probability: 'High' | 'Medium' | 'Low';
    analysis: string;
    gpaVerdict: string;
    gpaContext: string;
    weaknesses: string[];
    recommendations: string[];
}> => {

    // Construct context
    const transcriptSummary = `
    Student: ${transcript.studentName || 'Unknown'}
    University: ${transcript.university || 'Unknown'}
    Program: ${transcript.program || 'Unknown'}
    cGPA: ${transcript.cgpa || 'Not calculated'}
    
    COURSES:
    ${transcript.semesters.map(s =>
        `${s.term} ${s.year}:\n${s.courses.map(c => `- ${c.code}: ${c.title} (${c.grade})`).join('\n')}`
    ).join('\n\n')}
    `;

    const prompt = ANALYSIS_PROMPTS.GRAD_SCHOOL_ELIGIBILITY(transcriptSummary, targetProgram);

    return callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
            generationConfig: {
                responseMimeType: "application/json",
                // schema handled via prompt instruction
            }
        });

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const text = response.response.text();
        if (!text) throw new Error("No analysis generated");

        const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        return JSON.parse(cleanedText);
    }, {
        event_type: 'ma_eligibility',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

export const extractSkillsFromCourses = async (
    transcript: Transcript
): Promise<Array<{ name: string; category: 'hard' | 'soft'; proficiency: 'learning' | 'comfortable' | 'expert'; evidence: string }>> => {

    // Flatten courses into a list
    const coursesList = transcript.semesters.map(s =>
        s.courses.map(c => `${c.code}: ${c.title}`).join('\n')
    ).join('\n');

    const prompt = ANALYSIS_PROMPTS.COURSE_SKILL_EXTRACTION(coursesList);

    return callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const text = response.response.text();
        if (!text) return [];

        return JSON.parse(text);
    }, {
        event_type: 'course_skill_extraction',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

// New function to parse raw HTML into JobFeedItems (Client-Side Fallback)
export const parseTranscript = async (
    fileBase64: string,
    mimeType: string = 'application/pdf'
): Promise<Transcript> => {

    // Reuse PDF extraction logic
    let extractedText = '';
    if (mimeType === 'application/pdf') {
        extractedText = await extractPdfText(fileBase64);
        if (extractedText.length < 50) {
            throw new Error("Could not extract text from PDF. Please ensure it is a text-based PDF.");
        }
    } else {
        throw new Error("Only PDF transcripts are supported currently.");
    }

    const prompt = PARSING_PROMPTS.TRANSCRIPT_PARSE(extractedText);

    return callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
            generationConfig: {
                responseMimeType: "application/json",
                // We use auto-schema via prompt instruction instead of strict schema for flexibility with bad PDF text
            }
        });

        const response = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { inlineData: { mimeType, data: fileBase64 } },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                responseMimeType: "application/json",
            }
        });

        const text = response.response.text();
        if (!text) throw new Error("No response from AI");

        const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (parsed.error) {
            throw new Error(parsed.error);
        }

        return {
            ...parsed,
            id: crypto.randomUUID(),
            dateUploaded: Date.now(),
            rawText: extractedText
        };
    }, {
        event_type: 'transcript_parsing',
        prompt: prompt,
        model: AI_MODELS.FLASH
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

    const prompt = PARSING_PROMPTS.JOB_LISTING_PARSE(cleanHtml, baseUrl);

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH,
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

            // Strip markdown code blocks if present
            const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("Client-side parse failed:", error);
            return [];
        }
    }, {
        event_type: 'listing_parse',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

export const tailorExperienceBlock = async (
    block: ExperienceBlock,
    jobDescription: string,
    instructions: string[]
): Promise<string[]> => {

    // Safety check for empty/invalid blocks
    if (!block.bullets || block.bullets.length === 0) return [];

    const prompt = ANALYSIS_PROMPTS.TAILOR_EXPERIENCE_BLOCK(
        jobDescription,
        block.title,
        block.organization,
        block.bullets,
        instructions
    );

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH,
                generationConfig: {
                    temperature: AI_TEMPERATURE.BALANCED, // Little bit of creativity allowed for phrasing
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

            // No regex needed
            return JSON.parse(text);
        } catch (error) {
            console.error("Tailoring failed:", error);
            // Fallback to original bullets on error
            return block.bullets;
        }
    }, {
        event_type: 'tailoring_block',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};
export const inferProficiencyFromResponse = async (
    skillName: string,
    userResponse: string
): Promise<{ proficiency: CustomSkill['proficiency']; evidence: string }> => {

    const prompt = `
        Analyze the following user statement about their experience with the skill: "${skillName}".
        Inference their proficiency based on these rules:
        - "learning": Beginner, currently studying, little practical application.
        - "comfortable": Intermediate, has used in projects, solid understanding.
        - "expert": Advanced, deep knowledge, years of experience, or handled complex high-stakes tasks.

        User Statement: "${userResponse}"

        Return a JSON object with:
        {
          "proficiency": "learning" | "comfortable" | "expert",
          "evidence": "A very concise 1-sentence summary of the evidence shared."
        }
    `;

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH,
                generationConfig: {
                    temperature: AI_TEMPERATURE.STRICT,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            proficiency: { type: SchemaType.STRING, enum: ["learning", "comfortable", "expert"], format: "enum" },
                            evidence: { type: SchemaType.STRING }
                        },
                        required: ["proficiency", "evidence"]
                    }
                }
            });

            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const text = response.response.text();
            if (!text) throw new Error("No response from AI");

            // No regex needed
            return JSON.parse(text);
        } catch (error) {
            console.error("Proficiency inference failed:", error);
            // Fallback
            return { proficiency: 'comfortable', evidence: userResponse.substring(0, 100) };
        }
    }, {
        event_type: 'proficiency_inference',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};
/**
 * Suggest skills to add to the Skills vault based on uploaded resumes
 */
export const suggestSkillsFromResumes = async (
    resumes: ResumeProfile[],
    onProgress?: RetryProgressCallback
): Promise<Array<{ name: string; description: string }>> => {
    if (resumes.length === 0) return [];

    const resumeContext = resumes
        .map(r => `PROFILE_NAME: ${r.name}\nEXPERIENCE BLOCKS:\n${stringifyProfile(r)}\n`)
        .join("\n=================\n");

    const prompt = ANALYSIS_PROMPTS.SUGGEST_SKILLS(resumeContext);

    return callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
        });

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: AI_TEMPERATURE.CREATIVE,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            name: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING }
                        },
                        required: ["name", "description"]
                    }
                }
            }
        });

        const text = response.response.text();
        if (!text) throw new Error("No response from AI");

        try {
            const parsed = JSON.parse(text);

            // Validate it's an array of objects with name and description
            if (Array.isArray(parsed) && parsed.every(item => item.name && item.description)) {
                return parsed;
            }

            // Fallback: if it's an array of strings (old format), convert to objects
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                return parsed.map(name => ({ name, description: '' }));
            }

            return [];
        } catch (e) {
            console.error("Failed to parse suggested skills:", text);
            return [];
        }
    }, {
        event_type: 'skill_suggestion',
        prompt: prompt,
        model: AI_MODELS.FLASH
    }, 2, 2000, onProgress);
};

export const generateSkillQuestions = async (
    skillName: string,
    proficiency: string,
    existingCache?: VerificationCache
): Promise<{ questions: string[]; cache: VerificationCache }> => {

    // 1. Check Cache
    if (existingCache) {
        const now = Date.now();
        const daysOld = (now - existingCache.generatedAt) / (1000 * 60 * 60 * 24);

        // Return cached if < 90 days and proficiency matches (or if we just assume proficiency match since it's passed in)
        // Ideally we check proficiency level too, but basic time-check is a good start.
        if (daysOld < 90 && existingCache.proficiencyLevel === proficiency) {
            console.log(`⚡️ Using cached verification questions for ${skillName}`);
            return { questions: existingCache.questions, cache: existingCache };
        }
    }

    const prompt = ANALYSIS_PROMPTS.SKILL_VERIFICATION(skillName, proficiency);

    return callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
        });

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: AI_TEMPERATURE.CREATIVE,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            }
        });

        const text = response.response.text();
        if (!text) throw new Error("No response from AI");

        try {
            // No regex needed with responseMimeType: "application/json"
            const questions = JSON.parse(text);

            if (Array.isArray(questions) && questions.every(i => typeof i === 'string')) {
                return {
                    questions,
                    cache: {
                        questions,
                        generatedAt: Date.now(),
                        proficiencyLevel: proficiency
                    }
                };
            }
            return { questions: [], cache: { questions: [], generatedAt: 0, proficiencyLevel: proficiency } };
        } catch (e) {
            console.error("Failed to parse skill questions:", text);
            return { questions: [], cache: { questions: [], generatedAt: 0, proficiencyLevel: proficiency } };
        }
    }, {
        event_type: 'skill_verification',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};
// New function: Parse Role Model profile (LinkedIn PDF)
export const parseRoleModel = async (
    fileBase64: string,
    mimeType: string
): Promise<RoleModelProfile> => {
    let promptParts: any[] = [];

    if (mimeType === 'application/pdf') {
        const extractedText = await extractPdfText(fileBase64);
        if (extractedText.length > CONTENT_VALIDATION.MIN_PDF_TEXT_LENGTH) {
            promptParts = [{ text: `ROLE MODEL CONTENT:\n${extractedText}` }];
        } else {
            throw new Error("Could not extract text from PDF.");
        }
    } else {
        promptParts = [{ inlineData: { mimeType, data: fileBase64 } }];
    }

    // STAGE 1: Metadata (Name, Headline, Org, Snapshot)
    console.log('🤖 Stage 1/2: Extracting Role Model metadata');
    const metadataPrompt = PARSING_PROMPTS.ROLE_MODEL_METADATA();
    const metadataParts = [...promptParts, { text: metadataPrompt }];

    const metadata = await callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        headline: { type: SchemaType.STRING },
                        organization: { type: SchemaType.STRING },
                        topSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        careerSnapshot: { type: SchemaType.STRING },
                        rawTextSummary: { type: SchemaType.STRING }
                    },
                    required: ["name", "headline", "organization", "topSkills", "careerSnapshot", "rawTextSummary"]
                }
            }
        });

        const response = await model.generateContent({
            contents: [{ role: "user", parts: metadataParts }]
        });

        const text = response.response.text();
        if (!text) throw new Error("Empty metadata response");
        return JSON.parse(text);
    }, {
        event_type: 'role_model_metadata',
        prompt: metadataPrompt,
        model: AI_MODELS.FLASH
    });

    // STAGE 2: Experience Blocks (Past Jobs, Education)
    console.log('🧠 Stage 2/2: Extracting Role Model career journey');
    const experiencePrompt = PARSING_PROMPTS.ROLE_MODEL_EXPERIENCE();
    const experienceParts = [...promptParts, { text: experiencePrompt }];

    const experience = await callWithRetry(async () => {
        const model = await getModel({
            model: AI_MODELS.FLASH,
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            type: { type: SchemaType.STRING, enum: ["work", "education", "project"], format: "enum" },
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
            contents: [{ role: "user", parts: experienceParts }]
        });

        const text = response.response.text();
        if (!text) return [];
        const blocks = JSON.parse(text);
        return blocks.map((b: any) => ({
            ...b,
            id: crypto.randomUUID(),
            isVisible: true
        }));
    }, {
        event_type: 'role_model_experience',
        prompt: experiencePrompt,
        model: AI_MODELS.FLASH
    });

    return {
        ...metadata,
        experience,
        id: crypto.randomUUID(),
        dateAdded: Date.now()
    } as RoleModelProfile;
};

export const analyzeGap = async (
    roleModels: RoleModelProfile[],
    userResumes: ResumeProfile[],
    userSkills: CustomSkill[],
    transcript: Transcript | null = null,
    strictMode: boolean = true
): Promise<GapAnalysisResult> => {
    // 1. Construct Contexts
    const roleModelContext = roleModels.map(rm =>
        `ROLE MODEL: ${rm.name}\nHeadline: ${rm.headline}\nSnapshot: ${rm.careerSnapshot}\nSkills: ${rm.topSkills.join(', ')}`
    ).join('\n\n');

    const userProfileContext = `
        RESUMES:
        ${userResumes.map(r =>
        `### ${r.name}\n${r.blocks.map(b => `- ${b.title} @ ${b.organization}`).join('\n')}`
    ).join('\n\n')}

        CURRENT SKILLS:
        ${userSkills.map(s => `- ${s.name} (${s.proficiency})`).join('\n')}
    `;

    // Format transcript context
    const academicContext = transcript ? `
    ACADEMIC RECORD:
    University: ${transcript.university || 'Unknown'}
    Program: ${transcript.program || 'Unknown'}
    CGPA: ${transcript.cgpa || 'N/A'}
    KEY COURSES:
    ${transcript.semesters.flatMap(s => s.courses).map(c => `- ${c.code}: ${c.title} (${c.grade})`).join('\n')}
    ` : undefined;

    const prompt = ANALYSIS_PROMPTS.GAP_ANALYSIS(roleModelContext, userProfileContext, academicContext);

    return callWithRetry(async () => {
        try {
            // STAGE 1: Generate Initial Gap Analysis (Flash)
            const model1 = await getModel({
                model: AI_MODELS.FLASH,
                generationConfig: {
                    temperature: AI_TEMPERATURE.STRICT,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            careerTrajectoryGap: { type: SchemaType.STRING },
                            strategicPathPatterns: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        title: { type: SchemaType.STRING },
                                        description: { type: SchemaType.STRING },
                                        timing: { type: SchemaType.STRING },
                                        prevalence: { type: SchemaType.STRING }
                                    },
                                    required: ["title", "description", "timing", "prevalence"]
                                }
                            },
                            topSkillGaps: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        skill: { type: SchemaType.STRING },
                                        importance: { type: SchemaType.NUMBER },
                                        gapDescription: { type: SchemaType.STRING },
                                        actionableEvidence: {
                                            type: SchemaType.ARRAY,
                                            items: {
                                                type: SchemaType.OBJECT,
                                                properties: {
                                                    type: { type: SchemaType.STRING, enum: ["project", "metric", "certification", "tool"] },
                                                    task: { type: SchemaType.STRING },
                                                    metric: { type: SchemaType.STRING },
                                                    tools: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                                                },
                                                required: ["type", "task", "metric", "tools"]
                                            }
                                        }
                                    },
                                    required: ["skill", "importance", "gapDescription", "actionableEvidence"]
                                }
                            },
                            estimatedTimeToBridge: { type: SchemaType.STRING }
                        },
                        required: ["careerTrajectoryGap", "topSkillGaps", "estimatedTimeToBridge", "strategicPathPatterns"]
                    }
                }
            });

            const response1 = await model1.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const text1 = response1.response.text();
            if (!text1) throw new Error("Empty response from Stage 1");
            const cleanedText1 = text1; // No regex needed

            // STAGE 2: Filter for Hard Skills (IF STRICT MODE IS ON)
            if (strictMode) {
                const filterPrompt = ANALYSIS_PROMPTS.FILTER_HARD_SKILLS(cleanedText1);
                const model2 = await getModel({
                    model: AI_MODELS.FLASH,
                    generationConfig: {
                        temperature: AI_TEMPERATURE.STRICT,
                        responseMimeType: "application/json",
                    }
                });

                const response2 = await model2.generateContent({
                    contents: [{ role: "user", parts: [{ text: filterPrompt }] }]
                });

                const text2 = response2.response.text();
                if (!text2) throw new Error("Empty response from Stage 2");

                const parsed = JSON.parse(text2);

                return {
                    ...parsed,
                    dateGenerated: Date.now()
                };
            } else {
                // Return raw analysis (Stage 1 result)
                const parsed = JSON.parse(cleanedText1);
                return {
                    ...parsed,
                    dateGenerated: Date.now()
                };
            }

        } catch (error) {
            console.error("Gap Analysis Failed:", error);
            throw error;
        }
    }, {
        event_type: 'gap_analysis',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

export const generateRoadmap = async (gapAnalysis: GapAnalysisResult): Promise<RoadmapMilestone[]> => {
    const context = JSON.stringify(gapAnalysis, null, 2);
    const prompt = ANALYSIS_PROMPTS.GENERATE_ROADMAP(context);

    return callWithRetry(async () => {
        try {
            const model = await getModel({
                model: AI_MODELS.FLASH,
                generationConfig: {
                    temperature: AI_TEMPERATURE.STRICT,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            milestones: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        id: { type: SchemaType.STRING },
                                        month: { type: SchemaType.NUMBER },
                                        title: { type: SchemaType.STRING },
                                        type: { type: SchemaType.STRING, enum: ["project", "metric", "certification", "tool"] },
                                        task: { type: SchemaType.STRING },
                                        metric: { type: SchemaType.STRING },
                                        tools: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                        linkedSkill: { type: SchemaType.STRING }
                                    },
                                    required: ["id", "month", "title", "type", "task", "metric", "tools", "linkedSkill"]
                                }
                            }
                        },
                        required: ["milestones"]
                    }
                }
            });

            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const text = response.response.text();
            if (!text) throw new Error("Empty response");

            const parsed = JSON.parse(text);

            return parsed.milestones.map((m: any) => ({
                ...m,
                status: 'pending'
            }));
        } catch (error) {
            console.error("Roadmap Generation Failed:", error);
            throw error;
        }
    }, {
        event_type: 'roadmap_generation',
        prompt: prompt,
        model: AI_MODELS.FLASH
    });
};

export const analyzeRoleModelGap = async (
    roleModel: RoleModelProfile,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[] = [],
    onProgress?: RetryProgressCallback
): Promise<GapAnalysisResult> => {

    if (onProgress) onProgress("Analyzing emulation path...", 1, 1);
    console.log('🧠 Analyzing Role Model Emulation Opportunity');

    const roleModelContext = `
NAME: ${roleModel.name}
HEADLINE: ${roleModel.headline}
CAREER SNAPSHOT: ${roleModel.careerSnapshot}
ORGANIZATION: ${roleModel.organization}
SKILLS: ${roleModel.topSkills.join(', ')}

EXPERIENCE HISTORY:
${roleModel.experience.map(b => `
- ${b.title} @ ${b.organization} (${b.dateRange})
  ${b.bullets.join('\n  ')}
`).join('\n')}
    `;

    const resumeContext = resumes
        .map(r => `PROFILE_NAME: ${r.name} \nPROFILE_ID: ${r.id} \nEXPERIENCE BLOCKS: \n${stringifyProfile(r)} \n`)
        .join("\n=================\n");

    const skillContext = userSkills.length > 0
        ? `YOUR SKILLS: \n${userSkills.map(s => `- ${s.name}: ${s.proficiency}`).join('\n')} \n`
        : '';

    const analysisPrompt = ANALYSIS_PROMPTS.ROLE_MODEL_GAP_ANALYSIS(roleModelContext, resumeContext + '\n' + skillContext);

    return callWithRetry(async () => {
        const model = await getModel({ model: AI_MODELS.PRO });
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        careerTrajectoryGap: { type: SchemaType.STRING },
                        strategicPathPatterns: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    title: { type: SchemaType.STRING },
                                    description: { type: SchemaType.STRING },
                                    timing: { type: SchemaType.STRING },
                                    prevalence: { type: SchemaType.STRING }
                                },
                                required: ["title", "description", "timing", "prevalence"]
                            }
                        },
                        topSkillGaps: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    skill: { type: SchemaType.STRING },
                                    importance: { type: SchemaType.NUMBER },
                                    gapDescription: { type: SchemaType.STRING },
                                    actionableEvidence: {
                                        type: SchemaType.ARRAY,
                                        items: {
                                            type: SchemaType.OBJECT,
                                            properties: {
                                                type: { type: SchemaType.STRING, enum: ["project", "metric", "certification", "tool"], format: "enum" },
                                                task: { type: SchemaType.STRING },
                                                metric: { type: SchemaType.STRING },
                                                tools: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                                            },
                                            required: ["type", "task", "metric", "tools"]
                                        }
                                    }
                                },
                                required: ["skill", "importance", "gapDescription", "actionableEvidence"]
                            }
                        },
                        estimatedTimeToBridge: { type: SchemaType.STRING },
                        dateGenerated: { type: SchemaType.NUMBER }
                    },
                    required: ["careerTrajectoryGap", "strategicPathPatterns", "topSkillGaps", "estimatedTimeToBridge", "dateGenerated"]
                }
            }
        });

        const text = response.response.text();
        if (!text || !text.trim()) throw new Error("Empty response from analysis");

        const parsed = JSON.parse(text);

        return parsed;
    }, {
        event_type: 'role_model_emulation',
        prompt: analysisPrompt,
        model: AI_MODELS.PRO
    });
};
