import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AppState, SavedJob, Transcript, CustomSkill } from '../types';
import { Storage } from '../services/storageService';
import { parseResumeFile } from '../services/geminiService';
import { getUsageStats, type UsageLimitResult, type UsageStats } from '../services/usageLimits';
import { useLocalStorage } from './useLocalStorage';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';
import { TIME_PERIODS, STORAGE_KEYS, ROUTES } from '../constants';
import { useJobLogic } from './useJobLogic';
import { useCoachLogic } from './useCoachLogic';

export const useAppLogic = () => {
    const { user } = useUser();
    const { showSuccess, showError, showInfo } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [transcript] = useLocalStorage<Transcript | null>(STORAGE_KEYS.TRANSCRIPT_CACHE, null);

    const [state, setState] = useState<AppState>({
        resumes: [],
        jobs: [],
        roleModels: [],
        targetJobs: [],
        skills: [],
        activeSubmissionId: null,
        apiStatus: 'checking',
    });

    const [usageStats, setUsageStats] = useState<UsageStats>({
        tier: 'free', totalAnalyses: 0, todayAnalyses: 0, totalAICalls: 0, limit: 3
    });
    const [showUpgradeModal, setShowUpgradeModal] = useState<UsageLimitResult | null>(null);
    const [activeAnalysisIds, setActiveAnalysisIds] = useState<Set<string>>(new Set());

    const coachLogic = useCoachLogic(state, setState, transcript, setActiveAnalysisIds);
    const jobLogic = useJobLogic(state, setState, setUsageStats, setShowUpgradeModal);

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

    useEffect(() => {
        const match = location.pathname.match(/\/job\/([^/]+)/);
        setState(prev => ({ ...prev, activeSubmissionId: match ? match[1] : null }));
    }, [location.pathname]);

    const [isParsingResume, setIsParsingResume] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importTrigger, setImportTrigger] = useState(0);
    const [nudgeJob, setNudgeJob] = useState<SavedJob | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [interviewSkill, setInterviewSkill] = useState<string | null>(null);

    useEffect(() => {
        Storage.getResumes().then(resumes => setState(prev => ({ ...prev, resumes })));
        Storage.getJobs().then(jobs => setState(prev => ({ ...prev, jobs })));
        Storage.getSkills().then(skills => setState(prev => ({ ...prev, skills })));
        Storage.getRoleModels().then(roleModels => setState(prev => ({ ...prev, roleModels })));
        Storage.getTargetJobs().then(targetJobs => setState(prev => ({ ...prev, targetJobs, apiStatus: 'ok' })));
    }, []);

    useEffect(() => {
        if (user) getUsageStats(user.id).then(setUsageStats).catch(console.error);
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const now = Date.now();
            const candidates = state.jobs.filter(job =>
                (now - job.dateAdded) > TIME_PERIODS.NUDGE_THRESHOLD_MS &&
                (job.fitScore || 0) >= 80 &&
                ['saved', 'applied'].includes(job.status || '')
            );
            if (candidates.length > 0 && !sessionStorage.getItem('nudgeSeen')) {
                setNudgeJob(candidates[Math.floor(Math.random() * candidates.length)]);
                sessionStorage.setItem('nudgeSeen', 'true');
            }
        }, TIME_PERIODS.NUDGE_DELAY_MS);
        return () => clearTimeout(timer);
    }, [state.jobs]);

    const handleImportResume = async (file: File) => {
        setIsParsingResume(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const blocks = await parseResumeFile(base64, file.type);
                const profiles = await Storage.addResume({ id: crypto.randomUUID(), name: file.name.replace(/\.[^/.]+$/, ""), blocks });
                setState(prev => ({ ...prev, resumes: profiles }));
                setImportTrigger(t => t + 1);
            };
        } catch (err) {
            setImportError((err as Error).message);
        } finally {
            setIsParsingResume(false);
        }
    };

    const handleInterviewComplete = async (proficiency: CustomSkill['proficiency'], evidence: string) => {
        if (!interviewSkill) return;
        const updatedSkill = await Storage.saveSkill({ name: interviewSkill, proficiency, evidence });
        setState(prev => ({
            ...prev,
            skills: prev.skills.map(s => s.name === interviewSkill ? updatedSkill : s).concat(
                prev.skills.some(s => s.name === interviewSkill) ? [] : [updatedSkill]
            )
        }));
        setInterviewSkill(null);
    };

    return {
        state, setState, transcript,
        usage: { stats: usageStats, showUpgradeModal, setShowUpgradeModal },
        ui: {
            isParsingResume, importError, importTrigger, nudgeJob, setNudgeJob,
            activeAnalysisIds, setActiveAnalysisIds, currentView, showSettings,
            setShowSettings, showAuth, setShowAuth, interviewSkill, setInterviewSkill
        },
        actions: {
            ...jobLogic,
            ...coachLogic,
            setView: (view: string) => navigate((ROUTES as any)[view.toUpperCase().replace(/-/g, '_')] || '/'),
            handleImportResume,
            handleSignOut: () => supabase.auth.signOut(),
            handleNudgeResponse: (status: any) => {
                if (nudgeJob) jobLogic.handleUpdateJob({ ...nudgeJob, status });
                setNudgeJob(null);
            },
            handleInterviewComplete
        },
        toast: { showInfo, showSuccess, showError }
    };
};
