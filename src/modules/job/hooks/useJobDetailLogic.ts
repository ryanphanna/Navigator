import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { analyzeJobFit, tailorExperienceBlock, generateTailoredSummary } from '../../../services/geminiService';
import { Storage } from '../../../services/storageService';
import { RESUME_TAILORING } from '../../../constants';
import type { SavedJob } from '../types';
import type { ExperienceBlock, ResumeProfile } from '../../resume/types';
import type { CustomSkill } from '../../skills/types';

export const useJobDetailLogic = ({
    job,
    resumes,
    userSkills,
    onUpdateJob,
    showError,
    showSuccess,
    onAnalyzeJob
}: {
    job: SavedJob;
    resumes: ResumeProfile[];
    userSkills: CustomSkill[];
    onUpdateJob: (job: SavedJob) => void;
    showError: (msg: string) => void;
    showSuccess: (msg: string) => void;
    onAnalyzeJob?: (job: SavedJob) => Promise<SavedJob>;
}) => {
    const [activeTab, setActiveTab] = useState<'analysis' | 'resume' | 'cover-letter' | 'job-post'>('analysis');
    const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
    const [tailoringBlockId, setTailoringBlockId] = useState<string | null>(null);
    const [bulkTailoringProgress, setBulkTailoringProgress] = useState<{ current: number; total: number } | null>(null);
    const [generatingSummary, setGeneratingSummary] = useState(false);
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
                const result = await analyzeJobFit(job.description || '', resumes, userSkills, (msg) => setAnalysisProgress(msg), job.id);
                const finalJob: SavedJob = { ...job, analysis: result, status: 'saved' as const };
                await Storage.updateJob(finalJob);
                onUpdateJob(finalJob);
            }
            setAnalysisProgress(null);
        } catch (err) {
            setAnalysisProgress(null);
            showError("Analysis failed: " + (err as Error).message);
        }
    }, [job.id, job.description, onAnalyzeJob, resumes, userSkills, onUpdateJob, showError]);

    const hasStartedAnalysis = useRef(false);

    useEffect(() => {
        if (job.status !== 'analyzing') {
            hasStartedAnalysis.current = false;
            return;
        }

        if (job.status === 'analyzing' && !analysis && !hasStartedAnalysis.current) {
            hasStartedAnalysis.current = true;
            performAnalysis();
        }
    }, [job.status, analysis, performAnalysis]);

    const handleHyperTailor = useCallback(async (block: ExperienceBlock) => {
        if (!analysis || tailoringBlockId) return;

        const currentCount = job.tailorCounts?.[block.id] || 0;
        if (currentCount >= RESUME_TAILORING.MAX_TAILORS_PER_BLOCK) {
            showError(`Limit reached (${RESUME_TAILORING.MAX_TAILORS_PER_BLOCK}/${RESUME_TAILORING.MAX_TAILORS_PER_BLOCK}). Save this job or use another block.`);
            return;
        }

        setTailoringBlockId(block.id);
        try {
            const textToUse = analysis.cleanedDescription || job.description || `Role: ${analysis.distilledJob?.roleTitle}`;
            const instructions = analysis.resumeTailoringInstructions || analysis.tailoringInstructions || [];
            const tailoredBullets = await tailorExperienceBlock(block, textToUse, instructions, job.id);

            const updatedJob: SavedJob = {
                ...job,
                tailoredResumes: {
                    ...(job.tailoredResumes || {}),
                    [block.id]: tailoredBullets
                },
                tailorCounts: {
                    ...(job.tailorCounts || {}),
                    [block.id]: currentCount + 1
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

    const handleBulkTailor = useCallback(async (blocks: ExperienceBlock[]) => {
        if (!analysis || tailoringBlockId || bulkTailoringProgress) return;

        const untailored = blocks.filter(b => {
            const counts = job.tailorCounts?.[b.id] || 0;
            return !job.tailoredResumes?.[b.id] && counts < RESUME_TAILORING.MAX_TAILORS_PER_BLOCK;
        });

        if (untailored.length === 0) {
            showSuccess("No eligible blocks to tailor (already tailored or limit reached).");
            return;
        }

        setBulkTailoringProgress({ current: 0, total: untailored.length });
        let currentJob = { ...job };

        try {
            for (let i = 0; i < untailored.length; i++) {
                const block = untailored[i];
                const currentCount = currentJob.tailorCounts?.[block.id] || 0;
                setBulkTailoringProgress({ current: i + 1, total: untailored.length });
                setTailoringBlockId(block.id);

                const textToUse = analysis.cleanedDescription || currentJob.description || `Role: ${analysis.distilledJob?.roleTitle}`;
                const instructions = analysis.resumeTailoringInstructions || analysis.tailoringInstructions || [];
                const tailoredBullets = await tailorExperienceBlock(block, textToUse, instructions, currentJob.id);

                currentJob = {
                    ...currentJob,
                    tailoredResumes: {
                        ...(currentJob.tailoredResumes || {}),
                        [block.id]: tailoredBullets
                    },
                    tailorCounts: {
                        ...(currentJob.tailorCounts || {}),
                        [block.id]: currentCount + 1
                    }
                };
            }

            await Storage.updateJob(currentJob);
            onUpdateJob(currentJob);
            showSuccess(`${untailored.length} blocks tailored!`);
        } catch (err) {
            // Save partial progress
            await Storage.updateJob(currentJob);
            onUpdateJob(currentJob);
            showError("Bulk tailoring stopped: " + (err as Error).message);
        } finally {
            setTailoringBlockId(null);
            setBulkTailoringProgress(null);
        }
    }, [job, analysis, tailoringBlockId, bulkTailoringProgress, onUpdateJob, showError, showSuccess]);

    const handleResetBlock = useCallback(async (blockId: string) => {
        if (!job.tailoredResumes?.[blockId]) return;

        const { [blockId]: _, ...remaining } = job.tailoredResumes;
        const updatedJob: SavedJob = {
            ...job,
            tailoredResumes: Object.keys(remaining).length > 0 ? remaining : undefined
        };

        await Storage.updateJob(updatedJob);
        onUpdateJob(updatedJob);
        showSuccess("Reset to original");
    }, [job, onUpdateJob, showSuccess]);

    const handleGenerateSummary = useCallback(async () => {
        if (!analysis || generatingSummary) return;

        setGeneratingSummary(true);
        try {
            const textToUse = analysis.cleanedDescription || job.description || '';
            const summary = await generateTailoredSummary(textToUse, resumes, job.id);

            const updatedJob: SavedJob = { ...job, tailoredSummary: summary };
            await Storage.updateJob(updatedJob);
            onUpdateJob(updatedJob);
            showSuccess("Professional summary generated!");
        } catch (err) {
            showError("Summary generation failed: " + (err as Error).message);
        } finally {
            setGeneratingSummary(false);
        }
    }, [job, analysis, resumes, generatingSummary, onUpdateJob, showError, showSuccess]);

    return {
        activeTab,
        setActiveTab,
        analysisProgress,
        tailoringBlockId,
        bulkTailoringProgress,
        generatingSummary,
        performAnalysis,
        handleHyperTailor,
        handleBulkTailor,
        handleResetBlock,
        handleGenerateSummary,
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
