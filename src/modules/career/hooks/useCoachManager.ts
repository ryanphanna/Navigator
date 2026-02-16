import { useState, useEffect, useCallback } from 'react';
import type { AppState, RoleModelProfile, TargetJob, Transcript, GapAnalysisResult } from '../../../types';
import { Storage } from '../../../services/storageService';
import { parseRoleModel, analyzeGap, analyzeRoleModelGap, generateRoadmap } from '../../../services/geminiService';
import { ScraperService } from '../../../services/scraperService';
import { useToast } from '../../../contexts/ToastContext';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../constants';

export const useCoachManager = () => {
    const { showInfo } = useToast();

    const [roleModels, setRoleModels] = useState<RoleModelProfile[]>([]);
    const [targetJobs, setTargetJobs] = useState<TargetJob[]>([]);
    const [transcript, setTranscript] = useLocalStorage<Transcript | null>(STORAGE_KEYS.TRANSCRIPT_CACHE, null);
    const [activeAnalysisIds, setActiveAnalysisIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        Promise.all([
            Storage.getRoleModels(),
            Storage.getTargetJobs()
        ]).then(([loadedRoleModels, loadedTargetJobs]) => {
            if (mounted) {
                setRoleModels(loadedRoleModels);
                setTargetJobs(loadedTargetJobs);
                setIsLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    const handleAddRoleModel = useCallback(async (file: File) => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise<void>((resolve, reject) => {
                reader.onload = async () => {
                    try {
                        const base64 = (reader.result as string).split(',')[1];
                        const parsed = await parseRoleModel(base64, file.type);
                        const updated = await Storage.addRoleModel(parsed);
                        setRoleModels(updated);
                        resolve();
                    } catch (err) { reject(err); }
                };
                reader.onerror = () => reject(new Error("Failed to read file"));
            });
        } catch (err) {
            console.error("Failed to add role model:", err);
        }
    }, []);

    const handleDeleteRoleModel = useCallback(async (id: string) => {
        const updated = await Storage.deleteRoleModel(id);
        setRoleModels(updated);
    }, []);

    const handleRunGapAnalysis = useCallback(async (targetJobId: string, { resumes, skills }: { resumes: AppState['resumes'], skills: AppState['skills'] }) => {
        const targetJob = targetJobs.find(tj => tj.id === targetJobId);
        if (!targetJob) return;

        setActiveAnalysisIds(prev => new Set(prev).add(targetJobId));
        if (showInfo) showInfo("AI Coach is analyzing your skill gap in the background...");

        try {
            const analysisPromise = (targetJob.type === 'role_model' && targetJob.roleModelId)
                ? (() => {
                    const rm = roleModels.find(r => r.id === targetJob.roleModelId);
                    return rm
                        ? analyzeRoleModelGap(rm, resumes, skills)
                        : Promise.reject(new Error("Role Model not found"));
                })()
                : analyzeGap(roleModels, resumes, skills, transcript);

            const analysis: GapAnalysisResult = await analysisPromise;

            const updatedTargetJob = { ...targetJob, gapAnalysis: analysis };
            const updatedList = await Storage.saveTargetJob(updatedTargetJob);
            setTargetJobs(updatedList);
        } catch (err) {
            console.error("Gap Analysis Failed", err);
        } finally {
            setActiveAnalysisIds(prev => {
                const next = new Set(prev);
                next.delete(targetJobId);
                return next;
            });
        }
    }, [targetJobs, roleModels, transcript, showInfo]);

    const handleGenerateRoadmap = useCallback(async (targetJobId: string) => {
        const targetJob = targetJobs.find(tj => tj.id === targetJobId);
        if (!targetJob || !targetJob.gapAnalysis) return;

        setActiveAnalysisIds(prev => new Set(prev).add(`${targetJobId}-roadmap`));
        if (showInfo) showInfo("AI Coach is building your 12-month roadmap...");

        try {
            const roadmap = await generateRoadmap(targetJob.gapAnalysis);
            const updatedTargetJob = { ...targetJob, roadmap };
            const updatedList = await Storage.saveTargetJob(updatedTargetJob);
            setTargetJobs(updatedList);
        } catch (err) {
            console.error("Roadmap Generation Failed", err);
        } finally {
            setActiveAnalysisIds(prev => {
                const next = new Set(prev);
                next.delete(`${targetJobId}-roadmap`);
                return next;
            });
        }
    }, [targetJobs, showInfo]);

    const handleToggleMilestone = useCallback(async (targetJobId: string, milestoneId: string) => {
        const targetJob = targetJobs.find(tj => tj.id === targetJobId);
        if (!targetJob || !targetJob.roadmap) return;

        const updatedRoadmap = targetJob.roadmap.map(m =>
            m.id === milestoneId ? { ...m, status: (m.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' } : m
        );
        const updatedTargetJob = { ...targetJob, roadmap: updatedRoadmap };
        const updatedList = await Storage.saveTargetJob(updatedTargetJob);
        setTargetJobs(updatedList);
    }, [targetJobs]);

    const handleTargetJobCreated = useCallback(async (url: string) => {
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
            setTargetJobs(updated);
        } catch (err) {
            console.error("Failed to add target job:", err);
            throw err;
        }
    }, []);

    const handleEmulateRoleModel = useCallback(async (roleModelId: string) => {
        const roleModel = roleModels.find(rm => rm.id === roleModelId);
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
        setTargetJobs(updated);
    }, [roleModels]);

    const handleUpdateTargetJob = useCallback(async (targetJob: TargetJob) => {
        const updatedList = await Storage.saveTargetJob(targetJob);
        setTargetJobs(updatedList);
    }, []);

    return {
        roleModels,
        targetJobs,
        transcript,
        activeAnalysisIds,
        isLoading,
        handleAddRoleModel,
        handleDeleteRoleModel,
        handleRunGapAnalysis,
        handleGenerateRoadmap,
        handleToggleMilestone,
        handleTargetJobCreated,
        handleEmulateRoleModel,
        handleUpdateTargetJob,
        setTranscript
    };
};
