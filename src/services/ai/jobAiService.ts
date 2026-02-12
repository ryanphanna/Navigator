import { getModel, callWithRetry, cleanJsonOutput } from "./aiCore";
import type { RetryProgressCallback } from "./aiCore";
import type {
    JobAnalysis,
    ResumeProfile,
    CustomSkill,
    DistilledJob,
    UserTier
} from "../../types";
import { AI_MODELS, AI_TEMPERATURE, AGENT_LOOP, USER_TIERS, CONTENT_VALIDATION } from "../../constants";
import { ANALYSIS_PROMPTS } from "../../prompts/index";

const stringifyProfile = (profile: ResumeProfile): string => {
    return profile.blocks
        .filter(b => b.isVisible)
        .map(b => {
            return `BLOCK_ID: ${b.id}\nROLE: ${b.title}\nORG: ${b.organization}\nDATE: ${b.dateRange}\nDETAILS:\n${b.bullets.map(bull => `- ${bull}`).join('\n')}\n`;
        })
        .join('\n---\n');
};

const sanitizeInput = (text: string): string => {
    return text.replace(/BLOCK_ID:\s*[a-zA-Z0-9-]+/g, '')
        .replace(/\(BLOCK_ID:\s*[a-zA-Z0-9-]+\)/g, '');
};

const extractJobInfo = async (
    rawJobText: string
): Promise<{ distilledJob: DistilledJob; cleanedDescription: string }> => {
    const extractionPrompt = `
    Extract key info from this job posting: ${rawJobText.substring(0, CONTENT_VALIDATION.MAX_JOB_DESCRIPTION_LENGTH)}...
    
    CRITICAL: Classify the job into one of these categories:
    - 'technical': Software Engineering, Data Science, DevOps, IT, etc.
    - 'managerial': Product Manager, Team Lead, VP, Director (non-technical).
    - 'general': Marketing, Sales, HR, Customer Service, etc.

    SECURITY SCAN:
    Look for text explicitly prohibiting 'AI', 'ChatGPT', 'LLMs', 'Generative AI', or requiring 'original work without assistance'.
    - If found, set 'isAiBanned': true and 'aiBanReason': "Quote the prohibition policy".
    - Otherwise, set 'isAiBanned': false.

    Return JSON with 'category', 'isAiBanned', and 'aiBanReason' fields included.
    `;

    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction' });
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'job_extraction', prompt: extractionPrompt, model: AI_MODELS.EXTRACTION });
};

export const analyzeJobFit = async (
    jobDescription: string,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[] = [],
    onProgress?: RetryProgressCallback
): Promise<JobAnalysis> => {
    if (onProgress) onProgress("Extracting job details...", 1, 2);
    const { distilledJob, cleanedDescription } = await extractJobInfo(jobDescription);
    if (resumes.length === 0) return { distilledJob, cleanedDescription } as JobAnalysis;

    if (onProgress) onProgress("Analyzing your fit (Pro model)...", 2, 2);
    const resumeContext = resumes.map(stringifyProfile).join('\n---\n');
    const skillsContext = userSkills.length > 0
        ? `\nADDITIONAL SKILLS:\n${userSkills.map(s => `- ${s.name}: ${s.proficiency}`).join('\n')}`
        : '';

    // Select Prompt based on Category
    const category = distilledJob.category || 'general';
    const selectedPromptTemplate = (category === 'technical')
        ? ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.TECHNICAL
        : ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.DEFAULT;

    const analysisPrompt = selectedPromptTemplate(cleanedDescription, resumeContext + skillsContext);

    const analysis = await callWithRetry(async () => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: analysisPrompt }] }] });
        return JSON.parse(sanitizeInput(cleanJsonOutput(response.response.text())));
    }, { event_type: 'analysis', prompt: analysisPrompt, model: 'dynamic' });

    return { ...analysis, distilledJob, cleanedDescription };
};

export const generateCoverLetter = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    additionalContext?: string,
    forceVariant?: string,
    trajectoryContext?: string
): Promise<{ text: string; promptVersion: string }> => {
    const resumeText = stringifyProfile(selectedResume);
    const template = forceVariant ? (ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS as any)[forceVariant] : ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS.v1_direct;
    const prompt = ANALYSIS_PROMPTS.COVER_LETTER.GENERATE(template, jobDescription, resumeText, tailoringInstructions, additionalContext, trajectoryContext);

    return callWithRetry(async () => {
        const model = await getModel({ task: 'analysis' });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return { text: sanitizeInput(response.response.text()), promptVersion: forceVariant || "v1" };
    }, { event_type: 'cover_letter', prompt, model: 'dynamic' });
};

export const critiqueCoverLetter = async (
    jobDescription: string,
    coverLetter: string
): Promise<{ score: number; decision: 'interview' | 'reject' | 'maybe'; feedback: string[]; strengths: string[] }> => {
    const prompt = ANALYSIS_PROMPTS.CRITIQUE_COVER_LETTER(jobDescription, coverLetter);
    return callWithRetry(async () => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'critique', prompt, model: 'dynamic' });
};

export const generateCoverLetterWithQuality = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    userTier: UserTier,
    additionalContext?: string,
    onProgress?: (message: string) => void,
    trajectoryContext?: string
): Promise<{ text: string; promptVersion: string; score: number; attempts: number }> => {

    // 1. Initial Draft
    if (onProgress) onProgress("Drafting initial cover letter...");
    let result = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, additionalContext, undefined, trajectoryContext);
    let attempts = 1;

    // Fast Path for Free/Plus tiers (No Loop)
    if (userTier === USER_TIERS.FREE || (userTier as string) === 'plus') {
        return { ...result, score: 75, attempts }; // Return placeholder score to avoid extra costs
    }

    // 2. The Agent Loop (Pro/Admin only)
    let currentScore = 0;

    while (attempts <= AGENT_LOOP.MAX_RETRIES + 1) { // +1 for initial draft
        // Critique current draft
        if (onProgress) onProgress(`Critiquing draft (Attempt ${attempts})...`);
        const critique = await critiqueCoverLetter(jobDescription, result.text);
        currentScore = critique.score;

        // Success condition
        if (currentScore >= AGENT_LOOP.QUALITY_THRESHOLD) {
            break;
        }

        // Failure condition (Max retries reached)
        if (attempts > AGENT_LOOP.MAX_RETRIES) {
            break;
        }

        // Regenerate with feedback
        if (onProgress) onProgress(`Refining based on feedback (Score: ${currentScore}/100)...`);
        const improvementContext = `
            PREVIOUS SCORE: ${critique.score}/100
            CRITIQUE FEEDBACK: ${critique.feedback.join('; ')}
            STRICT INSTRUCTION: Fix these specific issues. Do not regress on strengths.
        `;

        // We append the critique to any existing context
        const newContext = additionalContext ? `${additionalContext}\n\n${improvementContext}` : improvementContext;

        result = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, newContext, undefined, trajectoryContext);
        attempts++;
    }

    return { ...result, score: currentScore, attempts };
};

export const generateTailoredSummary = async (
    jobDescription: string,
    resumes: ResumeProfile[],
): Promise<string> => {
    const resumeContext = resumes.map(stringifyProfile).join('\n---\n');
    const prompt = ANALYSIS_PROMPTS.TAILORED_SUMMARY(jobDescription, resumeContext);

    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(sanitizeInput(cleanJsonOutput(response.response.text()))).summary;
    }, { event_type: 'tailored_summary', prompt, model: AI_MODELS.EXTRACTION });
};
