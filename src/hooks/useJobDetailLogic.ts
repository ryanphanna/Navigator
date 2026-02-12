import { useState, useCallback, useMemo } from 'react';
import { analyzeJobFit, tailorExperienceBlock } from '../services/geminiService';
import { Storage } from '../services/storageService';
import type { SavedJob, ExperienceBlock, ResumeProfile, CustomSkill } from '../types';

export const useJobDetailLogic = ({
    job,
    resumes,
    userSkills,
    onUpdateJob,
    showError,
    showSuccess,
    userTier,
    onAnalyzeJob
}: {
    job: SavedJob;
    resumes: ResumeProfile[];
    userSkills: CustomSkill[];
    onUpdateJob: (job: SavedJob) => void;
    showError: (msg: string) => void;
    showSuccess: (msg: string) => void;
    userTier?: string;
    onAnalyzeJob?: (job: SavedJob) => Promise<SavedJob>;
}) => {
    const [activeTab, setActiveTab] = useState<'analysis' | 'resume' | 'cover-letter' | 'job-post'>('analysis');
    const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
    const [tailoringBlockId, setTailoringBlockId] = useState<string | null>(null);
    const [manualText, setManualText] = useState(job.description || '');
    const [editUrl, setEditUrl] = useState(job.url || '');
    const [retrying, setRetrying] = useState(false);
    const [generating, setGenerating] = useState(false);

    const analysis = job.analysis;

    const bestResume = useMemo(() => {
        if (!analysis) return resumes[0];
        return resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];
    }, [analysis, resumes]);

    const performAnalysis = useCallback(async () => {
        setAnalysisProgress("Preparing analysis...");
        try {
            if (onAnalyzeJob) {
                await onAnalyzeJob(job);
            } else {
                const result = await analyzeJobFit(job.description || '', resumes, userSkills, (msg) => setAnalysisProgress(msg), userTier);
                const finalJob: SavedJob = { ...job, analysis: result, status: 'saved' as const };
                await Storage.updateJob(finalJob);
                onUpdateJob(finalJob);
            }
            setAnalysisProgress(null);
        } catch (err) {
            setAnalysisProgress(null);
            showError("Analysis failed: " + (err as Error).message);
        }
    }, [job, onAnalyzeJob, resumes, userSkills, onUpdateJob, showError]);

    const handleHyperTailor = useCallback(async (block: ExperienceBlock) => {
        if (!analysis || tailoringBlockId) return;

        setTailoringBlockId(block.id);
        try {
            const textToUse = analysis.cleanedDescription || job.description || `Role: ${analysis.distilledJob?.roleTitle}`;
            const instructions = analysis.resumeTailoringInstructions || analysis.tailoringInstructions || [];
            const tailoredBullets = await tailorExperienceBlock(block, textToUse, instructions, userTier);

            const updatedJob: SavedJob = {
                ...job,
                tailoredResumes: {
                    ...(job.tailoredResumes || {}),
                    [block.id]: tailoredBullets
                }
            };

            await Storage.updateJob(updatedJob);
            onUpdateJob(updatedJob);
            showSuccess("Experience block hyper-tailored!");
        } catch (err) {
            showError("Tailoring failed: " + (err as Error).message);
        } finally {
            setTailoringBlockId(null);
        }
    }, [job, analysis, tailoringBlockId, onUpdateJob, showError, showSuccess]);

    return {
        activeTab,
        setActiveTab,
        analysisProgress,
        tailoringBlockId,
        performAnalysis,
        handleHyperTailor,
        analysis,
        bestResume,
        manualText,
        setManualText,
        editUrl,
        setEditUrl,
        retrying,
        setRetrying,
        generating,
        setGenerating
    };
};
