import { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeJobFit } from '../../../services/geminiService';
import { Storage } from '../../../services/storageService';
import { LocalStorage } from '../../../utils/localStorage';
import { STORAGE_KEYS } from '../../../constants';
import type { SavedJob } from '../types';
import type { ResumeProfile } from '../../resume/types';
import type { CustomSkill } from '../../skills/types';
import type { Transcript } from '../../grad/types';

export const useJobAnalysis = (
    job: SavedJob,
    resumes: ResumeProfile[],
    userSkills: CustomSkill[],
    onUpdateJob: (job: SavedJob) => void,
    showError: (msg: string) => void,
    onAnalyzeJob?: (job: SavedJob) => Promise<SavedJob>
) => {
    const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
    const hasStartedAnalysis = useRef(false);

    const performAnalysis = useCallback(async () => {
        setAnalysisProgress("Preparing evaluation...");
        try {
            if (onAnalyzeJob) {
                await onAnalyzeJob(job);
            } else {
                let transcript: Transcript | null = null;
                const savedTranscript = LocalStorage.get(STORAGE_KEYS.TRANSCRIPT_CACHE);
                if (savedTranscript) {
                    try { transcript = JSON.parse(savedTranscript); } catch (e) { console.error(e); }
                }

                const result = await analyzeJobFit(
                    job.description || '',
                    resumes,
                    userSkills,
                    (msg) => setAnalysisProgress(msg),
                    job.id,
                    transcript
                );
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

    useEffect(() => {
        const isHollow = job.status === 'saved' && (!job.analysis || !job.analysis.compatibilityScore);
        if (job.status !== 'analyzing' && !isHollow) {
            hasStartedAnalysis.current = false;
            return;
        }

        if ((job.status === 'analyzing' || isHollow) && !hasStartedAnalysis.current) {
            hasStartedAnalysis.current = true;
            setTimeout(() => performAnalysis(), 0);
        }
    }, [job.status, job.analysis, performAnalysis]);

    return {
        analysisProgress,
        performAnalysis
    };
};
