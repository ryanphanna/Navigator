import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedJob, AppState } from '../../../types';
import { Storage } from '../../../services/storageService';
import { analyzeJobFit } from '../../../services/geminiService';
import { ScraperService } from '../../../services/scraperService';
import { CanonicalService } from '../../../services/seo/canonicalService';
import { checkAnalysisLimit, incrementAnalysisCount, getUsageStats, type UsageStats, type UsageLimitResult } from '../../../services/usageLimits';
import { useToast } from '../../../contexts/ToastContext';
import { useUser } from '../../../contexts/UserContext';

// Define the shape of the context
interface JobContextType {
    jobs: SavedJob[];
    activeJobId: string | null;
    activeJob: SavedJob | undefined;
    isLoading: boolean;
    usageStats: UsageStats;
    showUpgradeModal: boolean;
    upgradeModalData: UsageLimitResult | null;
    nudgeJob: SavedJob | null;
    dismissNudge: () => void;

    // Actions
    setActiveJobId: (id: string | null) => void;
    handleUpdateJob: (job: SavedJob) => Promise<void>;
    handleJobCreated: (job: SavedJob) => Promise<void>;
    handleDraftApplication: (url: string) => Promise<void>;
    handleDeleteJob: (id: string) => void;
    handleAnalyzeJob: (job: SavedJob, contextState: { resumes: AppState['resumes'], skills: AppState['skills'] }) => Promise<SavedJob>;
    handlePromoteFromFeed: (jobId: string) => Promise<void>;
    handleSaveFromFeed: (jobId: string) => Promise<void>;
    closeUpgradeModal: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobContext = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobContext must be used within a JobProvider');
    }
    return context;
};

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAdmin } = useUser();
    const { showInfo, showError } = useToast();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState<SavedJob[]>([]);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Usage Stats State
    const [usageStats, setUsageStats] = useState<UsageStats>({
        tier: 'free', totalAnalyses: 0, todayAnalyses: 0, totalAICalls: 0, limit: 3
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
            // Revert on failure (could implement if needed, but keeping simple for now)
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

            // NOTE: We need resumes and skills. Since those are not yet in contexts, 
            // we accept them as arguments for now. Future step: consume ResumeContext here.
            const analysis = await analyzeJobFit(textToAnalyze, resumes, skills, undefined);
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

        // Trigger analysis (will fail if resumes/skills not passed, need to solve this dependency)
        // For now, we will rely on keying off the UI to trigger the actual analysis 
        // OR we move resumes/skills into contexts soon.
        // For this refactor step, we'll leave the automatic *deep* analysis for the component to trigger
        // or we need access to resumes/skills.

    }, [user, isAdmin, navigate, showError]);

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
            // If not in local state, it might be in DB only. 
            // We should ideally have it in state if it's visible in the Feed.
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
        // Need access to resumes... for now defaulting to master or need to pass it.
        // This highlights the coupling. 
        // Strategy: Create the job, then let the UI or a separate effect trigger the analysis
        // once we have the data.

        const newJob: SavedJob = {
            id: jobId,
            company: 'Analyzing...',
            position: 'Drafting Application...',
            description: '',
            url,
            resumeId: 'master', // Placeholder until ResumeContext
            dateAdded: Date.now(),
            status: 'analyzing' as const,
        };

        await Storage.addJob(newJob);
        setJobs(prev => [newJob, ...prev]);
        setActiveJobId(jobId);
        navigate(`/job/${jobId}`);
        showInfo("Drafting your tailored application...");

        // Async follow up would go here
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
        // Look for applied jobs older than 7 days that aren't rejected/interviewing
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

    return (
        <JobContext.Provider value={{
            jobs,
            activeJobId,
            activeJob,
            isLoading,
            usageStats,
            showUpgradeModal: !!upgradeModalData,
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
        }}>
            {children}
        </JobContext.Provider>
    );
};
