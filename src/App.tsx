import React, { useState, useEffect } from 'react';
import type { AppState, SavedJob, ResumeProfile } from './types';
import * as Storage from './services/storageService';
import { parseResumeFile } from './services/geminiService';
import ResumeEditor from './components/ResumeEditor';
import HomeInput from './components/HomeInput';
import History from './components/History';
import JobDetail from './components/JobDetail';
import { Briefcase, Settings, LayoutGrid, History as HistoryIcon, Activity, AlertTriangle } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { UsageModal } from './components/UsageModal';
import { PrivacyNotice } from './components/PrivacyNotice';

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

  // Settings & Usage State
  const [showSettings, setShowSettings] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<'normal' | 'high_traffic' | 'daily_limit'>('normal');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Privacy Notice State
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(() => {
    return !localStorage.getItem('jobfit_privacy_accepted');
  });

  useEffect(() => {
    const storedResumes = Storage.getResumes();
    const storedJobs = Storage.getJobs();
    setState({
      resumes: storedResumes,
      jobs: storedJobs,
      currentView: 'home',
      activeJobId: null,
      apiStatus: 'ok',
    });
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
    return () => clearInterval(interval);
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

  const handleDeleteJob = (id: string) => {
    Storage.deleteJob(id);
    setState((prev: AppState) => ({
      ...prev,
      jobs: prev.jobs.filter((j: SavedJob) => j.id !== id)
    }));
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
              const master = prev.resumes[0] || { id: 'master', name: 'Master Experience', blocks: [] };
              // Append new blocks
              const updatedMaster = {
                ...master,
                blocks: [...master.blocks, ...newBlocks]
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

  const handlePrivacyAccept = () => {
    localStorage.setItem('jobfit_privacy_accepted', 'true');
    setShowPrivacyNotice(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">

      <PrivacyNotice isOpen={showPrivacyNotice} onAccept={handlePrivacyAccept} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <UsageModal
        isOpen={showUsage}
        onClose={() => setShowUsage(false)}
        apiStatus={state.apiStatus}
        quotaStatus={quotaStatus}
        cooldownSeconds={cooldownSeconds}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveJobId(null); setView('home'); }}>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              JobFit AI
            </h1>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => { setActiveJobId(null); setView('home'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${state.currentView === 'home'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => { setActiveJobId(null); setView('resumes'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${state.currentView === 'resumes'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <Briefcase className="w-4 h-4" />
              Resumes
            </button>
            {state.jobs.length > 0 && (
              <button
                onClick={() => { setActiveJobId(null); setView('history'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${state.currentView === 'history'
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                <HistoryIcon className="w-4 h-4" />
                History
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-2">
            <button
              onClick={() => setShowUsage(true)}
              className={`p-2 rounded-full transition-all relative group flex items-center gap-2 
                  ${quotaStatus === 'daily_limit' ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' :
                  quotaStatus === 'high_traffic' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' :
                    'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
              title="System Status"
            >
              {quotaStatus === 'normal' ? (
                <>
                  <Activity className={`w-5 h-5 ${state.apiStatus === 'ok' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-2 ring-white"></span>
                </>
              ) : <>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold whitespace-nowrap pr-1">
                  {quotaStatus === 'daily_limit' ? 'Daily Limit Reached' : 'Limit Reached'}
                </span>
              </>
              }
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:pt-24 pb-24 sm:pb-8">
        {state.currentView === 'home' && (
          <HomeInput
            resumes={state.resumes}
            onJobCreated={handleJobCreated}
            onJobUpdated={handleUpdateJob}
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
          />
        )}
      </main>
    </div >
  );
};

export default App;
