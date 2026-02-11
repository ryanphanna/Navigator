import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AppState, SavedJob, ResumeProfile, CustomSkill, TargetJob, Transcript } from '../types';
import { Storage } from '../services/storageService';
import { parseResumeFile, analyzeJobFit } from '../services/geminiService';
import { ScraperService } from '../services/scraperService';
import { checkAnalysisLimit, incrementAnalysisCount, getUsageStats, type UsageLimitResult, type UsageStats } from '../services/usageLimits';
import { useLocalStorage } from './useLocalStorage';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';
import { TIME_PERIODS, STORAGE_KEYS, ROUTES } from '../constants';
import { CanonicalService } from '../services/seo/canonicalService';

export const useAppLogic = () => {
    // Auth & Context
    const { user, isAdmin } = useUser();
    const { showSuccess, showError, showInfo } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    // Persist transcript
    const [transcript] = useLocalStorage<Transcript | null>(STORAGE_KEYS.TRANSCRIPT_CACHE, null);

    // Global State
    const [state, setState] = useState<AppState>({
        resumes: [],
        jobs: [],
        roleModels: [],
        targetJobs: [],
        skills: [],
        activeSubmissionId: null,
        apiStatus: 'checking',
    });

    // Derive currentView from location
    const currentView = (() => {
        const path = location.pathname;
        if (path === ROUTES.HOME) return 'home';
        if (path === ROUTES.ANALYZE) return 'job-fit';
        if (path === ROUTES.HISTORY) return 'history';
        if (path.startsWith('/job/')) return 'job-detail';
        if (path === ROUTES.RESUMES) return 'resumes';
        if (path === ROUTES.SKILLS) return 'skills';
        if (path === ROUTES.PRO_FEED || path === '/feed') return 'pro';
        if (path === ROUTES.ADMIN) return 'admin';
        if (path === ROUTES.COACH_ROLE_MODELS) return 'coach-role-models';
        if (path === ROUTES.COACH_GAP) return 'coach-gap-analysis';
        if (path === ROUTES.COACH_HOME) return 'coach-home';
        if (path.startsWith('/grad')) return 'grad';
        if (path === ROUTES.COVER_LETTERS) return 'cover-letters';
        return 'home';
    })();

    // Sync activeJobId with URL
    useEffect(() => {
        const match = location.pathname.match(/\/job\/([^/]+)/);
        if (match) {
            setState(prev => ({ ...prev, activeSubmissionId: match[1] }));
        } else {
            setState(prev => ({ ...prev, activeSubmissionId: null }));
        }
    }, [location.pathname]);


    // Resume Import State
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importTrigger, setImportTrigger] = useState(0);

    // Nudge State
    const [nudgeJob, setNudgeJob] = useState<SavedJob | null>(null);

    // Usage tracking
    const [usageStats, setUsageStats] = useState<UsageStats>({
        tier: 'free',
        totalAnalyses: 0,
        todayAnalyses: 0,
        totalAICalls: 0,
        limit: 3
    });
    const [showUpgradeModal, setShowUpgradeModal] = useState<UsageLimitResult | null>(null);

    // UI State
    const [showSettings, setShowSettings] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [interviewSkill, setInterviewSkill] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(() => {
        return !localStorage.getItem(STORAGE_KEYS.WELCOME_SEEN);
    });

    // Background Tasks
    const [activeAnalysisIds, setActiveAnalysisIds] = useState<Set<string>>(new Set());

    // --- Effects ---

    // 1. Load Data on Mount
    useEffect(() => {
        const loadData = async () => {
            const storedResumes = await Storage.getResumes();
            const storedJobs = await Storage.getJobs();
            const storedSkills = await Storage.getSkills();
            const storedRoleModels = await Storage.getRoleModels();
            const storedTargetJobs = await Storage.getTargetJobs();

            const sanitizedJobs = (storedJobs || []).map(job => {
                if (job.status === 'analyzing') {
                    if (job.analysis && job.analysis.compatibilityScore) {
                        return { ...job, status: 'saved' as const };
                    }
                    return { ...job, status: 'error' as const };
                }
                return job;
            });

            setState(prev => ({
                ...prev,
                resumes: storedResumes,
                jobs: sanitizedJobs,
                skills: storedSkills,
                roleModels: storedRoleModels,
                targetJobs: storedTargetJobs,
                activeSubmissionId: null, // Initial load, let URL effect handle it? Or maybe wait for URL effect.
                apiStatus: 'ok',
            }));
        };
        loadData();
    }, []);

    // 2. Load Usage Stats
    useEffect(() => {
        if (user) {
            getUsageStats(user.id).then(setUsageStats).catch(console.error);
        } else {
            setUsageStats({ tier: 'free', totalAnalyses: 0, todayAnalyses: 0, totalAICalls: 0, limit: 3 });
        }
    }, [user]);

    // 3. Nudge Logic
    useEffect(() => {
        if (sessionStorage.getItem('nudgeSeen')) return;

        const findNudge = () => {
            const now = Date.now();
            const candidates = state.jobs.filter(job => {
                const isOldEnough = (now - new Date(job.dateAdded).getTime()) > TIME_PERIODS.NUDGE_THRESHOLD_MS;
                const isHighQuality = (job.fitScore || 0) >= 80;
                const isPending = !job.status || ['saved', 'applied', 'analyzing'].includes(job.status);
                return isOldEnough && isHighQuality && isPending;
            });

            if (candidates.length > 0) {
                const randomJob = candidates[Math.floor(Math.random() * candidates.length)];
                setNudgeJob(randomJob);
                sessionStorage.setItem('nudgeSeen', 'true');
            }
        };

        const timer = setTimeout(findNudge, TIME_PERIODS.NUDGE_DELAY_MS);
        return () => clearTimeout(timer);
    }, [state.jobs]);

    // --- Actions ---

    // Updated setView to use Router
    const setView = (view: string) => {
        switch (view) {
            case 'home':
                navigate('/');
                break;
            case 'job-fit':
                navigate('/analyze');
                break;
            case 'history':
                navigate('/history');
                break;
            case 'resumes':
                navigate('/resumes');
                break;
            case 'skills':
                navigate('/skills');
                break;
            case 'pro':
                navigate('/feed');
                break;
            case 'admin':
                navigate('/admin');
                break;
            case 'coach':
            case 'coach-home':
                navigate('/coach');
                break;
            case 'coach-role-models':
                navigate('/coach/role-models');
                break;
            case 'coach-gap-analysis':
                navigate('/coach/gap-analysis');
                break;
            case 'grad':
                navigate('/grad');
                break;
            case 'cover-letters':
                navigate('/cover-letters');
                break;
            case 'job-detail':
                if (state.activeSubmissionId) {
                    navigate(`/job/${state.activeSubmissionId}`);
                }
                break;
            default:
                console.warn(`Unknown view: ${view}`);
                navigate('/');
        }
    };

    const setActiveSubmissionId = (id: string | null) => {
        // Just state update? No, should navigate if not null
        if (id) {
            // Check if we need to navigate
            if (location.pathname !== `/job/${id}`) {
                navigate(`/job/${id}`);
            }
        } else {
            if (location.pathname.startsWith('/job/')) {
                navigate('/history'); // Default fallback? Or just stay? Usually clearing ID happens on back
            }
        }
        setState(prev => ({ ...prev, activeSubmissionId: id }));
    };

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

        // Auto-navigate to job detail
        navigate(`/job/${newJob.id}`);

        if (user && !isAdmin) {
            await incrementAnalysisCount(user.id);
            setUsageStats(await getUsageStats(user.id));
        }

        (async () => {
            try {
                const analysis = await analyzeJobFit(newJob.description || '', state.resumes, state.skills);

                // SEO Canonical Logic: Determine Role ID
                const roleTitle = analysis.distilledJob?.roleTitle || newJob.position;
                const { bucket } = CanonicalService.getCanonicalRole(roleTitle);

                const completedJob = {
                    ...newJob,
                    status: 'saved' as const,
                    analysis,
                    position: roleTitle,
                    company: analysis.distilledJob?.companyName || newJob.company,
                    roleId: bucket.id // Store the bucket mapping
                };
                await Storage.saveJob(completedJob);
                handleUpdateJob(completedJob);
            } catch (err) {
                console.error("Background Analysis Failed:", err);
                const failedJob = { ...newJob, status: 'error' as const };
                await Storage.saveJob(failedJob);
                handleUpdateJob(failedJob);
            }
        })();
    };

    const handleTargetJobCreated = (newTarget: TargetJob) => {
        setState(prev => ({
            ...prev,
            targetJobs: [newTarget, ...prev.targetJobs],
        }));
        navigate('/coach/gap-analysis');
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

    const handleImportResume = async (file: File) => {
        setIsParsingResume(true);
        setImportError(null);
        try {
            const base64Str = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const base64Data = base64Str.split(',')[1];
            const blocks = await parseResumeFile(base64Data, file.type);
            const newProfile: ResumeProfile = {
                id: crypto.randomUUID(),
                name: file.name.replace(/\.[^/.]+$/, "") || "Uploaded Resume",
                blocks: blocks
            };
            const profiles = await Storage.addResume(newProfile);
            setState(prev => ({ ...prev, resumes: profiles }));
            setImportTrigger(t => t + 1);
        } catch (err) {
            console.error(err);
            setImportError((err as Error).message);
        } finally {
            setIsParsingResume(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            showSuccess("Successfully signed out");
        } catch (err) {
            console.error("Sign out error:", err);
            showError("Failed to sign out");
        }
    };

    const handleNudgeResponse = (status: 'interview' | 'rejected' | 'ghosted') => {
        if (!nudgeJob) return;
        handleUpdateJob({ ...nudgeJob, status: status });
        setNudgeJob(null);
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
            status: 'analyzing',
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
            await Storage.saveJob(jobWithText);

            const analysis = await analyzeJobFit(text, state.resumes, state.skills);
            const completedJob = {
                ...jobWithText,
                status: 'saved' as const,
                analysis: analysis,
                position: analysis.distilledJob?.roleTitle || 'Untitled'
            };
            await Storage.saveJob(completedJob);
            handleUpdateJob(completedJob);
        } catch (err) {
            console.error("Draft Application Failed", err);
            const failedJob = { ...newJob, status: 'error' as const };
            await Storage.saveJob(failedJob);
            handleUpdateJob(failedJob);
        }
    };

    const handleWelcomeContinue = () => {
        localStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, 'true');
        setShowWelcome(false);
    };

    const handleInterviewComplete = async (proficiency: CustomSkill['proficiency'], evidence: string) => {
        if (!interviewSkill) return;
        const updatedSkill = await Storage.saveSkill({
            name: interviewSkill,
            proficiency,
            evidence
        });
        setState(prev => ({
            ...prev,
            skills: prev.skills.map(s => s.name === interviewSkill ? updatedSkill : s).concat(
                prev.skills.some(s => s.name === interviewSkill) ? [] : [updatedSkill]
            )
        }));
        setInterviewSkill(null);
    };

    // Public API
    return {
        state,
        setState,
        transcript,
        usage: {
            stats: usageStats,
            showUpgradeModal,
            setShowUpgradeModal
        },
        ui: {
            isParsingResume,
            importError,
            importTrigger,
            nudgeJob,
            setNudgeJob,
            activeAnalysisIds,
            setActiveAnalysisIds,
            currentView,
            showSettings,
            setShowSettings,
            showAuth,
            setShowAuth,
            showWelcome,
            interviewSkill,
            setInterviewSkill
        },
        actions: {
            setView,
            setActiveSubmissionId,
            handleJobCreated,
            handleUpdateJob,
            handleTargetJobCreated,
            handleDeleteJob,
            handleImportResume,
            handleSignOut,
            handleNudgeResponse,
            handleDraftApplication,
            handleWelcomeContinue,
            handleInterviewComplete
        },
        toast: {
            showInfo,
            showSuccess,
            showError
        }
    };
};
