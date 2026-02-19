import { getModel, callWithRetry, cleanJsonOutput } from "./aiCore";
import type {
    Transcript,
    RoleModelProfile,
    GapAnalysisResult,
    RoadmapMilestone,
    ResumeProfile,
    CustomSkill,
    AdmissionEligibility
} from "../../types";
import { AI_MODELS, AI_TEMPERATURE } from "../../constants";
import { ANALYSIS_PROMPTS, PARSING_PROMPTS } from "../../prompts/index";

export const analyzeMAEligibility = async (
    transcript: Transcript,
    targetProgram: string
): Promise<AdmissionEligibility> => {
    const transcriptText = JSON.stringify(transcript);
    const prompt = ANALYSIS_PROMPTS.GRAD_SCHOOL_ELIGIBILITY(transcriptText, targetProgram);

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'ma_eligibility', prompt, model: AI_MODELS.EXTRACTION });
};

export const parseRoleModel = async (
    fileBase64: string,
    mimeType: string
): Promise<RoleModelProfile> => {
    const metadataPrompt = PARSING_PROMPTS.ROLE_MODEL_METADATA();
    return callWithRetry(async (metadata) => {
        const model = await getModel({
            task: 'extraction',
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
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'role_model_metadata', prompt: metadataPrompt, model: AI_MODELS.EXTRACTION });
};

export const analyzeGap = async (
    roleModels: RoleModelProfile[],
    userResumes: ResumeProfile[],
    userSkills: CustomSkill[],
    transcript: Transcript | null = null,
): Promise<GapAnalysisResult> => {
    const roleModelContext = JSON.stringify(roleModels);
    const resumeContext = JSON.stringify(userResumes);
    const skillContext = JSON.stringify(userSkills);
    const transcriptContext = transcript ? JSON.stringify(transcript) : '';
    const prompt = ANALYSIS_PROMPTS.GAP_ANALYSIS(roleModelContext, resumeContext, skillContext + transcriptContext);

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'gap_analysis', prompt, model: 'dynamic' });
};

export const generateRoadmap = async (
    gapAnalysis: GapAnalysisResult
): Promise<RoadmapMilestone[]> => {
    const prompt = ANALYSIS_PROMPTS.GENERATE_ROADMAP(JSON.stringify(gapAnalysis));
    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        const parsed = JSON.parse(cleanJsonOutput(response.response.text()));
        return (parsed.milestones as RoadmapMilestone[]).map((m) => ({ ...m, status: 'pending' }));
    }, { event_type: 'roadmap_generation', prompt, model: 'dynamic' });
};

export const analyzeRoleModelGap = async (
    roleModel: RoleModelProfile,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[] = [],
    onProgress?: (message: string, current: number, total: number) => void
): Promise<GapAnalysisResult> => {
    if (onProgress) onProgress("Simulating career emulation...", 1, 1);
    const roleModelContext = JSON.stringify(roleModel);
    const resumeContext = JSON.stringify(resumes);
    const skillsContext = JSON.stringify(userSkills);
    const analysisPrompt = ANALYSIS_PROMPTS.ROLE_MODEL_GAP_ANALYSIS(roleModelContext, resumeContext + skillsContext);

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: analysisPrompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'role_model_emulation', prompt: analysisPrompt, model: 'dynamic' });
};

export const parseTranscript = async (
    fileBase64: string,
    mimeType: string
): Promise<Transcript> => {
    const prompt = PARSING_PROMPTS.TRANSCRIPT_PARSE("");
    return callWithRetry(async (metadata) => {
        const model = await getModel({
            task: 'extraction',
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
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'transcript_parse', prompt, model: AI_MODELS.EXTRACTION });
};

export const extractSkillsFromCourses = async (
    transcript: Transcript
): Promise<CustomSkill[]> => {
    const allCourses = transcript.semesters.flatMap(s => s.courses);
    const coursesList = JSON.stringify(allCourses);
    const prompt = ANALYSIS_PROMPTS.COURSE_SKILL_EXTRACTION(coursesList);
    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'skill_extraction', prompt, model: AI_MODELS.EXTRACTION });
};

export const analyzeCurrentProgramRequirements = async (
    transcript: Transcript,
    programName: string,
    university: string
): Promise<AdmissionEligibility> => {
    const transcriptText = JSON.stringify(transcript);
    const prompt = ANALYSIS_PROMPTS.PROGRAM_REQUIREMENTS_ANALYSIS(transcriptText, programName, university);

    return callWithRetry(async (metadata) => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        metadata.token_usage = response.response.usageMetadata;
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'program_requirements', prompt, model: 'dynamic' });
};
