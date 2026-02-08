import { Suspense, lazy, useRef, useState, useLayoutEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

import { useAppLogic } from './hooks/useAppLogic';
import { useUser } from './contexts/UserContext';
import { LoadingState } from './components/common/LoadingState';
import { Storage } from './services/storageService';
import { parseRoleModel, analyzeGap, generateRoadmap, analyzeRoleModelGap } from './services/geminiService';
import type { GapAnalysisResult } from './types/analysis';

// Main job-search components
import HomeInput from './modules/job/HomeInput';
import History from './modules/job/History';
import JobDetail from './modules/job/JobDetail';
import { CoachDashboard } from './modules/career/CoachDashboard';

// Lazy load heavy modules
const ResumeEditor = lazy(() => import('./modules/resume/ResumeEditor'));
const JobFitPro = lazy(() => import('./modules/job/JobFitPro').then(m => ({ default: m.JobFitPro })));
const AdminDashboard = lazy(() => import('./modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const GradFitPlaceholder = lazy(() => import('./modules/grad/GradFitPlaceholder').then(m => ({ default: m.GradFitPlaceholder })));

// Regular imports
import { SkillsView } from './components/skills/SkillsView';
import { SkillInterviewModal } from './components/skills/SkillInterviewModal';
import { SettingsModal } from './components/SettingsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ROUTES } from './constants';
import { SEOLandingPage } from './modules/seo/SEOLandingPage';
import { AuthModal } from './components/AuthModal';
import { NudgeCard } from './components/NudgeCard';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from './components/common/Toast';
import { Settings, Briefcase, TrendingUp, LogOut, GraduationCap, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  // Use the new hook to manage app logic
  const {
    state,
    setState,
    transcript,
    usage: { stats: usageStats, showUpgradeModal, setShowUpgradeModal },
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
      handleInterviewComplete
    },
    toast: { showInfo }
  } = useAppLogic();

  // Auth Context
  const { user, isLoading, userTier, isTester, isAdmin, simulatedTier, setSimulatedTier } = useUser();

  const activeJob = state.jobs.find(j => j.id === state.activeSubmissionId);
  const isCoachMode = typeof currentView === 'string' && currentView.startsWith('coach');
  const isEduMode = currentView === 'grad' || (typeof currentView === 'string' && currentView.startsWith('grad-'));

  // Dynamic Navigation Pill
  const jobNavRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [jobPillStyle, setJobPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useLayoutEffect(() => {
    const viewKey = currentView === 'home' ? 'job-fit' : (currentView as string);
    const activeEl = jobNavRefs.current.get(viewKey);

    if (activeEl && !isCoachMode && !isEduMode) {
      setJobPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1
      });
    } else {
      setJobPillStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [currentView, isCoachMode, isEduMode, userTier, isTester, isAdmin]);

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-emerald-500/30 text-slate-900 dark:text-slate-100 transition-colors duration-500 ${isCoachMode ? 'theme-coach' : isEduMode ? 'theme-edu' : 'theme-job'}`}>
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
      <Analytics />

      {/* Modals */}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

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

      {/* Skill Interview Modal */}
      {interviewSkill && (
        <Suspense fallback={null}>
          <SkillInterviewModal
            onClose={() => setInterviewSkill(null)}
            skillName={interviewSkill}
            onComplete={handleInterviewComplete}
          />
        </Suspense>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          limitInfo={showUpgradeModal}
          onClose={() => setShowUpgradeModal(null)}
        />
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-50 h-12 transition-all duration-500 ${isCoachMode
        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
        : isEduMode
          ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'
          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
        }`}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between relative">

          {/* LEFT: STATIC BRAND LOGO */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setActiveSubmissionId(null); setView('home'); }}>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 hidden sm:block">
                Navigator
              </span>
            </div>
          </div>

          {/* CENTER: EXPANDING ACCORDION NAVIGATION */}
          {user && !isLoading && (
            <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 transition-all duration-500 ease-in-out shadow-sm h-8">
              {/* Navigator | Job */}
              <div className={`relative flex items-center h-full rounded-full transition-all duration-500 ${!isCoachMode && currentView !== 'grad' ? 'pr-0.5' : ''}`}>
                {/* Dynamic Sliding Pill */}
                <div
                  className="absolute top-0 bottom-0 bg-white dark:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-0 block"
                  style={{
                    left: jobPillStyle.left,
                    width: jobPillStyle.width,
                    opacity: jobPillStyle.opacity,
                    visibility: jobPillStyle.opacity > 0 ? 'visible' : 'hidden'
                  }}
                />

                <button
                  ref={el => { if (el) jobNavRefs.current.set('job-fit', el); }}
                  onClick={() => { setActiveSubmissionId(null); setView('job-fit'); }}
                  className={`relative z-10 px-3 h-full rounded-full text-xs font-bold leading-none transition-all flex items-center gap-1.5 ${currentView === 'job-fit' || currentView === 'home' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400'}`}
                >
                  <Briefcase className={`w-3.5 h-3.5 ${(currentView === 'job-fit' || currentView === 'home') ? 'scale-110' : 'scale-100'}`} />
                  <span>Job</span>
                </button>

                <div className={`z-10 flex items-center h-full gap-0.5 overflow-hidden transition-all duration-200 ease-out ${!isCoachMode && currentView !== 'grad' ? 'max-w-xs opacity-100 ml-0.5' : 'max-w-0 opacity-0'}`}>
                  <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-1" />
                  <button
                    ref={el => { if (el) jobNavRefs.current.set('history', el); }}
                    onClick={() => { setActiveSubmissionId(null); setView('history'); }}
                    className={`px-2.5 h-full rounded-full text-xs font-semibold leading-none flex items-center transition-all ${currentView === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}
                  >
                    History
                  </button>
                  <button
                    ref={el => { if (el) jobNavRefs.current.set('resumes', el); }}
                    onClick={() => { setActiveSubmissionId(null); setView('resumes'); }}
                    className={`px-2.5 h-full rounded-full text-xs font-semibold leading-none flex items-center transition-all ${currentView === 'resumes' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}
                  >
                    Resumes
                  </button>
                  <button
                    ref={el => { if (el) jobNavRefs.current.set('skills', el); }}
                    onClick={() => { setActiveSubmissionId(null); setView('skills'); }}
                    className={`px-2.5 h-full rounded-full text-xs font-semibold leading-none flex items-center transition-all ${currentView === 'skills' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}
                  >
                    Skills
                  </button>
                  {(userTier === 'pro' || isTester || isAdmin) && (
                    <button
                      ref={el => { if (el) jobNavRefs.current.set('pro', el); }}
                      onClick={() => { setActiveSubmissionId(null); setView('pro'); }}
                      className={`px-2.5 h-full rounded-full text-xs font-semibold leading-none flex items-center transition-all ${currentView === 'pro' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'}`}
                    >
                      Feed
                    </button>
                  )}
                </div>
              </div>

              {/* Navigator | Coach */}
              {(isTester || isAdmin) && (
                <div className={`flex items-center h-full rounded-full transition-all duration-500 ml-0.5 ${isCoachMode ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50 pr-0.5' : ''}`}>
                  <button
                    onClick={() => { setActiveSubmissionId(null); setView('coach-home'); }}
                    className={`px-3 h-full rounded-full text-xs font-bold leading-none transition-all flex items-center gap-1.5 ${isCoachMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'}`}
                  >
                    <TrendingUp className={`w-3.5 h-3.5 ${isCoachMode ? 'scale-110' : 'scale-100'}`} />
                    <span>Coach</span>
                  </button>

                  <div className={`flex items-center h-full gap-0.5 overflow-hidden transition-all duration-200 ease-out ${isCoachMode ? 'max-w-md opacity-100 ml-0.5' : 'max-w-0 opacity-0'}`}>
                    <div className="w-px h-3 bg-emerald-200 dark:bg-emerald-800 mx-1" />
                    <button
                      onClick={() => { setActiveSubmissionId(null); setView('coach-role-models'); }}
                      className={`px-2.5 h-full rounded-full text-xs font-semibold leading-none flex items-center transition-all ${currentView === 'coach-role-models' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'}`}
                    >
                      Role Models
                    </button>
                    <button
                      onClick={() => { setActiveSubmissionId(null); setView('coach-gap-analysis'); }}
                      className={`px-2.5 h-full rounded-full text-xs font-semibold leading-none flex items-center transition-all ${currentView === 'coach-gap-analysis' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'}`}
                    >
                      Skills Gap
                    </button>
                  </div>
                </div>
              )}

              {/* Navigator | Edu */}
              {isAdmin && (
                <div className={`flex items-center h-full rounded-full transition-all duration-500 ml-0.5 ${currentView === 'grad' ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200/50 dark:border-slate-600/50 pr-0.5' : ''}`}>
                  <button
                    onClick={() => { setActiveSubmissionId(null); setView('grad'); }}
                    className={`px-3 h-full rounded-full text-xs font-bold leading-none transition-all flex items-center gap-1.5 ${currentView === 'grad' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-violet-600 dark:text-slate-400'}`}
                  >
                    <GraduationCap className={`w-3.5 h-3.5 ${currentView === 'grad' ? 'scale-110' : 'scale-100'}`} />
                    <span>Edu</span>
                  </button>
                </div>
              )}
            </nav>
          )}

          <div className="flex items-center gap-1.5">
            {!isLoading && !user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold rounded-full border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span>Log Out</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => { setActiveSubmissionId(null); setView('admin'); }}
                className={`p-1.5 rounded-full transition-all ${currentView === 'admin' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Admin Console"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}

            {/* User Profile / Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full pb-16 sm:pb-8">
        <Routes>
          {/* Home / Analyze */}
          <Route path="/" element={
            <>
              {nudgeJob && (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16">
                  <NudgeCard
                    job={nudgeJob}
                    onUpdateStatus={handleNudgeResponse}
                    onDismiss={() => setNudgeJob(null)}
                  />
                </div>
              )}
              <div className="pt-16">
                <HomeInput
                  resumes={state.resumes}
                  onJobCreated={handleJobCreated}
                  onTargetJobCreated={handleTargetJobCreated}
                  onImportResume={handleImportResume}
                  isParsing={isParsingResume}
                  importError={importError ?? null}
                  isAdmin={isAdmin}
                  isTester={isTester}
                  user={user}
                  usageStats={usageStats}
                  mode="all"
                  onNavigate={setView}
                />
              </div>
            </>
          } />

          <Route path="/analyze" element={
            <div className="pt-16">
              <HomeInput
                resumes={state.resumes}
                onJobCreated={handleJobCreated}
                onTargetJobCreated={handleTargetJobCreated}
                onImportResume={handleImportResume}
                isParsing={isParsingResume}
                importError={importError ?? null}
                isAdmin={isAdmin}
                isTester={isTester}
                user={user}
                usageStats={usageStats}
                mode="apply"
                onNavigate={setView}
              />
            </div>
          } />

          {/* SEO Landing Pages (Dynamic) */}
          <Route path={ROUTES.SEO_LANDING} element={<SEOLandingPage />} />

          {/* Core Views */}
          <Route path={ROUTES.FEED} element={
            <Suspense fallback={<LoadingState message="Loading Pro Feed..." />}>
              <div className="pt-12">
                <JobFitPro onDraftApplication={handleDraftApplication} />
              </div>
            </Suspense>
          } />

          <Route path={ROUTES.ADMIN} element={
            <Suspense fallback={<LoadingState message="Loading Admin Console..." />}>
              <AdminDashboard />
            </Suspense>
          } />

          <Route path={ROUTES.RESUMES} element={
            <Suspense fallback={<LoadingState message="Opening Editor..." />}>
              <div className="pt-12">
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
          } />

          <Route path={ROUTES.SKILLS} element={
            <div className="pt-12">
              <SkillsView
                skills={state.skills}
                resumes={state.resumes}
                onSkillsUpdated={(skills) => setState(prev => ({ ...prev, skills }))}
                onStartInterview={(name) => setInterviewSkill(name)}
                userTier={userTier}
              />
            </div>
          } />

          {/* Coach Routes */}
          <Route path={ROUTES.COACH_HOME + "/*"} element={
            <div className="pt-16">
              <CoachDashboard
                userSkills={state.skills}
                roleModels={state.roleModels}
                targetJobs={state.targetJobs}
                transcript={transcript}
                activeAnalysisIds={activeAnalysisIds}
                view={currentView as 'coach-home' | 'coach-role-models' | 'coach-gap-analysis'}
                onViewChange={setView}
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

                  setActiveAnalysisIds(prev => new Set(prev).add(targetJobId));
                  showInfo && showInfo("AI Coach is analyzing your skill gap in the background...");

                  const analysisPromise = (targetJob.type === 'role_model' && targetJob.roleModelId)
                    ? (() => {
                      const rm = state.roleModels.find(r => r.id === targetJob.roleModelId);
                      return rm
                        ? analyzeRoleModelGap(rm, state.resumes, state.skills)
                        : Promise.reject(new Error("Role Model not found"));
                    })()
                    : analyzeGap(state.roleModels, state.resumes, state.skills, transcript, targetJob.strictMode ?? true);

                  analysisPromise
                    .then(async (analysis: GapAnalysisResult) => {
                      const updatedTargetJob = { ...targetJob, gapAnalysis: analysis };
                      const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                      setState(prev => ({ ...prev, targetJobs: updatedList }));
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

                  setActiveAnalysisIds(prev => new Set(prev).add(`${targetJobId}-roadmap`));
                  showInfo && showInfo("AI Coach is building your 12-month roadmap...");

                  generateRoadmap(targetJob.gapAnalysis)
                    .then(async (roadmap) => {
                      const updatedTargetJob = { ...targetJob, roadmap };
                      const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                      setState(prev => ({ ...prev, targetJobs: updatedList }));
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
                    m.id === milestoneId ? { ...m, status: (m.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' } : m
                  );
                  const updatedTargetJob = { ...targetJob, roadmap: updatedRoadmap };
                  const updatedList = await Storage.saveTargetJob(updatedTargetJob);
                  setState(prev => ({ ...prev, targetJobs: updatedList }));
                }}
              />
            </div>
          } />

          {/* History / All Context */}
          <Route path={ROUTES.HISTORY} element={
            <div className="pt-20">
              <History
                jobs={state.jobs}
                onSelectJob={setActiveSubmissionId}
                onDeleteJob={handleDeleteJob}
              />
            </div>
          } />

          <Route path={ROUTES.JOB_DETAIL} element={
            activeJob ? (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24 animate-in slide-in-from-right-4 duration-500">
                <JobDetail
                  job={activeJob}
                  resumes={state.resumes}
                  onBack={() => setView('history')}
                  onUpdateJob={handleUpdateJob}
                  userTier={userTier}
                />
              </div>
            ) : (
              // Fallback / Loading
              <div className="pt-24 text-center">
                <LoadingState message="Loading Job..." />
              </div>
            )
          } />

          <Route path={ROUTES.GRAD} element={
            <Suspense fallback={<LoadingState message="Loading Academic HQ..." />}>
              <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
                <GradFitPlaceholder />
              </div>
            </Suspense>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
