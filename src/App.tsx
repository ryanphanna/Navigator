import React, { useState, useEffect } from 'react';
import type { AppState, SavedJob, ResumeProfile } from './types';
import { Analytics } from '@vercel/analytics/react';

import { Storage } from './services/storageService';
import { parseResumeFile, analyzeJobFit } from './services/geminiService';
import { ScraperService } from './services/scraperService';
import ResumeEditor from './components/ResumeEditor';
import HomeInput from './components/HomeInput';
import History from './components/History';
import JobDetail from './components/JobDetail';
import { JobFitPro } from './components/JobFitPro';
import { Briefcase, Settings, History as HistoryIcon, Zap } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { UsageModal } from './components/UsageModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { supabase } from './services/supabase';
import { AuthModal } from './components/AuthModal';
import { type User } from '@supabase/supabase-js';
import { PrivacyNotice } from './components/PrivacyNotice';
import { ApiKeySetup } from './components/ApiKeySetup';
import { NudgeCard } from './components/NudgeCard';

// Main App Component
const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    resumes: [],
    jobs: [],
    currentView: 'home',
    activeJobId: null,
    apiStatus: 'checking',
  });

  // Resume Import State
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importTrigger, setImportTrigger] = useState(0);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'admin'>('free'); // Billing Tier
  const [isTester, setIsTester] = useState(false); // Beta Tester Flag
  const [isAdmin, setIsAdmin] = useState(false); // Admin Flag
  const [showAuth, setShowAuth] = useState(false);

  // Nudge State
  const [nudgeJob, setNudgeJob] = useState<SavedJob | null>(null);

  // Settings & Usage State
  const [showSettings, setShowSettings] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [quotaStatus] = useState<'normal' | 'high_traffic' | 'daily_limit'>('normal');
  const [cooldownSeconds] = useState(0);

  // Onboarding flow states
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('jobfit_welcome_seen');
  });

  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const storedResumes = await Storage.getResumes();
      const storedJobs = await Storage.getJobs();
      setState(prev => ({
        ...prev,
        resumes: storedResumes,
        jobs: storedJobs,
        currentView: 'home',
        activeJobId: null,
        apiStatus: 'ok',
      }));
    };
    loadData();
  }, []);

  // Initialize Theme & Auth
  useEffect(() => {
    // Theme
    const theme = localStorage.getItem('jobfit_theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Helper to process user profile
    const processUser = async (user: User | null) => {
      setUser(user);
      if (user) {
        // 1. Get Billing Tier from DB
        const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
        if (data) setUserTier(data.subscription_tier as 'free' | 'pro' | 'admin');

        // 2. Beta Override: All invite-code users are marked as Testers
        // In future, this could come from a DB column 'is_tester'
        setIsTester(true);

        // 3. Admin Check (Hardcoded for beta owner)
        if (user.email === 'rhanna@live.com') {
          setIsAdmin(true);
          setUserTier('admin'); // Sync tier for convenience
        }
      } else {
        setUserTier('free');
        setIsTester(false);
        setIsAdmin(false);
      }
    };

    // Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      processUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      processUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Nudge Logic
  useEffect(() => {
    if (sessionStorage.getItem('nudgeSeen')) return;

    const findNudge = () => {
      const now = Date.now();
      const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;
      const candidates = state.jobs.filter(job => {
        const isOldEnough = (now - new Date(job.dateAdded).getTime()) > THREE_WEEKS;
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

    const timer = setTimeout(findNudge, 1500);
    return () => clearTimeout(timer);
  }, [state.jobs]);


  // --- Handlers ---

  const handleJobCreated = (newJob: SavedJob) => {
    Storage.saveJob(newJob);
    setState(prev => ({
      ...prev,
      jobs: [newJob, ...prev.jobs],
      currentView: 'job-detail',
      activeJobId: newJob.id
    }));
  };

  const handleUpdateJob = (updatedJob: SavedJob) => {
    Storage.updateJob(updatedJob);
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
    }));
  };

  const handleDeleteJob = (id: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      Storage.deleteJob(id);
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.filter(j => j.id !== id),
        activeJobId: null,
        currentView: 'history'
      }));
    }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  const handleWelcomeContinue = () => {
    localStorage.setItem('jobfit_welcome_seen', 'true');
    setShowWelcome(false);
    // Next: Show Privacy if not seen
    if (!localStorage.getItem('jobfit_privacy_accepted')) {
      setShowPrivacyNotice(true);
    }
  };

  const handlePrivacyAccept = () => {
    localStorage.setItem('jobfit_privacy_accepted', 'true');
    setShowPrivacyNotice(false);

    // Check if API key exists, if not show setup screen
    // BUT: If user is logged in (Pro/Beta), they don't need a key (Managed Service)
    const hasApiKey = localStorage.getItem('gemini_api_key');
    // Logic: If NO key AND NOT a managed user (Pro/Tester/Admin) -> Show Setup
    const isManaged = userTier === 'pro' || isTester || isAdmin;
    if (!hasApiKey && !user && !isManaged) {
      setShowApiKeySetup(true);
    }
  };

  const handleNudgeResponse = async (status: 'interview' | 'rejected' | 'ghosted') => {
    if (!nudgeJob) return;
    await handleUpdateJob({ ...nudgeJob, status });
    setNudgeJob(null);
    setNudgeJob(null);
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
      resumeId: state.resumes[0]?.id || 'master',
      dateAdded: Date.now(),
      status: 'analyzing',
    };

    await Storage.addJob(newJob);
    setState(prev => ({
      ...prev,
      jobs: [newJob, ...prev.jobs],
      activeJobId: jobId,
      currentView: 'job-detail'
    }));

    // 2. Perform Analysis in Background (updating the job)
    try {
      const text = await ScraperService.scrapeJobContent(url);
      // Update 1: We have text
      const jobWithText = { ...newJob, description: text };
      await Storage.saveJob(jobWithText); // Use saveJob alias

      // Update state to show text?

      const analysis = await analyzeJobFit(text, state.resumes);
      const completedJob = {
        ...jobWithText,
        status: 'saved' as const,
        analysis: analysis,
        company: analysis.distilledJob?.companyName || 'Unknown',
        position: analysis.distilledJob?.roleTitle || 'Untitled'
      };

      await Storage.saveJob(completedJob);
      handleUpdateJob(completedJob); // Update global state
    } catch (err) {
      console.error("Draft Application Failed", err);
      const failedJob = { ...newJob, status: 'error' as const };
      await Storage.saveJob(failedJob);
      handleUpdateJob(failedJob);
      alert("Failed to analyze job. Please try again.");
    }
  };

  const setView = (view: AppState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setActiveJobId = (id: string | null) => {
    setState(prev => ({ ...prev, activeJobId: id }));
  };

  const activeJob = state.jobs.find(j => j.id === state.activeJobId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">

      {/* Modals */}
      <WelcomeScreen isOpen={showWelcome} onContinue={handleWelcomeContinue} />
      <ApiKeySetup isOpen={showApiKeySetup} onComplete={() => setShowApiKeySetup(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PrivacyNotice isOpen={showPrivacyNotice} onAccept={handlePrivacyAccept} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        userTier={userTier}
        isTester={isTester}
        isAdmin={isAdmin}
      />
      <UsageModal
        isOpen={showUsage}
        onClose={() => setShowUsage(false)}
        apiStatus={state.apiStatus}
        quotaStatus={quotaStatus}
        cooldownSeconds={cooldownSeconds}
      />


      {/* Only show header after onboarding is complete */}
      {!showWelcome && !showPrivacyNotice && !showApiKeySetup && (
        <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 h-16 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between relative">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveJobId(null); setView('home'); }}>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                JobFit
              </h1>
            </div>

            <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              {user && (
                <>
                  {/* Feed is for Pro OR Testers OR Admins */}
                  {(userTier === 'pro' || isTester || isAdmin) && (
                    <button
                      onClick={() => { setActiveJobId(null); setView('pro'); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${state.currentView === 'pro'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">Feed</span>
                    </button>
                  )}

                  <button
                    onClick={() => { setActiveJobId(null); setView('resumes'); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${state.currentView === 'resumes'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="hidden sm:inline">Resumes</span>
                  </button>
                </>
              )}
              {state.jobs.length > 0 && (
                <button
                  onClick={() => { setActiveJobId(null); setView('history'); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${state.currentView === 'history'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <HistoryIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
              )}
            </nav>

            <div className="flex items-center">
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{user.email}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' :
                        isTester ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        }`}>
                        {isAdmin ? 'Admin' : isTester ? 'Beta' : 'Pro'}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                )}
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
      )}

      <main className="w-full pb-24 sm:pb-8">

        {/* Full Width Views */}
        {state.currentView === 'home' && (
          <div className="w-full">
            {nudgeJob && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24">
                <NudgeCard
                  job={nudgeJob}
                  onUpdateStatus={handleNudgeResponse}
                  onDismiss={() => setNudgeJob(null)}
                />
              </div>
            )}

            {/* HomeInput handles its own padding/layout */}
            <div className="pt-8 sm:pt-24">
              <HomeInput
                resumes={state.resumes}
                onJobCreated={handleJobCreated}
                onJobUpdated={handleUpdateJob}
                onImportResume={handleImportResume}
                isParsing={isParsingResume}
                importError={state.importError ?? null}
                user={user}
              />
            </div>
          </div>
        )}

        {/* Constrained Views */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24">
          {state.currentView === 'pro' && (
            <JobFitPro
              onDraftApplication={handleDraftApplication}
            />
          )}

          {state.currentView === 'history' && (
            <History
              jobs={state.jobs}
              onSelectJob={(id) => { setActiveJobId(id); setView('job-detail'); }}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {state.currentView === 'resumes' && (
            <ResumeEditor
              resumes={state.resumes}
              onSave={(updated) => setState(prev => ({ ...prev, resumes: updated }))}
              onImport={handleImportResume}
              isParsing={isParsingResume}
              importError={importError}
              importTrigger={importTrigger}
            />
          )}

          {state.currentView === 'job-detail' && activeJob && (
            <JobDetail
              job={activeJob}
              resumes={state.resumes}
              onBack={() => { setActiveJobId(null); setView('history'); }}
              onUpdateJob={handleUpdateJob}
              userTier={isAdmin ? 'admin' : isTester ? 'tester' : userTier}
            />
          )}
        </div>
      </main>
      <Analytics />
    </div >
  );
};

export default App;
