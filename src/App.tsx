import { Suspense, useState, useEffect, lazy } from 'react';
import type { AppState, SavedJob, ResumeProfile, CustomSkill, TargetJob } from './types';
import { Analytics } from '@vercel/analytics/react';

import { Storage } from './services/storageService';
import { parseResumeFile, analyzeJobFit, parseRoleModel, analyzeGap, generateRoadmap } from './services/geminiService';
import { ScraperService } from './services/scraperService';
import { checkAnalysisLimit, incrementAnalysisCount, getUsageStats, type UsageLimitResult, type UsageStats } from './services/usageLimits';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUser } from './contexts/UserContext';
import { TIME_PERIODS, STORAGE_KEYS } from './constants';
import { LoadingState } from './components/common/LoadingState';

// Main job-search components (kept static for SEO/Speed)
import HomeInput from './modules/job/HomeInput';
import History from './modules/job/History';
import JobDetail from './modules/job/JobDetail';
import { CoachDashboard } from './modules/career/CoachDashboard'; // Static import for CoachDashboard

// Lazy load heavy/beta modules
const ResumeEditor = lazy(() => import('./components/ResumeEditor'));
const JobFitPro = lazy(() => import('./modules/job/JobFitPro').then(m => ({ default: m.JobFitPro })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const GradFitPlaceholder = lazy(() => import('./modules/grad/GradFitPlaceholder').then(m => ({ default: m.GradFitPlaceholder })));

import { SkillsView } from './components/skills/SkillsView';
import { supabase } from './services/supabase';
import { SkillInterviewModal } from './components/skills/SkillInterviewModal';
import { Settings, Briefcase, TrendingUp, LogOut, GraduationCap } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthModal } from './components/AuthModal';
import { NudgeCard } from './components/NudgeCard';
import { ViewTransition } from './components/ViewTransition';
import { useToast } from './contexts/ToastContext';
import { ToastContainer } from './components/common/Toast';

// Main App Component
const App: React.FC = () => {
  // Persist current view in localStorage
  const [currentView, setCurrentView] = useLocalStorage<AppState['currentView']>(STORAGE_KEYS.CURRENT_VIEW, 'home');

  const [state, setState] = useState<AppState>({
    resumes: [],
    jobs: [],
    roleModels: [],
    targetJobs: [],
    skills: [],
    currentView: currentView,
    activeJobId: null,
    apiStatus: 'checking',
  });

  // Resume Import State
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importTrigger, setImportTrigger] = useState(0);

  // Initialize Theme only
  useEffect(() => {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Auth State (Managed by Context)
  const { user, userTier, isTester, isAdmin, simulatedTier, setSimulatedTier } = useUser();
  const [showAuth, setShowAuth] = useState(false);

  // Nudge State
  const [nudgeJob, setNudgeJob] = useState<SavedJob | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);

  // Skills Portfolio / Interview State
  const [interviewSkill, setInterviewSkill] = useState<string | null>(null);

  // Onboarding flow states
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem(STORAGE_KEYS.WELCOME_SEEN);
  });


  // Usage tracking state
  const [usageStats, setUsageStats] = useState<UsageStats>({
    tier: 'free',
    totalAnalyses: 0,
    todayAnalyses: 0,
    limit: 3
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState<UsageLimitResult | null>(null);

  // Background Tasks Tracking
  const [activeAnalysisIds, setActiveAnalysisIds] = useState<Set<string>>(new Set());
  const { showSuccess, showError, showInfo } = useToast();

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const storedResumes = await Storage.getResumes();
      const storedJobs = await Storage.getJobs();
      const storedSkills = await Storage.getSkills();
      const storedRoleModels = await Storage.getRoleModels();
      const storedTargetJobs = await Storage.getTargetJobs();

      // Fix stuck "analyzing" jobs (e.g. if user closed tab during analysis)
      const sanitizedJobs = (storedJobs || []).map(job => {
        if (job.status === 'analyzing') {
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
        currentView: 'home',
        activeJobId: null,
        apiStatus: 'ok',
      }));
    };
    loadData();
  }, []);

  // Load usage stats when user is logged in
  useEffect(() => {
    if (user) {
      getUsageStats(user.id).then(setUsageStats).catch(err => {
        console.error('Failed to load usage stats:', err);
      });
    } else {
      // Reset to free tier defaults when logged out
      setUsageStats({
        tier: 'free',
        totalAnalyses: 0,
        todayAnalyses: 0,
        limit: 3
      });
    }
  }, [user]);

  // Nudge Logic
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



  // --- Handlers ---

  const handleJobCreated = async (newJob: SavedJob) => {
    // Check usage limits before allowing job creation (Bypass for admins)
    if (user && !isAdmin) {
      const limitCheck = await checkAnalysisLimit(user.id);

      if (!limitCheck.allowed) {
        // Show upgrade modal instead of creating job
        setShowUpgradeModal(limitCheck);
        return;
      }
    }

    // Save job
    Storage.saveJob(newJob);

    // Update state without changing view (Silent Background Processing)
    setState(prev => ({
      ...prev,
      jobs: [newJob, ...prev.jobs],
      activeJobId: newJob.id
    }));

    // Inform the user
    showInfo(`Analyzing ${newJob.position || 'job'} in the background...`);

    // Increment usage count after successful creation (only for non-admins)
    if (user && !isAdmin) {
      await incrementAnalysisCount(user.id);
      // Refresh usage stats
      const updatedStats = await getUsageStats(user.id);
      setUsageStats(updatedStats);
    }
  };

  const handleUpdateJob = (updatedJob: SavedJob) => {
    Storage.updateJob(updatedJob);
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
    }));
  };

  const handleTargetJobCreated = (newTarget: TargetJob) => {
    setState(prev => ({
      ...prev,
      targetJobs: [newTarget, ...prev.targetJobs],
      currentView: 'coach-gap-analysis'
    }));
  };

  const handleDeleteJob = (id: string) => {
    Storage.deleteJob(id);
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== id),
      activeJobId: null,
      currentView: 'history'
    }));
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
      // Strip prefix (e.g. "data:application/pdf;base64,")
      const base64Data = base64Str.split(',')[1];

      const blocks = await parseResumeFile(base64Data, file.type);

      const newProfile: ResumeProfile = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, "") || "Uploaded Resume",
        blocks: blocks
      };

      const profiles = await Storage.addResume(newProfile);
      setState(prev => ({ ...prev, resumes: profiles }));
      setImportTrigger(t => t + 1); // trigger reload in editor
    } catch (err) {
      console.error(err);
      setImportError((err as Error).message);
    } finally {
      setIsParsingResume(false);
    }
  };



  const handleWelcomeContinue = () => {
    localStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, 'true');
    setShowWelcome(false);
  };


  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Reset local state if necessary, though UserContext should handle most of it
      showSuccess("Successfully signed out.");
    } catch (err) {
      console.error("Sign out error:", err);
      showError("Failed to sign out.");
    }
  };

  const handleNudgeResponse = (status: 'interview' | 'rejected' | 'ghosted') => {
    if (!nudgeJob) return;
    // Map status from NudgeCard to SavedJob.status
    handleUpdateJob({ ...nudgeJob, status: status as any });
    setNudgeJob(null);
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

  const handleDraftApplication = async (url: string) => {
    // 1. Switch View immediately to show progress (or we can show a loader overlay?)
    // Ideally, show Home with a Skeleton Job or similar? 
    // User asked to "go to the job post page". So let's create the job first.

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
      activeJobId: jobId
    }));

    showInfo("Drafting your tailored application in the background...");

    // 2. Perform Analysis in Background (updating the job)
    try {
      const text = await ScraperService.scrapeJobContent(url);
      // Update 1: We have text
      const jobWithText = { ...newJob, description: text };
      await Storage.saveJob(jobWithText); // Use saveJob alias

      // Update 2: Analysis complete
      const analysis = await analyzeJobFit(text, state.resumes, state.skills);
      const completedJob = {
        ...jobWithText,
        status: 'saved' as const,
        analysis: analysis,
        position: analysis.distilledJob?.roleTitle || 'Untitled'
      };

      await Storage.saveJob(completedJob);
      handleUpdateJob(completedJob); // Update global state
    } catch (err) {
      console.error("Draft Application Failed", err);
      const failedJob = { ...newJob, status: 'error' as const };
      await Storage.saveJob(failedJob);
      handleUpdateJob(failedJob);
      // Error will be shown via toast in HomeInput component
    }
  };

  const setView = (view: AppState['currentView']) => {
    setCurrentView(view);  // Persist to localStorage
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setActiveJobId = (id: string | null) => {
    setState(prev => ({ ...prev, activeJobId: id }));
  };

  const activeJob = state.jobs.find(j => j.id === state.activeJobId);

  // Helper: Is "Coach" mode active?
  const isCoachMode = state.currentView.startsWith('coach');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
      {/* Global reduced motion support */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
      <ToastContainer />

      {/* Modals */}
      <WelcomeScreen
        isOpen={showWelcome}
        onContinue={handleWelcomeContinue}
        onImportResume={handleImportResume}
        isParsing={isParsingResume}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        userTier={userTier}
        isTester={isTester}
        isAdmin={isAdmin}
        simulatedTier={simulatedTier}
        onSimulateTier={setSimulatedTier}
      />


      {/* Header always visible now, behind onboarding overlay */}
      <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-40 h-16 transition-all duration-200 ${isCoachMode
        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
        }`}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between relative">

          {/* LEFT: STATIC BRAND LOGO */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setActiveJobId(null); setView('home'); }}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 hidden sm:block">
                Navigator
              </span>
            </div>
          </div>


          {/* CENTER: EXPANDING ACCORDION NAVIGATION */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-500 ease-in-out">

            {/* Navigator | Job */}
            <div className={`flex items-center rounded-xl transition-all duration-500 ${!isCoachMode && currentView !== 'grad' ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50 pr-2' : ''}`}>
              <button
                onClick={() => { setActiveJobId(null); setView('job-fit'); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'job-fit' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400'}`}
              >
                <Briefcase className={`w-4 h-4 ${currentView === 'job-fit' ? 'scale-110' : 'scale-100'}`} />
                <span>Job</span>
              </button>

              <div className={`flex items-center gap-1 overflow-hidden transition-all duration-200 ease-out ${!isCoachMode && currentView !== 'grad' ? 'max-w-xs opacity-100 ml-1' : 'max-w-0 opacity-0'}`}>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
                <button
                  onClick={() => { setActiveJobId(null); setView('history'); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${state.currentView === 'history' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  History
                </button>
                <button
                  onClick={() => { setActiveJobId(null); setView('resumes'); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${state.currentView === 'resumes' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Resumes
                </button>
                <button
                  onClick={() => { setActiveJobId(null); setView('skills'); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${state.currentView === 'skills' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Skills
                </button>
                {(userTier === 'pro' || isTester || isAdmin) && (
                  <button
                    onClick={() => { setActiveJobId(null); setView('pro'); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${state.currentView === 'pro' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    Feed
                  </button>
                )}
              </div>
            </div>

            {/* Navigator | Coach (Beta/Admin only) */}
            {(isTester || isAdmin) && (
              <div className={`flex items-center rounded-xl transition-all duration-500 ml-1 ${isCoachMode ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50 pr-2' : ''}`}>
                <button
                  onClick={() => { setActiveJobId(null); setView('coach-home'); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isCoachMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'}`}
                >
                  <TrendingUp className={`w-4 h-4 ${isCoachMode ? 'scale-110' : 'scale-100'}`} />
                  <span>Coach</span>
                </button>

                <div className={`flex items-center gap-1 overflow-hidden transition-all duration-200 ease-out ${isCoachMode ? 'max-w-md opacity-100 ml-1' : 'max-w-0 opacity-0'}`}>
                  <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-800 mx-1" />
                  <button
                    onClick={() => { setActiveJobId(null); setView('coach-role-models'); }}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${state.currentView === 'coach-role-models' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-emerald-500'}`}
                  >
                    Role Models
                  </button>
                  <button
                    onClick={() => { setActiveJobId(null); setView('coach-gap-analysis'); }}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${state.currentView === 'coach-gap-analysis' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-emerald-500'}`}
                  >
                    Skills Gap
                  </button>
                </div>
              </div>
            )}

            {/* Navigator | Edu */}
            {isAdmin && (
              <div className={`flex items-center rounded-xl transition-all duration-500 ml-1 ${currentView === 'grad' ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50 pr-2' : ''}`}>
                <button
                  onClick={() => { setActiveJobId(null); setView('grad'); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'grad' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-violet-600 dark:text-slate-400'}`}
                >
                  <GraduationCap className={`w-4 h-4 ${currentView === 'grad' ? 'scale-110' : 'scale-100'}`} />
                  <span>Edu</span>
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center">
            <div className="flex items-center gap-2">
              {!user ? (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all mr-2 active:scale-95"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-semibold rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all mr-2 group"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Log Out</span>
                </button>
              )}
              {/* User Profile / Settings (Unchanged) */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pb-24 sm:pb-8">

        {/* Full Width Views & PageLayout Views */}
        <ViewTransition viewKey={state.currentView} className="w-full">
          {(state.currentView === 'home' || state.currentView === 'job-fit') && (
            <>
              {nudgeJob && (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24">
                  <NudgeCard
                    job={nudgeJob}
                    onUpdateStatus={handleNudgeResponse}
                    onDismiss={() => setNudgeJob(null)}
                  />
                </div>
              )}

              {/* HomeInput handles its own padding/layout */}
              <div className="pt-24">
                <HomeInput
                  resumes={state.resumes}
                  onJobCreated={handleJobCreated}
                  onTargetJobCreated={handleTargetJobCreated}
                  onImportResume={handleImportResume}
                  isParsing={isParsingResume}
                  importError={state.importError ?? null}
                  isAdmin={isAdmin}
                  isTester={isTester}
                  user={user}
                  usageStats={usageStats}
                  mode={state.currentView === 'job-fit' ? 'apply' : 'all'}
                  onNavigate={setView}
                />
              </div>
            </>
          )}

          {state.currentView === 'pro' && (
            <Suspense fallback={<LoadingState message="Loading Pro Feed..." />}>
              <div className="pt-20">
                <JobFitPro
                  onDraftApplication={handleDraftApplication}
                />
              </div>
            </Suspense>
          )}

          {state.currentView === 'resumes' && (
            <Suspense fallback={<LoadingState message="Opening Editor..." />}>
              <div className="pt-20">
                <ResumeEditor
                  resumes={state.resumes}
                  skills={state.skills}
                  onSave={(updated) => setState(prev => ({ ...prev, resumes: updated }))}
                  onImport={handleImportResume}
                  isParsing={isParsingResume}
                  importError={importError}
                  importTrigger={importTrigger}
                />
              </div>
            </Suspense>
          )}

          {state.currentView === 'skills' && (
            <div className="pt-20">
              <SkillsView
                skills={state.skills}
                resumes={state.resumes}
                onSkillsUpdated={(skills) => setState(prev => ({ ...prev, skills }))}
                onStartInterview={(name) => setInterviewSkill(name)}
                userTier={userTier}
              />
            </div>
          )}

          {/* JobCoach Views (Statically imported for pixel-perfect layout sync) */}
          {isCoachMode && (
            <div className="pt-24">
              <CoachDashboard
                userSkills={state.skills}
                roleModels={state.roleModels}
                targetJobs={state.targetJobs}
                activeAnalysisIds={activeAnalysisIds}
                view={state.currentView as any}
                onAddRoleModel={async (file: File) => {
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
                }}
                onAddTargetJob={handleTargetJobCreated}
                onDeleteRoleModel={async (id) => {
                  const updated = await Storage.deleteRoleModel(id);
                  setState(prev => ({ ...prev, roleModels: updated }));
                }}
                onRunGapAnalysis={async (targetJobId) => {
                  const targetJob = state.targetJobs.find(tj => tj.id === targetJobId);
                  if (!targetJob) return;

                  // Background Process
                  setActiveAnalysisIds(prev => new Set(prev).add(targetJobId));
                  showInfo("AI Coach is analyzing your skill gap in the background...");

                  // Don't await here
                  analyzeGap(state.roleModels, state.resumes, state.skills)
                    .then(async (analysis) => {
                      const updatedTargetJob = { ...targetJob, gapAnalysis: analysis };
                      const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                      setState(prev => ({ ...prev, targetJobs: updatedList }));
                      showSuccess(`Gap Analysis complete for ${targetJob.title || 'Role'}!`);
                    })
                    .catch((err) => {
                      console.error("Gap Analysis failed:", err);
                      showError("AI Coach hit a snag during Gap Analysis.");
                    })
                    .finally(() => {
                      setActiveAnalysisIds(prev => {
                        const next = new Set(prev);
                        next.delete(targetJobId);
                        return next;
                      });
                    });
                }}
                onGenerateRoadmap={async (targetJobId) => {
                  const targetJob = state.targetJobs.find(tj => tj.id === targetJobId);
                  if (!targetJob || !targetJob.gapAnalysis) return;

                  // Background Process
                  setActiveAnalysisIds(prev => new Set(prev).add(`${targetJobId}-roadmap`));
                  showInfo("AI Coach is building your 12-month roadmap...");

                  // Don't await here
                  generateRoadmap(targetJob.gapAnalysis)
                    .then(async (roadmap) => {
                      const updatedTargetJob = { ...targetJob, roadmap };
                      const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                      setState(prev => ({ ...prev, targetJobs: updatedList }));
                      showSuccess(`Your Career Roadmap for ${targetJob.title || 'Role'} is ready!`);
                    })
                    .catch((err) => {
                      console.error("Roadmap generation failed:", err);
                      showError("AI Coach couldn't build that roadmap right now.");
                    })
                    .finally(() => {
                      setActiveAnalysisIds(prev => {
                        const next = new Set(prev);
                        next.delete(`${targetJobId}-roadmap`);
                        return next;
                      });
                    });
                }}
                onToggleMilestone={async (targetJobId, milestoneId) => {
                  const targetJob = state.targetJobs.find(tj => tj.id === targetJobId);
                  if (!targetJob || !targetJob.roadmap) return;

                  const updatedRoadmap = targetJob.roadmap.map(m =>
                    m.id === milestoneId ? { ...m, status: (m.status === 'completed' ? 'pending' : 'completed') as any } : m
                  );
                  const updatedTargetJob = { ...targetJob, roadmap: updatedRoadmap };
                  const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                  setState(prev => ({ ...prev, targetJobs: updatedList }));
                }}
              />
            </div>
          )}
        </ViewTransition>

        {/* Constrained Views (Legacy/Specific) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24">
          {state.currentView === 'history' && (
            <History
              jobs={state.jobs}
              onSelectJob={(id) => { setActiveJobId(id); setView('job-detail'); }}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {state.currentView === 'job-detail' && activeJob && (
            <JobDetail
              job={activeJob}
              resumes={state.resumes}
              userSkills={state.skills}
              targetJobs={state.targetJobs}
              onBack={() => { setActiveJobId(null); setView('history'); }}
              onUpdateJob={handleUpdateJob}
              userTier={isAdmin ? 'admin' : isTester ? 'tester' : userTier}
              onAddSkill={async (skillName) => {
                const newSkill = await Storage.saveSkill({
                  name: skillName,
                  proficiency: 'learning'
                });
                setState(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
              }}
            />
          )}
          {state.currentView === 'admin' && (
            <Suspense fallback={<LoadingState message="Syncing Admin Dashboard..." />}>
              <AdminDashboard />
            </Suspense>
          )}

          {state.currentView === 'grad' && isAdmin && (
            <Suspense fallback={<LoadingState message="Loading Edu Dashboard..." />}>
              <div className="pt-24 pb-12 px-4 sm:px-6">
                <GradFitPlaceholder
                  onAddSkills={async (newSkills: any[]) => { // Explicitly typed to avoid 'any' error or update interface
                    const skillsToAdd = newSkills.map(s => ({
                      id: crypto.randomUUID(),
                      user_id: 'local',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      name: s.name,
                      category: s.category,
                      proficiency: s.proficiency,
                      evidence: s.evidence
                    })); // Add required fields

                    // Persist (Pseudo)
                    for (const s of skillsToAdd) {
                      await Storage.saveSkill(s);
                    }

                    setState(prev => ({
                      ...prev,
                      skills: [...prev.skills, ...skillsToAdd]
                    }));
                  }}
                />
              </div>
            </Suspense>
          )}

          {/* Interview Modal (Global) - Rendered here to ensure it's within context if needed, but could be global */}
          {interviewSkill && (
            <SkillInterviewModal
              skillName={interviewSkill}
              onClose={() => setInterviewSkill(null)}
              onComplete={handleInterviewComplete}
              showValidation={isAdmin || isTester}
            />
          )}

          {/* Upgrade Modal */}
          {showUpgradeModal && (
            <UpgradeModal
              limitInfo={showUpgradeModal}
              onClose={() => setShowUpgradeModal(null)}
            />
          )}
        </div>
        <Analytics />
      </main >
    </div >
  );
};

export default App;
