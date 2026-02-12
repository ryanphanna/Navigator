import { useNavigate } from 'react-router-dom';
import { Storage } from '../services/storageService';
import { analyzeJobFit } from '../services/geminiService';
import { ScraperService } from '../services/scraperService';
import { CanonicalService } from '../services/seo/canonicalService';
import { checkAnalysisLimit, incrementAnalysisCount, getUsageStats } from '../services/usageLimits';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import type { UsageStats, UsageLimitResult } from '../services/usageLimits';
import type { AppState, SavedJob } from '../types';

export const useJobLogic = (
    state: AppState,
    setState: React.Dispatch<React.SetStateAction<AppState>>,
    usageStats: UsageStats,
    setUsageStats: React.Dispatch<React.SetStateAction<UsageStats>>,
    setShowUpgradeModal: React.Dispatch<React.SetStateAction<UsageLimitResult | null>>
) => {
    const { user, isAdmin } = useUser();
    const { showInfo, showError } = useToast();
    const navigate = useNavigate();

    const handleUpdateJob = (updatedJob: SavedJob) => {
        Storage.updateJob(updatedJob).catch(err => {
            console.error("FAILED TO PERSIST JOB:", err);
            showError("Critical: Failed to save changes.");
        });
        setState(prev => ({
            ...prev,
            jobs: prev.jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
        }));
    };

    const handleAnalyzeJob = async (job: SavedJob) => {
        let textToAnalyze = job.description || '';

        try {
            if (!textToAnalyze && job.url) {
                const scrapedText = await ScraperService.scrapeJobContent(job.url);
                if (scrapedText) {
                    textToAnalyze = scrapedText;
                }
            }

            if (!textToAnalyze) {
                throw new Error("No job description found.");
            }

            const analysis = await analyzeJobFit(textToAnalyze, state.resumes, state.skills, undefined, usageStats.tier);
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
            handleUpdateJob(completedJob);
            return completedJob;
        } catch (err) {
            console.error("Analysis Failed:", err);
            const failedJob = { ...job, status: 'error' as const };
            await Storage.updateJob(failedJob);
            handleUpdateJob(failedJob);
            throw err;
        }
    };

    const handleJobCreated = async (newJob: SavedJob) => {
        if (user && !isAdmin) {
            const limitCheck = await checkAnalysisLimit(user.id);
            if (!limitCheck.allowed) {
                setShowUpgradeModal(limitCheck);
                return;
            }
        }

        await Storage.addJob(newJob);
        setState(prev => ({
            ...prev,
            jobs: [newJob, ...prev.jobs].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
            activeSubmissionId: newJob.id
        }));

        navigate(`/job/${newJob.id}`);

        if (user && !isAdmin) {
            await incrementAnalysisCount(user.id);
            const stats = await getUsageStats(user.id);
            setUsageStats(stats);
        }

        handleAnalyzeJob(newJob);
    };

    const handleDraftApplication = async (url: string) => {
        const jobId = crypto.randomUUID();
        const newJob: SavedJob = {
            id: jobId,
            company: 'Analyzing...',
            position: 'Drafting Application...',
            description: '',
            url,
            resumeId: state.resumes[0]?.id || 'master',
            dateAdded: Date.now(),
            status: 'analyzing' as const,
        };

        await Storage.addJob(newJob);
        setState(prev => ({
            ...prev,
            jobs: [newJob, ...prev.jobs],
            activeSubmissionId: jobId
        }));
        navigate(`/job/${jobId}`);
        showInfo("Drafting your tailored application...");

        try {
            let text = newJob.description;
            if (!text) {
                text = await ScraperService.scrapeJobContent(url);
            }
            const jobWithText = { ...newJob, description: text };
            await Storage.updateJob(jobWithText);

            const analysis = await analyzeJobFit(text, state.resumes, state.skills, undefined, usageStats.tier);
            const completedJob = {
                ...jobWithText,
                status: 'saved' as const,
                analysis: analysis,
                position: analysis.distilledJob?.roleTitle || 'Untitled'
            };
            await Storage.updateJob(completedJob);
            handleUpdateJob(completedJob);
        } catch (err) {
            console.error("Draft Application Failed", err);
            const failedJob = { ...newJob, status: 'error' as const };
            await Storage.updateJob(failedJob);
            handleUpdateJob(failedJob);
        }
    };

    const handleDeleteJob = (id: string) => {
        Storage.deleteJob(id);
        setState(prev => ({
            ...prev,
            jobs: prev.jobs.filter(j => j.id !== id),
            activeSubmissionId: null,
        }));
        navigate('/history');
    };

    return {
        handleUpdateJob,
        handleJobCreated,
        handleDraftApplication,
        handleDeleteJob,
        handleAnalyzeJob
    };
};
