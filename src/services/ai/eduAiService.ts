import { getModel, callWithRetry, cleanJsonOutput, resolveModel } from "./aiCore";
import type {
    Transcript,
    RoleModelProfile,
    GapAnalysisResult,
    RoadmapMilestone,
    ResumeProfile,
    CustomSkill
} from "../../types";
import { AI_MODELS, AI_TEMPERATURE } from "../../constants";
import { ANALYSIS_PROMPTS, PARSING_PROMPTS } from "../../prompts/index";
import type { UserTier } from "../../types";

export const analyzeMAEligibility = async (
    transcript: Transcript,
    targetProgram: string
): Promise<any> => {
    const transcriptText = JSON.stringify(transcript);
    const prompt = ANALYSIS_PROMPTS.GRAD_SCHOOL_ELIGIBILITY(transcriptText, targetProgram);

    // MA eligibility is 'extraction' level as it's a basic check
    const modelName = AI_MODELS.EXTRACTION;

    return callWithRetry(async () => {
        const model = await getModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'ma_eligibility', prompt, model: modelName });
};

export const parseRoleModel = async (
    fileBase64: string,
    mimeType: string
): Promise<RoleModelProfile> => {
    const metadataPrompt = PARSING_PROMPTS.ROLE_MODEL_METADATA();
    const modelName = AI_MODELS.EXTRACTION;

    return callWithRetry(async () => {
        const model = await getModel({
            model: modelName,
            generationConfig: { temperature: AI_TEMPERATURE.STRICT, responseMimeType: "application/json" }
        });
        const response = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { inlineData: { data: fileBase64, mimeType } },
                    { text: metadataPrompt }
                ]
            }]
        });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'role_model_metadata', prompt: metadataPrompt, model: modelName });
};

export const analyzeGap = async (
    roleModels: RoleModelProfile[],
    userResumes: ResumeProfile[],
    userSkills: CustomSkill[],
    transcript: Transcript | null = null,
    _strictMode: boolean = true,
    userTier: UserTier | string = 'free'
): Promise<GapAnalysisResult> => {
    const roleModelContext = JSON.stringify(roleModels);
    const resumeContext = JSON.stringify(userResumes);
    const skillContext = JSON.stringify(userSkills);
    const transcriptContext = transcript ? JSON.stringify(transcript) : '';
    const prompt = ANALYSIS_PROMPTS.GAP_ANALYSIS(roleModelContext, resumeContext, skillContext + transcriptContext);

    const modelName = resolveModel(userTier, 'analysis');

    return callWithRetry(async () => {
        const model = await getModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'gap_analysis', prompt, model: modelName });
};

export const generateRoadmap = async (
    gapAnalysis: GapAnalysisResult,
    userTier: UserTier | string = 'free'
): Promise<RoadmapMilestone[]> => {
    const prompt = ANALYSIS_PROMPTS.GENERATE_ROADMAP(JSON.stringify(gapAnalysis));
    const modelName = resolveModel(userTier, 'analysis');

    return callWithRetry(async () => {
        const model = await getModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const parsed = JSON.parse(cleanJsonOutput(response.response.text()));
        return parsed.milestones.map((m: any) => ({ ...m, status: 'pending' }));
    }, { event_type: 'roadmap_generation', prompt, model: modelName });
};

export const analyzeRoleModelGap = async (
    roleModel: RoleModelProfile,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[] = [],
    onProgress?: (message: string, current: number, total: number) => void,
    userTier: UserTier | string = 'pro'
): Promise<GapAnalysisResult> => {
    if (onProgress) onProgress("Simulating career emulation...", 1, 1);
    const roleModelContext = JSON.stringify(roleModel);
    const resumeContext = JSON.stringify(resumes);
    const skillsContext = JSON.stringify(userSkills);
    const analysisPrompt = ANALYSIS_PROMPTS.ROLE_MODEL_GAP_ANALYSIS(roleModelContext, resumeContext + skillsContext);

    const modelName = resolveModel(userTier, 'analysis');

    return callWithRetry(async () => {
        const model = await getModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: analysisPrompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'role_model_emulation', prompt: analysisPrompt, model: modelName });
};

export const parseTranscript = async (
    fileBase64: string,
    mimeType: string
): Promise<Transcript> => {
    const prompt = PARSING_PROMPTS.TRANSCRIPT_PARSE("");
    const modelName = AI_MODELS.EXTRACTION;

    return callWithRetry(async () => {
        const model = await getModel({
            model: modelName,
            generationConfig: { temperature: AI_TEMPERATURE.STRICT, responseMimeType: "application/json" }
        });
        const response = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { inlineData: { data: fileBase64, mimeType } },
                    { text: prompt }
                ]
            }]
        });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'transcript_parse', prompt, model: modelName });
};

export const extractSkillsFromCourses = async (
    transcript: Transcript
): Promise<any[]> => {
    const allCourses = transcript.semesters.flatMap(s => s.courses);
    const coursesList = JSON.stringify(allCourses);
    const prompt = ANALYSIS_PROMPTS.COURSE_SKILL_EXTRACTION(coursesList);
    const modelName = AI_MODELS.EXTRACTION;

    return callWithRetry(async () => {
        const model = await getModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'skill_extraction', prompt, model: modelName });
};
