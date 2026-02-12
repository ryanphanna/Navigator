import { Storage } from '../services/storageService';
import { parseRoleModel, analyzeGap, analyzeRoleModelGap, generateRoadmap } from '../services/geminiService';
import { ScraperService } from '../services/scraperService';
import { useToast } from '../contexts/ToastContext';
import type { AppState, TargetJob, GapAnalysisResult, Transcript } from '../types';
import type { UsageStats } from '../services/usageLimits';

export const useCoachLogic = (
    state: AppState,
    setState: React.Dispatch<React.SetStateAction<AppState>>,
    usageStats: UsageStats,
    transcript: Transcript | null,
    setActiveAnalysisIds: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
    const { showInfo } = useToast();

    const handleAddRoleModel = async (file: File) => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const parsed = await parseRoleModel(base64, file.type);
                const updated = await Storage.addRoleModel(parsed);
                setState(prev => ({ ...prev, roleModels: updated }));
            };
        } catch (err) {
            console.error("Failed to add role model:", err);
        }
    };

    const handleDeleteRoleModel = async (id: string) => {
        const updated = await Storage.deleteRoleModel(id);
        setState(prev => ({ ...prev, roleModels: updated }));
    };

    const handleRunGapAnalysis = async (targetJobId: string) => {
        const targetJob = state.targetJobs.find(tj => tj.id === targetJobId);
        if (!targetJob) return;

        setActiveAnalysisIds(prev => new Set(prev).add(targetJobId));
        showInfo && showInfo("AI Coach is analyzing your skill gap in the background...");

        const analysisPromise = (targetJob.type === 'role_model' && targetJob.roleModelId)
            ? (() => {
                const rm = state.roleModels.find(r => r.id === targetJob.roleModelId);
                return rm
                    ? analyzeRoleModelGap(rm, state.resumes, state.skills, undefined, usageStats.tier)
                    : Promise.reject(new Error("Role Model not found"));
            })()
            : analyzeGap(state.roleModels, state.resumes, state.skills, transcript, targetJob.strictMode ?? true, usageStats.tier);

        analysisPromise
            .then(async (analysis: GapAnalysisResult) => {
                const updatedTargetJob = { ...targetJob, gapAnalysis: analysis };
                const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                setState(prev => ({ ...prev, targetJobs: updatedList }));
            })
            .finally(() => {
                setActiveAnalysisIds(prev => {
                    const next = new Set(prev);
                    next.delete(targetJobId);
                    return next;
                });
            });
    };

    const handleGenerateRoadmap = async (targetJobId: string) => {
        const targetJob = state.targetJobs.find(tj => tj.id === targetJobId);
        if (!targetJob || !targetJob.gapAnalysis) return;

        setActiveAnalysisIds(prev => new Set(prev).add(`${targetJobId}-roadmap`));
        showInfo && showInfo("AI Coach is building your 12-month roadmap...");

        generateRoadmap(targetJob.gapAnalysis, usageStats.tier)
            .then(async (roadmap) => {
                const updatedTargetJob = { ...targetJob, roadmap };
                const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                setState(prev => ({ ...prev, targetJobs: updatedList }));
            })
            .finally(() => {
                setActiveAnalysisIds(prev => {
                    const next = new Set(prev);
                    next.delete(`${targetJobId}-roadmap`);
                    return next;
                });
            });
    };

    const handleToggleMilestone = async (targetJobId: string, milestoneId: string) => {
        const targetJob = state.targetJobs.find(tj => tj.id === targetJobId);
        if (!targetJob || !targetJob.roadmap) return;

        const updatedRoadmap = targetJob.roadmap.map(m =>
            m.id === milestoneId ? { ...m, status: (m.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' } : m
        );
        const updatedTargetJob = { ...targetJob, roadmap: updatedRoadmap };
        const updatedList = await Storage.saveTargetJob(updatedTargetJob);
        setState(prev => ({ ...prev, targetJobs: updatedList }));
    };

    const handleTargetJobCreated = async (url: string) => {
        try {
            let jobDescription = url;
            if (url.startsWith('http')) {
                jobDescription = await ScraperService.scrapeJobContent(url);
            }

            const newGoal: TargetJob = {
                id: crypto.randomUUID(),
                title: 'New Dream Job',
                description: jobDescription,
                dateAdded: Date.now(),
            };

            const updated = await Storage.saveTargetJob(newGoal);
            setState(prev => ({ ...prev, targetJobs: updated }));
        } catch (err) {
            console.error("Failed to add target job:", err);
            throw err;
        }
    };

    const handleEmulateRoleModel = async (roleModelId: string) => {
        const roleModel = state.roleModels.find(rm => rm.id === roleModelId);
        if (!roleModel) return;

        const newTarget: TargetJob = {
            id: crypto.randomUUID(),
            title: `Emulate: ${roleModel.name}`,
            description: roleModel.rawTextSummary || roleModel.careerSnapshot,
            dateAdded: Date.now(),
            type: 'role_model',
            roleModelId: roleModel.id
        };

        const updated = await Storage.saveTargetJob(newTarget);
        setState(prev => ({ ...prev, targetJobs: updated }));
    };

    const handleUpdateTargetJob = async (targetJob: TargetJob) => {
        const updatedList = await Storage.saveTargetJob(targetJob);
        setState(prev => ({ ...prev, targetJobs: updatedList }));
    };

    return {
        handleAddRoleModel,
        handleDeleteRoleModel,
        handleRunGapAnalysis,
        handleGenerateRoadmap,
        handleToggleMilestone,
        handleTargetJobCreated,
        handleEmulateRoleModel,
        handleUpdateTargetJob
    };
};
