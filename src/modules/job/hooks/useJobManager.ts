import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedJob, AppState } from '../../../types';
import { Storage } from '../../../services/storageService';
import { analyzeJobFit } from '../../../services/geminiService';
import { ScraperService } from '../../../services/scraperService';
import { CanonicalService } from '../../../services/seo/canonicalService';
import { checkAnalysisLimit, incrementAnalysisCount, getUsageStats, type UsageStats, type UsageLimitResult } from '../../../services/usageLimits';
import { useToast } from '../../../contexts/ToastContext';
import { useUser } from '../../../contexts/UserContext';

export const useJobManager = () => {
    const { user, isAdmin } = useUser();
    const { showInfo, showError } = useToast();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState<SavedJob[]>([]);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Usage Stats State
    const [usageStats, setUsageStats] = useState<UsageStats>({
        tier: isAdmin ? 'admin' : 'free',
        totalAnalyses: 0,
        todayAnalyses: 0,
        totalAICalls: 0,
        limit: isAdmin ? Infinity : 3
    });
    const [upgradeModalData, setUpgradeModalData] = useState<UsageLimitResult | null>(null);

    // Initial Load
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        Storage.getJobs().then(loadedJobs => {
            if (mounted) {
                setJobs(loadedJobs);
                setIsLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    // Sync Usage Stats
    useEffect(() => {
        if (user) {
            getUsageStats(user.id).then(setUsageStats).catch(console.error);
        }
    }, [user]);

    const activeJob = jobs.find(j => j.id === activeJobId);

    const handleUpdateJob = useCallback(async (updatedJob: SavedJob) => {
        // Optimistic update
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));

        try {
            await Storage.updateJob(updatedJob);
        } catch (err) {
            console.error("FAILED TO PERSIST JOB:", err);
            showError("Critical: Failed to save changes.");
        }
    }, [showError]);

    const handleAnalyzeJob = useCallback(async (job: SavedJob, { resumes, skills }: { resumes: AppState['resumes'], skills: AppState['skills'] }) => {
        let textToAnalyze = job.description || '';

        try {
            if (!textToAnalyze && job.url) {
                const scrapedText = await ScraperService.scrapeJobContent(job.url);
                if (scrapedText) textToAnalyze = scrapedText;
            }

            if (!textToAnalyze) throw new Error("No job description found.");

            const analysis = await analyzeJobFit(textToAnalyze, resumes, skills, undefined, job.id);
            const roleTitle = analysis.distilledJob?.roleTitle || job.position;
            const { bucket } = CanonicalService.getCanonicalRole(roleTitle);

            const completedJob: SavedJob = {
                ...job,
                description: textToAnalyze,
                status: 'saved' as const,
                analysis,
                position: roleTitle,
                company: analysis.distilledJob?.companyName || job.company,
                roleId: bucket.id
            };

            await Storage.updateJob(completedJob);
            await handleUpdateJob(completedJob);
            return completedJob;
        } catch (err) {
            console.error("Analysis Failed:", err);
            const failedJob = { ...job, status: 'error' as const };
            await Storage.updateJob(failedJob);
            await handleUpdateJob(failedJob);
            throw err;
        }
    }, [handleUpdateJob]);

    const handleJobCreated = useCallback(async (newJob: SavedJob) => {
        // Usage Check
        if (user && !isAdmin) {
            const limitCheck = await checkAnalysisLimit(user.id);
            if (!limitCheck.allowed) {
                setUpgradeModalData(limitCheck);
                return;
            }
        }

        await Storage.addJob(newJob);
        setJobs(prev => {
            const exists = prev.some(j => j.id === newJob.id);
            if (exists) return prev;
            return [newJob, ...prev];
        });
        setActiveJobId(newJob.id);
        navigate(`/job/${newJob.id}`);

        if (user && !isAdmin) {
            await incrementAnalysisCount(user.id);
            const stats = await getUsageStats(user.id);
            setUsageStats(stats);
        }
    }, [user, isAdmin, navigate]);

    const handleSaveFromFeed = useCallback(async (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        const updatedJob: SavedJob = {
            ...job,
            status: 'saved' as const,
        };

        await Storage.updateJob(updatedJob);
        setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
        showInfo("Saved to your history!");
    }, [jobs, showInfo]);

    const handlePromoteFromFeed = useCallback(async (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            showError("Job not found in local state.");
            return;
        }

        const updatedJob: SavedJob = {
            ...job,
            status: 'analyzing' as const,
        };

        await Storage.updateJob(updatedJob);
        setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
        setActiveJobId(jobId);
        navigate(`/job/${jobId}`);
        showInfo("Promoting job alert to application...");
    }, [jobs, navigate, showInfo, showError]);

    const handleDraftApplication = useCallback(async (url: string) => {
        const jobId = crypto.randomUUID();
        const newJob: SavedJob = {
            id: jobId,
            company: 'Analyzing...',
            position: 'Drafting Application...',
            description: '',
            url,
            resumeId: 'master',
            dateAdded: Date.now(),
            status: 'analyzing' as const,
        };

        await Storage.addJob(newJob);
        setJobs(prev => [newJob, ...prev]);
        setActiveJobId(jobId);
        navigate(`/job/${jobId}`);
        showInfo("Drafting your tailored application...");
    }, [navigate, showInfo]);

    const handleDeleteJob = useCallback((id: string) => {
        Storage.deleteJob(id);
        setJobs(prev => prev.filter(j => j.id !== id));
        if (activeJobId === id) setActiveJobId(null);
        navigate('/history');
    }, [activeJobId, navigate]);

    const [nudgeDismissed, setNudgeDismissed] = useState(false);
    const [nudgeJob, setNudgeJob] = useState<SavedJob | null>(null);

    // Nudge Logic
    useEffect(() => {
        if (isLoading || jobs.length === 0 || nudgeDismissed) return;

        const now = Date.now();
        const staleJob = jobs.find(j =>
            j.status === 'applied' &&
            (now - j.dateAdded) > (7 * 24 * 60 * 60 * 1000)
        );

        if (staleJob) {
            setNudgeJob(staleJob);
        }
    }, [jobs, isLoading, nudgeDismissed]);

    const dismissNudge = useCallback(() => {
        setNudgeJob(null);
        setNudgeDismissed(true);
    }, []);

    return {
        jobs,
        activeJobId,
        activeJob,
        isLoading,
        usageStats,
        upgradeModalData,
        nudgeJob,
        setActiveJobId,
        handleUpdateJob,
        handleJobCreated,
        handleDraftApplication,
        handleDeleteJob,
        handleAnalyzeJob,
        handlePromoteFromFeed,
        handleSaveFromFeed,
        closeUpgradeModal: () => setUpgradeModalData(null),
        dismissNudge
    };
};
