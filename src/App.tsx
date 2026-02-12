import { Suspense, lazy, useLayoutEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

import { useAppLogic } from './hooks/useAppLogic';
import { useUser } from './contexts/UserContext';
import { LoadingState } from './components/common/LoadingState';

// Main job-search components
import HomeInput from './modules/job/HomeInput';
import History from './modules/job/History';
import JobDetail from './modules/job/JobDetail';
import { CoachDashboard } from './modules/career/CoachDashboard';

// Lazy load heavy modules
const ResumeEditor = lazy(() => import('./modules/resume/ResumeEditor'));
const JobFitPro = lazy(() => import('./modules/job/JobFitPro').then(m => ({ default: m.JobFitPro })));
const AdminDashboard = lazy(() => import('./modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AcademicHQ = lazy(() => import('./modules/grad/AcademicHQ').then(m => ({ default: m.AcademicHQ })));

// Regular imports
import { SkillsView } from './components/skills/SkillsView';
import { ROUTES, STORAGE_KEYS } from './constants';
import { SEOLandingPage } from './modules/seo/SEOLandingPage';
import { NudgeCard } from './components/NudgeCard';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// New layout components
import { Header } from './components/layout/Header';
import { GlobalModals } from './components/layout/GlobalModals';

const App: React.FC = () => {
  // Use the new hook to manage app logic
  const {
    state,
    setState,
    transcript,
    usage: { stats: usageStats, showUpgradeModal, setShowUpgradeModal },
    ui: {
      currentView, activeAnalysisIds, nudgeJob, setNudgeJob,
      showSettings, setShowSettings, showAuth, setShowAuth,
      isParsingResume, importError, importTrigger, interviewSkill, setInterviewSkill
    },
    actions,
  } = useAppLogic();

  const activeJob = state.jobs.find(j => j.id === state.activeSubmissionId);

  // Auth Context
  const { user, userTier, isTester, isAdmin, simulatedTier, setSimulatedTier } = useUser();

  // const isLoading = state.apiStatus === 'checking';
  const isCoachMode = typeof currentView === 'string' && currentView.startsWith('coach');
  const isEduMode = currentView === 'grad' || (typeof currentView === 'string' && currentView.startsWith('grad-'));



  // Theme Initialization
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className={`min-h-screen bg-white dark:bg-[#000000] font-sans selection:bg-emerald-500/30 text-neutral-900 dark:text-neutral-100 transition-colors duration-500 ${isCoachMode ? 'theme-coach' : isEduMode ? 'theme-edu' : 'theme-job'}`}>
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

      <GlobalModals
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showUpgradeModal={showUpgradeModal}
        setShowUpgradeModal={setShowUpgradeModal}
        interviewSkill={interviewSkill}
        setInterviewSkill={setInterviewSkill}
        user={user}
        userTier={userTier}
        isTester={isTester}
        isAdmin={isAdmin}
        simulatedTier={simulatedTier}
        setSimulatedTier={setSimulatedTier as any}
        handleInterviewComplete={actions.handleInterviewComplete as any}
      />

      <Header
        currentView={currentView as string}
        isCoachMode={isCoachMode}
        isEduMode={isEduMode}
        onViewChange={actions.setView}
        onSignOut={actions.handleSignOut}
        onShowSettings={() => setShowSettings(true)}
        onShowAuth={() => setShowAuth(true)}
      />

      <main className="w-full pb-16 sm:pb-8">
        <ErrorBoundary>
          <Routes>
            {/* Home / Analyze */}
            <Route path="/" element={
              <>
                {nudgeJob && (
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16">
                    <NudgeCard
                      job={nudgeJob}
                      onUpdateStatus={actions.handleNudgeResponse}
                      onDismiss={() => setNudgeJob(null)}
                    />
                  </div>
                )}
                <div className="pt-8">
                  <HomeInput
                    resumes={state.resumes}
                    onJobCreated={actions.handleJobCreated}
                    onTargetJobCreated={actions.handleTargetJobCreated}
                    onImportResume={actions.handleImportResume}
                    isParsing={isParsingResume}
                    importError={importError ?? null}
                    isAdmin={isAdmin}
                    isTester={isTester}
                    user={user}
                    usageStats={usageStats}
                    mode="all"
                    onNavigate={actions.setView}
                  />
                </div>
              </>
            } />

            <Route path="/analyze" element={
              <div className="pt-16">
                <HomeInput
                  resumes={state.resumes}
                  onJobCreated={actions.handleJobCreated}
                  onTargetJobCreated={actions.handleTargetJobCreated}
                  onImportResume={actions.handleImportResume}
                  isParsing={isParsingResume}
                  importError={importError ?? null}
                  isAdmin={isAdmin}
                  isTester={isTester}
                  user={user}
                  usageStats={usageStats}
                  mode="apply"
                  onNavigate={actions.setView}
                />
              </div>
            } />

            {/* SEO Landing Pages (Dynamic) */}
            <Route path={ROUTES.SEO_LANDING} element={<SEOLandingPage />} />

            {/* Core Views */}
            <Route path={ROUTES.FEED} element={
              <Suspense fallback={<LoadingState message="Loading Pro Feed..." />}>
                <div className="pt-12">
                  <JobFitPro onDraftApplication={actions.handleDraftApplication} />
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
                    onImport={actions.handleImportResume}
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
                  view={(currentView as any).startsWith('coach') ? currentView as any : 'coach-home'}
                  onViewChange={actions.setView}
                  onAddRoleModel={actions.handleAddRoleModel}
                  onAddTargetJob={actions.handleTargetJobCreated}
                  onUpdateTargetJob={actions.handleUpdateTargetJob}
                  onEmulateRoleModel={actions.handleEmulateRoleModel}
                  onDeleteRoleModel={actions.handleDeleteRoleModel}
                  onRunGapAnalysis={actions.handleRunGapAnalysis}
                  onGenerateRoadmap={actions.handleGenerateRoadmap}
                  onToggleMilestone={actions.handleToggleMilestone}
                />
              </div>
            } />

            {/* History / All Context */}
            <Route path={ROUTES.HISTORY} element={
              <div className="pt-20">
                <History
                  jobs={state.jobs}
                  onSelectJob={(id) => setState(prev => ({ ...prev, activeSubmissionId: id }))}
                  onDeleteJob={actions.handleDeleteJob}
                />
              </div>
            } />

            <Route path={ROUTES.JOB_DETAIL} element={
              activeJob ? (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24 animate-in slide-in-from-right-4 duration-500">
                  <JobDetail
                    job={activeJob}
                    resumes={state.resumes}
                    onBack={() => actions.setView('history')}
                    onUpdateJob={actions.handleUpdateJob}
                    onAnalyzeJob={actions.handleAnalyzeJob}
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
                  <AcademicHQ />
                </div>
              </Suspense>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
