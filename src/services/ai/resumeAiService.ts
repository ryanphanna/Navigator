import { getModel, callWithRetry, cleanJsonOutput } from "./aiCore";
import type {
    ExperienceBlock,
    CustomSkill,
    ResumeProfile
} from "../../types";
import { PARSING_PROMPTS, ANALYSIS_PROMPTS } from "../../prompts/index";
import { AI_MODELS } from "../../constants";

const stringifyProfile = (profile: ResumeProfile): string => {
    return JSON.stringify(profile, null, 2);
};

const extractPdfText = async (base64: string): Promise<string> => {
    try {
        const pdfjsLib = (window as unknown as { pdfjsLib: { getDocument: (opts: { data: string }) => { promise: Promise<{ numPages: number; getPage: (i: number) => Promise<{ getTextContent: () => Promise<{ items: { str: string }[] }> }> }> } } }).pdfjsLib;
        if (!pdfjsLib) return "";
        const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
        const pdf = await loadingTask.promise;
        const pagePromises = Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (i) => {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            return textContent.items.map((item: { str: string }) => item.str).join(' ');
        });

        const pagesContent = await Promise.all(pagePromises);
        return pagesContent.join('\n') + '\n';
    } catch {
        return "";
    }
}

export const parseResumeFile = async (
    fileBase64: string,
    mimeType: string
): Promise<ExperienceBlock[]> => {
    let promptParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
    if (mimeType === 'application/pdf') {
        const extractedText = await extractPdfText(fileBase64);
        promptParts = [{ text: `RESUME CONTENT:\n${extractedText}` }];
    } else {
        promptParts = [{ inlineData: { mimeType, data: fileBase64 } }];
    }
    const prompt = PARSING_PROMPTS.RESUME_PARSE();
    promptParts.push({ text: prompt });

    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: promptParts }] });
        const parsed = JSON.parse(cleanJsonOutput(response.response.text()));
        return (parsed as ExperienceBlock[]).map((p) => ({ ...p, id: crypto.randomUUID(), isVisible: true }));
    }, { event_type: 'parsing', prompt, model: AI_MODELS.EXTRACTION });
};

export const tailorExperienceBlock = async (
    block: ExperienceBlock,
    jobDescription: string,
    instructions: string[],
    jobId?: string
): Promise<string[]> => {
    const prompt = ANALYSIS_PROMPTS.TAILOR_EXPERIENCE_BLOCK(jobDescription, block.title, block.organization, block.bullets, instructions);
    return callWithRetry(async () => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'tailoring_block', prompt, model: 'dynamic', job_id: jobId });
};

export const inferProficiencyFromResponse = async (
    skillName: string
): Promise<{ proficiency: CustomSkill['proficiency']; evidence: string }> => {
    const prompt = `Analyze proficiency for ${skillName} based on the user's response. Categorize as 'learning', 'comfortable', or 'expert'. Return JSON: { "proficiency": "...", "evidence": "..." }`;
    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'proficiency_inference', prompt, model: AI_MODELS.EXTRACTION });
};

export const generateSkillQuestions = async (
    skillName: string,
    proficiency: string
): Promise<{ questions: string[] }> => {
    const prompt = ANALYSIS_PROMPTS.SKILL_VERIFICATION(skillName, proficiency);
    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const questions = JSON.parse(cleanJsonOutput(response.response.text()));
        return { questions };
    }, { event_type: 'skill_verification', prompt, model: AI_MODELS.EXTRACTION });
};

export const suggestSkillsFromResumes = async (
    resumes: ResumeProfile[]
): Promise<{ name: string; description: string }[]> => {
    const resumeContext = resumes.map(stringifyProfile).join('\n---\n');
    const prompt = ANALYSIS_PROMPTS.SUGGEST_SKILLS(resumeContext);
    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'skill_suggestion', prompt, model: AI_MODELS.EXTRACTION });
};
