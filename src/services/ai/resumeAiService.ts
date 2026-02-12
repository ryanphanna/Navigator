import { getModel, callWithRetry, cleanJsonOutput } from "./aiCore";
import type {
    ExperienceBlock,
    CustomSkill
} from "../../types";
import { PARSING_PROMPTS, ANALYSIS_PROMPTS } from "../../prompts/index";
import { AI_MODELS } from "../../constants";

const extractPdfText = async (base64: string): Promise<string> => {
    try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) return "";
        const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return fullText;
    } catch (e) {
        return "";
    }
}

export const parseResumeFile = async (
    fileBase64: string,
    mimeType: string
): Promise<ExperienceBlock[]> => {
    let promptParts: any[] = [];
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
        return parsed.map((p: any) => ({ ...p, id: crypto.randomUUID(), isVisible: true }));
    }, { event_type: 'parsing', prompt, model: AI_MODELS.EXTRACTION });
};

export const tailorExperienceBlock = async (
    block: ExperienceBlock,
    jobDescription: string,
    instructions: string[]
): Promise<string[]> => {
    const prompt = ANALYSIS_PROMPTS.TAILOR_EXPERIENCE_BLOCK(jobDescription, block.title, block.organization, block.bullets, instructions);
    return callWithRetry(async () => {
        const model = await getModel({ task: 'analysis', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'tailoring_block', prompt, model: 'dynamic' });
};

export const inferProficiencyFromResponse = async (
    skillName: string,
    _userResponse: string
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
    resumes: any[]
): Promise<any[]> => {
    const resumeContext = JSON.stringify(resumes);
    const prompt = ANALYSIS_PROMPTS.SUGGEST_SKILLS(resumeContext);
    return callWithRetry(async () => {
        const model = await getModel({ task: 'extraction', generationConfig: { responseMimeType: "application/json" } });
        const response = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        return JSON.parse(cleanJsonOutput(response.response.text()));
    }, { event_type: 'skill_suggestion', prompt, model: AI_MODELS.EXTRACTION });
};
