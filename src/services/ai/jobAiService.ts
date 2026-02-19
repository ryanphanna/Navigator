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
import { BucketStorage } from "../storage/bucketStorage";

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
    
    1. ROLE: What is the official role title?
    2. COMPANY: What is the company name?
    3. CATEGORY: Classify into 'technical', 'managerial', 'trades', 'healthcare', 'creative', or 'general'.
    4. CANONICAL TITLE: What is the most standard, high-level name for this role? (e.g. "Junior React Dev" -> "Software Engineer").
    5. SECURITY SCAN:
       Look for text explicitly prohibiting 'AI', 'ChatGPT', 'LLMs', 'Generative AI', or requiring 'original work without assistance'.
       - If found, set 'isAiBanned': true and 'aiBanReason': "Quote the prohibition policy".
       - Otherwise, set 'isAiBanned': false.

    Return JSON with 'roleTitle', 'companyName', 'category', 'canonicalTitle', 'isAiBanned', and 'aiBanReason' fields.
    `;

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'extraction' });
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
            generationConfig: {
                temperature: AI_TEMPERATURE.STRICT,
                responseMimeType: "application/json",
            }
        });
        metadata.token_usage = response.response.usageMetadata;
        const result = JSON.parse(cleanJsonOutput(response.response.text()));
        return { distilledJob: result as DistilledJob, cleanedDescription: rawJobText };
    }, { event_type: 'job_extraction', prompt: extractionPrompt, model: AI_MODELS.EXTRACTION, job_id: undefined }); // Extraction usually happens before job is fully saved, but could pass if available.
};

export const analyzeJobFit = async (
    jobDescription: string,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[] = [],
    onProgress?: RetryProgressCallback,
    jobId?: string
): Promise<JobAnalysis> => {
    if (onProgress) onProgress("Extracting job details...", 1, 2);
    const { distilledJob: extractionInfo, cleanedDescription } = await extractJobInfo(jobDescription);
    if (resumes.length === 0) return { distilledJob: extractionInfo, cleanedDescription } as JobAnalysis;

    if (onProgress) onProgress("Analyzing your fit (Pro model)...", 2, 2);
    const resumeContext = resumes.map(stringifyProfile).join('\n---\n');
    const skillsContext = userSkills.length > 0
        ? `\nADDITIONAL SKILLS:\n${userSkills.map(s => `- ${s.name}: ${s.proficiency}`).join('\n')}`
        : '';

    // Fetch Bucket Guidelines (Role Farming)
    const canonicalTitle = extractionInfo.canonicalTitle || extractionInfo.roleTitle || 'General';
    await BucketStorage.ensureBucket(canonicalTitle);
    const bucket = await BucketStorage.getBucket(canonicalTitle);
    const bucketAdvice = bucket?.guidelines?.promptAdvice;

    // Select Prompt based on Category
    const category = extractionInfo.category || 'general';
    let selectedPromptTemplate = ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.DEFAULT;

    if (category === 'technical') selectedPromptTemplate = ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.TECHNICAL;
    else if (category === 'trades') selectedPromptTemplate = ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.TRADES;
    else if (category === 'healthcare') selectedPromptTemplate = ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.HEALTHCARE;
    else if (category === 'creative') selectedPromptTemplate = ANALYSIS_PROMPTS.JOB_FIT_ANALYSIS.CREATIVE;

    const analysisPrompt = selectedPromptTemplate(cleanedDescription, (resumeContext + skillsContext), bucketAdvice);

    const analysis = await callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: analysisPrompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(sanitizeInput(cleanJsonOutput(response.response.text())));
    }, { event_type: 'analysis', prompt: analysisPrompt, model: 'dynamic', job_id: jobId });

    // Deep merge the extraction info with the detailed analysis
    const mergedDistilledJob = {
        ...(analysis.distilledJob || {}),
        ...extractionInfo,
        // Ensure extraction info (like AI bans) takes precedence, but don't lose detailed fields from analysis
        keySkills: extractionInfo.keySkills || analysis.distilledJob?.keySkills || [],
        requiredSkills: analysis.distilledJob?.requiredSkills || [],
        coreResponsibilities: extractionInfo.coreResponsibilities || analysis.distilledJob?.coreResponsibilities || [],
    };

    return { ...analysis, distilledJob: mergedDistilledJob, cleanedDescription };
};

export const generateCoverLetter = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    additionalContext?: string,
    forceVariant?: string,
    trajectoryContext?: string,
    jobId?: string,
    canonicalTitle?: string
): Promise<{ text: string; promptVersion: string }> => {
    const resumeText = stringifyProfile(selectedResume);
    const template = forceVariant ? (ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS as any)[forceVariant] : ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS.v1_direct;

    // Fetch Bucket Strategy
    let bucketStrategy = undefined;
    if (canonicalTitle) {
        const bucket = await BucketStorage.getBucket(canonicalTitle);
        bucketStrategy = bucket?.guidelines?.coverLetterStrategy;
    }

    const prompt = ANALYSIS_PROMPTS.COVER_LETTER.GENERATE(template, jobDescription, resumeText, tailoringInstructions, additionalContext, trajectoryContext, bucketStrategy);

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis' });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return { text: sanitizeInput(response.response.text()), promptVersion: forceVariant || "v1" };
    }, { event_type: 'cover_letter', prompt, model: 'dynamic', job_id: jobId });
};

export const critiqueCoverLetter = async (
    jobDescription: string,
    coverLetter: string,
    jobId?: string
): Promise<{ score: number; decision: 'interview' | 'reject' | 'maybe'; feedback: string[]; strengths: string[] }> => {
    const prompt = ANALYSIS_PROMPTS.CRITIQUE_COVER_LETTER(jobDescription, coverLetter);
    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'critique', prompt, model: 'dynamic', job_id: jobId });
};

export const generateCoverLetterWithQuality = async (
    jobDescription: string,
    selectedResume: ResumeProfile,
    tailoringInstructions: string[],
    userTier: UserTier,
    additionalContext?: string,
    onProgress?: (message: string) => void,
    trajectoryContext?: string,
    jobId?: string,
    canonicalTitle?: string
): Promise<{ text: string; promptVersion: string; score: number; attempts: number }> => {

    // 1. Initial Draft
    if (onProgress) onProgress("Drafting initial cover letter...");
    let result = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, additionalContext, undefined, trajectoryContext, jobId, canonicalTitle);
    let attempts = 1;

    // Fast Path for Free tier (No Loop)
    if (userTier === USER_TIERS.FREE) {
        return { ...result, score: 75, attempts }; // Return placeholder score to avoid extra costs
    }

    // 2. The Agent Loop (Pro/Admin only)
    let currentScore = 0;

    while (attempts <= AGENT_LOOP.MAX_RETRIES + 1) { // +1 for initial draft
        // Critique current draft
        if (onProgress) onProgress(`Critiquing draft (Attempt ${attempts})...`);
        const critique = await critiqueCoverLetter(jobDescription, result.text, jobId);
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

        result = await generateCoverLetter(jobDescription, selectedResume, tailoringInstructions, newContext, undefined, trajectoryContext, jobId, canonicalTitle);
        attempts++;
    }

    return { ...result, score: currentScore, attempts };
};

export const generateTailoredSummary = async (
    jobDescription: string,
    resumes: ResumeProfile[],
    jobId?: string
): Promise<string> => {
    const resumeContext = resumes.map(stringifyProfile).join('\n---\n');
    const prompt = ANALYSIS_PROMPTS.TAILORED_SUMMARY(jobDescription, resumeContext);

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(sanitizeInput(cleanJsonOutput(response.response.text()))).summary;
    }, { event_type: 'tailored_summary', prompt, model: AI_MODELS.EXTRACTION, job_id: jobId });
};
