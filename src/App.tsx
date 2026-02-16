import React, { Suspense, lazy, useLayoutEffect, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useUser } from './contexts/UserContext';
import { LoadingState } from './components/common/LoadingState';

// Context Providers & Hooks
import { JobProvider, useJobContext } from './modules/job/context/JobContext';
import { ResumeProvider, useResumeContext } from './modules/resume/context/ResumeContext';
import { CoachProvider, useCoachContext } from './modules/career/context/CoachContext';
import { SkillProvider, useSkillContext } from './modules/skills/context/SkillContext';
import { GlobalUIProvider, useGlobalUI } from './contexts/GlobalUIContext';

// Core Modules
import HomeInput from './modules/job/HomeInput';

// Lazy load heavy modules
const History = lazy(() => import('./modules/job/History'));
const JobDetail = lazy(() => import('./modules/job/JobDetail'));
const CoachDashboard = lazy(() => import('./modules/career/CoachDashboard').then(m => ({ default: m.CoachDashboard })));
const ResumeEditor = lazy(() => import('./modules/resume/ResumeEditor'));
const JobFitPro = lazy(() => import('./modules/job/JobFitPro').then(m => ({ default: m.JobFitPro })));
const AdminDashboard = lazy(() => import('./modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AcademicHQ = lazy(() => import('./modules/grad/AcademicHQ').then(m => ({ default: m.AcademicHQ })));
const SEOLandingPage = lazy(() => import('./modules/seo/SEOLandingPage').then(m => ({ default: m.SEOLandingPage })));
const SkillsView = lazy(() => import('./components/skills/SkillsView').then(m => ({ default: m.SkillsView })));

// Regular imports
import { ROUTES, STORAGE_KEYS } from './constants';
// NudgeCard removed
import { NudgeCard } from './components/NudgeCard';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// New layout components
import { Header } from './components/layout/Header';
import { GlobalModals } from './components/layout/GlobalModals';
import { isCoachView } from './modules/career/types';

const AppContent: React.FC = () => {
  // Consume Contexts
  const {
    jobs, activeJobId, activeJob,
    handleJobCreated, handleUpdateJob, handleDeleteJob, handleAnalyzeJob, handleDraftApplication,
    handlePromoteFromFeed,
    setActiveJobId, usageStats, upgradeModalData, closeUpgradeModal,
    nudgeJob, dismissNudge
  } = useJobContext();

  const {
    resumes, isParsingResume, importError, handleImportResume, handleUpdateResumes
  } = useResumeContext();

  const {
    roleModels, targetJobs, transcript, activeAnalysisIds,
    handleAddRoleModel, handleDeleteRoleModel, handleRunGapAnalysis, handleGenerateRoadmap,
    handleToggleMilestone, handleTargetJobCreated, handleEmulateRoleModel, handleUpdateTargetJob
  } = useCoachContext();

  const {
    skills, interviewSkill, setInterviewSkill, handleInterviewComplete, updateSkills
  } = useSkillContext();

  const {
    currentView, setView, showAuth, setShowAuth, showSettings, setShowSettings
  } = useGlobalUI();

  const { user, userTier, isTester, isAdmin, simulatedTier, setSimulatedTier, signOut: handleSignOut } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Sync Effect: Update currentView based on URL
  useEffect(() => {
    const path = location.pathname;

    // Reverse mapping from Path to View ID
    const pathToView: Record<string, string> = {
      [ROUTES.HOME]: 'home',
      [ROUTES.FEED]: 'job-fit',
      [ROUTES.PRO_FEED]: 'job-fit',
      [ROUTES.HISTORY]: 'history',
      [ROUTES.SKILLS]: 'skills',
      [ROUTES.RESUMES]: 'resumes',
      [ROUTES.COACH_HOME]: 'coach-home',
      [ROUTES.GRAD]: 'grad',
      [ROUTES.ADMIN]: 'admin',
      [ROUTES.COVER_LETTERS]: 'cover-letters',
    };

    // Handle dynamic job detail route
    if (path.startsWith('/job/')) {
      if (currentView !== 'history') setView('history');
      return;
    }

    // Handle dynamic SEO routes
    if (path.startsWith('/resume-for/')) {
      if (currentView !== 'home') setView('home');
      return;
    }

    // Handle coach sub-routes
    if (path.startsWith(ROUTES.COACH_HOME)) {
      if (currentView !== 'coach-home') setView('coach-home');
      return;
    }

    const viewId = pathToView[path];
    if (viewId && viewId !== currentView) {
      setView(viewId);
    }
  }, [location.pathname, setView, currentView]);

  // Handler for navigation from UI components
  const handleViewChange = (viewId: string) => {
    const viewToPath: Record<string, string> = {
      'home': ROUTES.HOME,
      'job-fit': ROUTES.FEED,
      'history': ROUTES.HISTORY,
      'skills': ROUTES.SKILLS,
      'resumes': ROUTES.RESUMES,
      'coach-home': ROUTES.COACH_HOME,
      'grad': ROUTES.GRAD,
      'admin': ROUTES.ADMIN,
      'cover-letters': ROUTES.COVER_LETTERS,
    };

    const path = viewToPath[viewId];
    if (path) {
      navigate(path);
    } else {
      setView(viewId); // Fallback for views without explicit routes
    }
  };

  // URL Job Sync Effect (Existing)
  useEffect(() => {
    const match = location.pathname.match(/\/job\/([^/]+)/);
    const urlJobId = match ? match[1] : null;
    if (urlJobId !== activeJobId) {
      setActiveJobId(urlJobId);
    }
  }, [location.pathname, setActiveJobId]);

  // Derived State
  const isCoachMode = typeof currentView === 'string' && currentView.startsWith('coach');
  const isEduMode = currentView === 'grad' || (typeof currentView === 'string' && currentView.startsWith('grad-'));

  // Reconstruct NudgeJob (For now assuming null or locally managed if not in context)
  // useAppLogic had nudgeJob. It was for "Hey you checked this job 3 days ago".
  // This logic is missing from my Contexts.
  // It's minor, implies "active apps that need attention".
  // I will just mock it as null for now to unblock, or add to JobContext later.


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
        upgradeModalData={upgradeModalData}
        onCloseUpgradeModal={closeUpgradeModal}
        interviewSkill={interviewSkill}
        setInterviewSkill={setInterviewSkill}
        user={user}
        userTier={userTier}
        isTester={isTester}
        isAdmin={isAdmin}
        simulatedTier={simulatedTier}
        setSimulatedTier={setSimulatedTier}
        handleInterviewComplete={handleInterviewComplete}
        usageStats={usageStats}
      />

      <Header
        currentView={currentView}
        isCoachMode={isCoachMode}
        isEduMode={isEduMode}
        onViewChange={handleViewChange}
        onSignOut={handleSignOut}
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
                      onUpdateStatus={(status) => {
                        handleUpdateJob({ ...nudgeJob, status });
                        dismissNudge();
                      }}
                      onDismiss={dismissNudge}
                    />
                  </div>
                )}
                {/* NudgeJob Removed */}
                <HomeInput
                  resumes={resumes}
                  onJobCreated={handleJobCreated}
                  onTargetJobCreated={handleTargetJobCreated}
                  onImportResume={handleImportResume}
                  isParsing={isParsingResume}
                  importError={importError}
                  isAdmin={isAdmin}
                  isTester={isTester}
                  user={user}
                  usageStats={usageStats}
                  mode="all"
                  onNavigate={handleViewChange}
                  onShowAuth={() => setShowAuth(true)}
                />
              </>
            } />

            <Route path="/analyze" element={
              <HomeInput
                resumes={resumes}
                onJobCreated={handleJobCreated}
                onTargetJobCreated={handleTargetJobCreated}
                onImportResume={handleImportResume}
                isParsing={isParsingResume}
                importError={importError}
                isAdmin={isAdmin}
                isTester={isTester}
                user={user}
                usageStats={usageStats}
                mode="apply"
                onNavigate={handleViewChange}
                onShowAuth={() => setShowAuth(true)}
              />
            } />

            {/* SEO Landing Pages (Dynamic) */}
            <Route path={ROUTES.SEO_LANDING} element={
              <Suspense fallback={<LoadingState />}>
                <SEOLandingPage />
              </Suspense>
            } />

            {/* Core Views */}
            <Route path={ROUTES.FEED} element={
              <Suspense fallback={<LoadingState message="Loading Pro Feed..." />}>
                <div className="pt-12">
                  <JobFitPro onDraftApplication={handleDraftApplication} onPromoteFromFeed={handlePromoteFromFeed} />
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
                    resumes={resumes}
                    skills={skills}
                    onSave={handleUpdateResumes}
                    onImport={handleImportResume}
                    isParsing={isParsingResume}
                    importError={importError}
                    importTrigger={0} // Removed trigger for now
                  />
                </div>
              </Suspense>
            } />

            <Route path={ROUTES.SKILLS} element={
              <Suspense fallback={<LoadingState message="Loading Skills Dashboard..." />}>
                <div className="pt-12">
                  <SkillsView
                    skills={skills}
                    resumes={resumes}
                    onSkillsUpdated={updateSkills}
                    onStartInterview={setInterviewSkill}
                    userTier={userTier}
                  />
                </div>
              </Suspense>
            } />

            {/* Coach Routes */}
            <Route path={ROUTES.COACH_HOME + "/*"} element={
              <Suspense fallback={<LoadingState message="Consulting Career Coach..." />}>
                <div className="pt-16">
                  <CoachDashboard
                    userSkills={skills}
                    roleModels={roleModels}
                    targetJobs={targetJobs}
                    resumes={resumes}
                    transcript={transcript}
                    activeAnalysisIds={activeAnalysisIds}
                    view={isCoachView(currentView) ? currentView : 'coach-home'}
                    onViewChange={handleViewChange}
                    onAddRoleModel={handleAddRoleModel}
                    onAddTargetJob={handleTargetJobCreated}
                    onUpdateTargetJob={handleUpdateTargetJob}
                    onEmulateRoleModel={handleEmulateRoleModel}
                    onDeleteRoleModel={handleDeleteRoleModel}
                    onRunGapAnalysis={(id) => handleRunGapAnalysis(id, { resumes, skills })} // Pass context state
                    onGenerateRoadmap={handleGenerateRoadmap}
                    onToggleMilestone={handleToggleMilestone}
                  />
                </div>
              </Suspense>
            } />

            {/* History / All Context */}
            <Route path={ROUTES.HISTORY} element={
              <Suspense fallback={<LoadingState message="Opening Vault..." />}>
                <div className="pt-20">
                  <History
                    jobs={jobs}
                    onSelectJob={setActiveJobId}
                    onDeleteJob={handleDeleteJob}
                  />
                </div>
              </Suspense>
            } />

            <Route path={ROUTES.JOB_DETAIL} element={
              <Suspense fallback={<LoadingState message="Analyzing Job..." />}>
                {activeJob ? (
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-24 animate-in slide-in-from-right-4 duration-500">
                    <JobDetail
                      job={activeJob}
                      resumes={resumes}
                      onBack={() => setView('history')}
                      onUpdateJob={handleUpdateJob}
                      onAnalyzeJob={(j) => handleAnalyzeJob(j, { resumes, skills })}
                      userTier={userTier}
                    />
                  </div>
                ) : (
                  <div className="pt-24 text-center">
                    <LoadingState message="Loading Job..." />
                  </div>
                )}
              </Suspense>
            } />

            <Route path={ROUTES.GRAD} element={
              <Suspense fallback={<LoadingState message="Loading Academic HQ..." />}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
                  <AcademicHQ />
                </div>
              </Suspense>
            } />

            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
};

const App: React.FC = () => {
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
    <GlobalUIProvider>
      <SkillProvider>
        <ResumeProvider>
          <JobProvider>
            <CoachProvider>
              <AppContent />
            </CoachProvider>
          </JobProvider>
        </ResumeProvider>
      </SkillProvider>
    </GlobalUIProvider>
  );
};

export default App;
