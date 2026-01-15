import React, { useState, useEffect } from 'react';
import type { AppState, SavedJob, ResumeProfile } from './types';

import { Storage } from './services/storageService';
import { parseResumeFile } from './services/geminiService';
import ResumeEditor from './components/ResumeEditor';
import HomeInput from './components/HomeInput';
import History from './components/History';
import JobDetail from './components/JobDetail';
import { JobFitPro } from './components/JobFitPro';
import { Briefcase, Settings, History as HistoryIcon } from 'lucide-react';
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
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'admin'>('free');
  const [showAuth, setShowAuth] = useState(false);

  // Nudge State
  const [nudgeJob, setNudgeJob] = useState<SavedJob | null>(null);

  // Nudge Logic: Find one "High Value" job to ask about
  useEffect(() => {
    // Only check if we haven't already nudged this session (simple check)
    if (sessionStorage.getItem('nudgeSeen')) return;

    const findNudge = () => {
      const now = Date.now();
      const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;

      // Find candidates: High score, Old enough, No outcome yet
      const candidates = state.jobs.filter(job => {
        const isOldEnough = (now - new Date(job.dateAdded).getTime()) > THREE_WEEKS;
        const isHighQuality = (job.fitScore || 0) >= 80;
        const isPending = !job.status || ['saved', 'applied', 'analyzing'].includes(job.status);

        return isOldEnough && isHighQuality && isPending;
      });

      if (candidates.length > 0) {
        // Pick random to keep it fresh
        const randomJob = candidates[Math.floor(Math.random() * candidates.length)];
        setNudgeJob(randomJob);
        sessionStorage.setItem('nudgeSeen', 'true');
      }
    };

    // Small delay so it doesn't pop instantly on load
    const timer = setTimeout(findNudge, 1500);
    return () => clearTimeout(timer);
  }, [state.jobs]);

  const handleNudgeResponse = async (status: 'interview' | 'rejected' | 'ghosted') => {
    if (!nudgeJob) return;

    await handleUpdateJob({ ...nudgeJob, status });
    setNudgeJob(null); // Dismiss
  };

  // Settings & Usage State
  const [showSettings, setShowSettings] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<'normal' | 'high_traffic' | 'daily_limit'>('normal');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Onboarding flow states
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('jobfit_welcome_seen');
  });

  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);

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

    // Auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', session.user.id).single();
        if (data) setUserTier(data.subscription_tier as 'free' | 'pro' | 'admin');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', session.user.id).single();
        if (data) setUserTier(data.subscription_tier as 'free' | 'pro' | 'admin');
      } else {
        setUserTier('free');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Monitor Quota Status & Cooldown
  useEffect(() => {
    const checkStatus = () => {
      const statusStr = localStorage.getItem('jobfit_quota_status');
      if (!statusStr) {
        setQuotaStatus('normal');
        setCooldownSeconds(0);
        return;
      }

      try {
        const data = JSON.parse(statusStr);
        const now = Date.now();
        const age = now - data.timestamp;

        if (data.type === 'daily') {
          // Reset daily limit visually after 24 hours
          if (age < 24 * 60 * 60 * 1000) {
            setQuotaStatus('daily_limit');
          } else {
            localStorage.removeItem('jobfit_quota_status');
            setQuotaStatus('normal');
          }
          setCooldownSeconds(0);
        } else if (data.type === 'rate_limit') {
          // Calculate remaining cooldown if explicitly set, otherwise default 60s
          const cooldownUntil = data.cooldownUntil || (data.timestamp + 60000);
          const remaining = Math.ceil((cooldownUntil - now) / 1000);

          if (remaining > 0) {
            setQuotaStatus('high_traffic');
            setCooldownSeconds(remaining);
          } else {
            localStorage.removeItem('jobfit_quota_status');
            setQuotaStatus('normal');
          }
        }
      } catch {
        setQuotaStatus('normal');
      }
    };

    // Check immediately
    checkStatus();

    // Poll every second for countdown and status updates
    const interval = setInterval(checkStatus, 1000);

    // Listen for custom event when API key is changed
    const handleQuotaCleared = () => {
      checkStatus(); // Immediately re-check when notified
    };
    window.addEventListener('quotaStatusCleared', handleQuotaCleared);

    const handleApiKeySaved = () => {
      setShowApiKeySetup(false); // Close setup modal when key is saved
    };
    window.addEventListener('apiKeySaved', handleApiKeySaved);

    return () => {
      clearInterval(interval);
      window.removeEventListener('quotaStatusCleared', handleQuotaCleared);
      window.removeEventListener('apiKeySaved', handleApiKeySaved);
    };
  }, []);

  const handleSaveResumes = (updatedResumes: ResumeProfile[]) => {
    Storage.saveResumes(updatedResumes);
    setState((prev: AppState) => ({ ...prev, resumes: updatedResumes }));
  };

  const handleJobCreated = (job: SavedJob) => {
    setState((prev: AppState) => ({
      ...prev,
      jobs: [job, ...prev.jobs],
    }));
  };

  const handleDeleteJob = async (jobId: string) => {
    const updatedJobs = await Storage.deleteJob(jobId);
    setState(prev => ({ ...prev, jobs: updatedJobs }));

    if (state.activeJobId === jobId) {
      setActiveJobId(null);
      setView('history');
    }
  };

  const handleUpdateJob = (updatedJob: SavedJob) => {
    Storage.updateJob(updatedJob);
    setState((prev: AppState) => ({
      ...prev,
      jobs: prev.jobs.map((j: SavedJob) => j.id === updatedJob.id ? updatedJob : j)
    }));
  };

  const handleImportResume = async (file: File) => {
    setIsParsingResume(true);
    setImportError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Handle cases where result might be null
        if (!base64String) {
          setImportError("Failed to read file.");
          setIsParsingResume(false);
          return;
        }
        const base64Data = base64String.split(',')[1];

        try {
          const newBlocks = await parseResumeFile(base64Data, file.type);
          if (newBlocks && newBlocks.length > 0) {
            setState(prev => {
              // Get current master or create default
              const master = prev.resumes[0] || { id: 'master', name: 'My Resume', blocks: [] };

              // Check for duplicates before appending
              // We compare based on content (title, organization) to avoid adding the exact same block twice
              // This handles cases where the API might hallucinate duplicates or the event handler fires twice
              const existingSignatures = new Set(master.blocks.map(b => `${b.title}|${b.organization}|${b.dateRange}`));
              const uniqueNewBlocks = newBlocks.filter(b => {
                const signature = `${b.title}|${b.organization}|${b.dateRange}`;
                if (existingSignatures.has(signature)) return false;
                existingSignatures.add(signature);
                return true;
              }).map(b => ({
                ...b,
                id: crypto.randomUUID() // FORCE NEW ID for every added block to prevent ID collisions
              }));

              if (uniqueNewBlocks.length === 0) {
                return prev; // No new unique blocks to add
              }

              // Append new unique blocks
              const updatedMaster = {
                ...master,
                blocks: [...master.blocks, ...uniqueNewBlocks]
              };

              const updatedResumes = master.id === 'master' && prev.resumes.length === 0
                ? [updatedMaster] // If no master existed, add it
                : prev.resumes.map(r => r.id === 'master' ? updatedMaster : r); // Update existing master

              handleSaveResumes(updatedResumes);
              setImportTrigger(prev => prev + 1); // Trigger re-render in ResumeEditor
              return { ...prev, resumes: updatedResumes };
            });
          } else {
            setImportError("No content parsed from resume.");
          }
        } catch (parseErr: unknown) {
          const err = parseErr as Error;

          let friendlyError = `Failed to parse resume: ${err.message || 'Unknown error'}`;
          const errMsg = err.message || '';

          if (errMsg.includes("DAILY_QUOTA_EXCEEDED")) {
            friendlyError = "Daily Quota Exceeded. You have reached your free tier limit for today.";
            localStorage.setItem('jobfit_quota_status', JSON.stringify({ type: 'daily', timestamp: Date.now() }));
          } else if (errMsg.includes("RATE_LIMIT_EXCEEDED") || errMsg.includes("429")) {
            // Try to extract wait time from error message "(Wait 28s)"
            const waitMatch = errMsg.match(/Wait ([0-9.]+)s/);
            const waitSecs = waitMatch ? parseFloat(waitMatch[1]) : 30; // default 30s
            const cooldownUntil = Date.now() + (waitSecs * 1000);

            friendlyError = `System is busy (High Traffic). Cooling down for ${waitSecs}s.`;
            localStorage.setItem('jobfit_quota_status', JSON.stringify({
              type: 'rate_limit',
              timestamp: Date.now(),
              cooldownUntil: cooldownUntil
            }));
          }

          setImportError(friendlyError);
        } finally {
          setIsParsingResume(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (fileReadErr: unknown) {
      const err = fileReadErr as Error;
      setImportError(`Failed to read file: ${err.message || 'Unknown error'}`);
      setIsParsingResume(false);
    }
  };

  // Helper to set view and active job ID
  const setView = (view: AppState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setActiveJobId = (id: string | null) => {
    setState(prev => ({ ...prev, activeJobId: id }));
  };

  const { activeJobId } = state;
  const activeJob = activeJobId ? state.jobs.find(j => j.id === activeJobId) : null;

  const handleWelcomeContinue = () => {
    localStorage.setItem('jobfit_welcome_seen', 'true');
    setShowWelcome(false);
    setShowPrivacyNotice(true);
  };

  const handlePrivacyAccept = () => {
    localStorage.setItem('jobfit_privacy_accepted', 'true');
    setShowPrivacyNotice(false);

    // Check if API key exists, if not show setup screen
    const hasApiKey = localStorage.getItem('gemini_api_key');
    if (!hasApiKey) {
      setShowApiKeySetup(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">

      <WelcomeScreen isOpen={showWelcome} onContinue={handleWelcomeContinue} />
      <PrivacyNotice isOpen={showPrivacyNotice} onAccept={handlePrivacyAccept} />
      <ApiKeySetup isOpen={showApiKeySetup} onComplete={() => setShowApiKeySetup(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
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
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveJobId(null); setView('home'); }}>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                JobFit
              </h1>
            </div>

            <nav className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              {user && (
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
                    <div className="text-xs text-right hidden md:block">
                      <div className="font-medium text-slate-900 dark:text-slate-200">{user.email}</div>
                      <div className="text-slate-500 dark:text-slate-500">Free Tier</div>
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
              />
            </div>
          </div>
        )}

        {/* Constrained Views */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24">
          {state.currentView === 'pro' && (
            <JobFitPro onBack={() => setView('home')} />
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
              userTier={userTier}
            />
          )}
        </div>
      </main>
    </div >
  );
};

export default App;
