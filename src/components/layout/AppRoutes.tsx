import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoadingState } from '../common/LoadingState';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ROUTES } from '../../constants';

// Context Hooks
import { useJobContext } from '../../modules/job/context/JobContext';
import { useResumeContext } from '../../modules/resume/context/ResumeContext';
import { useCoachContext } from '../../modules/career/context/CoachContext';
import { useSkillContext } from '../../modules/skills/context/SkillContext';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { useUser } from '../../contexts/UserContext';

// Core Modules
import HomeInput from '../../modules/job/HomeInput';
import { NudgeCard } from '../NudgeCard';

// Lazy load heavy modules
const History = lazy(() => import('../../modules/job/History'));
const JobDetail = lazy(() => import('../../modules/job/JobDetail'));
const CoachDashboard = lazy(() => import('../../modules/career/CoachDashboard').then(m => ({ default: m.CoachDashboard })));
const ResumeEditor = lazy(() => import('../../modules/resume/ResumeEditor'));
const NavigatorPro = lazy(() => import('../../modules/job/NavigatorPro').then(m => ({ default: m.NavigatorPro })));
const AdminDashboard = lazy(() => import('../../modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const EducationDashboard = lazy(() => import('../../modules/grad/EducationDashboard').then(m => ({ default: m.EducationDashboard })));
const AcademicHQ = lazy(() => import('../../modules/grad/AcademicHQ').then(m => ({ default: m.AcademicHQ })));
const SEOLandingPage = lazy(() => import('../../modules/seo/SEOLandingPage').then(m => ({ default: m.SEOLandingPage })));
const SkillsView = lazy(() => import('../skills/SkillsView').then(m => ({ default: m.SkillsView })));

export const AppRoutes: React.FC = () => {
    const {
        jobs, activeJobId, activeJob,
        handleJobCreated, handleUpdateJob, handleDeleteJob, handleAnalyzeJob, handleDraftApplication,
        handlePromoteFromFeed,
        setActiveJobId, usageStats,
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
        skills, setInterviewSkill, updateSkills
    } = useSkillContext();

    const {
        currentView, setView, setShowAuth
    } = useGlobalUI();

    const { user, userTier, isAdmin, isTester } = useUser();
    const location = useLocation();
    const navigate = useNavigate();

    // URL Sync Effect: Update currentView based on URL
    useEffect(() => {
        const path = location.pathname;

        // Reverse mapping from Path to View ID
        const pathToView: Record<string, string> = {
            [ROUTES.HOME]: 'home',
            [ROUTES.ANALYZE]: 'job',
            [ROUTES.FEED]: 'job-fit',
            [ROUTES.PRO_FEED]: 'job-fit',
            [ROUTES.HISTORY]: 'history',
            [ROUTES.SKILLS]: 'skills',
            [ROUTES.RESUMES]: 'resumes',
            [ROUTES.COACH_HOME]: 'coach-home',
            [ROUTES.COACH_ROLE_MODELS]: 'coach-role-models',
            [ROUTES.COACH_GAP]: 'coach-gap-analysis',
            [ROUTES.EDUCATION_HOME]: 'edu-home',
            [ROUTES.GRAD]: 'edu-record',
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

        const viewId = pathToView[path];
        if (viewId && viewId !== currentView) {
            setView(viewId);
        }
    }, [location.pathname, setView, currentView]);

    // URL Job Sync Effect
    useEffect(() => {
        const match = location.pathname.match(/\/job\/([^/]+)/);
        const urlJobId = match ? match[1] : null;
        if (urlJobId !== activeJobId) {
            setActiveJobId(urlJobId);
        }
    }, [location.pathname, setActiveJobId, activeJobId]);

    const handleViewChange = (viewId: string) => {
        const viewToPath: Record<string, string> = {
            'home': ROUTES.HOME,
            'job': ROUTES.ANALYZE,
            'analyze': ROUTES.ANALYZE,
            'job-fit': ROUTES.FEED,
            'history': ROUTES.HISTORY,
            'skills': ROUTES.SKILLS,
            'resumes': ROUTES.RESUMES,
            'coach-home': ROUTES.COACH_HOME,
            'coach-role-models': ROUTES.COACH_ROLE_MODELS,
            'coach-gap-analysis': ROUTES.COACH_GAP,
            'edu-home': ROUTES.EDUCATION_HOME,
            'edu-record': ROUTES.GRAD,
            'admin': ROUTES.ADMIN,
            'cover-letters': ROUTES.COVER_LETTERS,
        };

        const path = viewToPath[viewId];
        if (path) {
            navigate(path);
        } else {
            setView(viewId);
        }
    };

    return (
        <ErrorBoundary>
            <Routes>
                {/* Home / Analyze */}
                <Route path="/" element={
                    <>
                        {nudgeJob && (
                            <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-24">
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
                            mode="home"
                            onNavigate={handleViewChange}
                            onShowAuth={() => setShowAuth(true)}
                        />
                    </>
                } />

                <Route path={ROUTES.ANALYZE} element={
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
                        <NavigatorPro onDraftApplication={handleDraftApplication} onPromoteFromFeed={handlePromoteFromFeed} />
                    </Suspense>
                } />

                <Route path="/admin" element={
                    <Suspense fallback={<LoadingState message="Loading Admin Console..." />}>
                        <AdminDashboard />
                    </Suspense>
                } />

                <Route path={ROUTES.RESUMES} element={
                    <Suspense fallback={<LoadingState message="Opening Editor..." />}>
                        <ResumeEditor
                            resumes={resumes}
                            skills={skills}
                            onSave={handleUpdateResumes}
                            onImport={handleImportResume}
                            isParsing={isParsingResume}
                            importError={importError}
                            importTrigger={0}
                        />
                    </Suspense>
                } />

                <Route path={ROUTES.SKILLS} element={
                    <Suspense fallback={<LoadingState message="Loading Skills Dashboard..." />}>
                        <SkillsView
                            skills={skills}
                            resumes={resumes}
                            onSkillsUpdated={updateSkills}
                            onStartInterview={setInterviewSkill}
                            userTier={userTier}
                        />
                    </Suspense>
                } />

                {/* Coach Routes */}
                <Route path={ROUTES.COACH_HOME + "/*"} element={
                    <Suspense fallback={<LoadingState message="Consulting Career Coach..." />}>
                        <CoachDashboard
                            userSkills={skills}
                            roleModels={roleModels}
                            targetJobs={targetJobs}
                            resumes={resumes}
                            transcript={transcript}
                            activeAnalysisIds={activeAnalysisIds}
                            view={typeof currentView === 'string' && currentView.startsWith('coach') ? (currentView as any) : 'coach-home'}
                            onViewChange={handleViewChange}
                            onAddRoleModel={handleAddRoleModel}
                            onAddTargetJob={handleTargetJobCreated}
                            onUpdateTargetJob={handleUpdateTargetJob}
                            onEmulateRoleModel={handleEmulateRoleModel}
                            onDeleteRoleModel={handleDeleteRoleModel}
                            onRunGapAnalysis={(id) => handleRunGapAnalysis(id, { resumes, skills })}
                            onGenerateRoadmap={handleGenerateRoadmap}
                            onToggleMilestone={handleToggleMilestone}
                        />
                    </Suspense>
                } />

                {/* History / All Context */}
                <Route path={ROUTES.HISTORY} element={
                    <Suspense fallback={<LoadingState message="Opening History..." />}>
                        <History
                            jobs={jobs}
                            onSelectJob={setActiveJobId}
                            onDeleteJob={handleDeleteJob}
                        />
                    </Suspense>
                } />

                <Route path={ROUTES.JOB_DETAIL} element={
                    <Suspense fallback={<LoadingState message="Analyzing Job..." />}>
                        {activeJob ? (
                            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 animate-in slide-in-from-right-4 duration-500">
                                <JobDetail
                                    job={activeJob}
                                    resumes={resumes}
                                    onBack={() => handleViewChange('history')}
                                    onUpdateJob={handleUpdateJob}
                                    onAnalyzeJob={(j) => handleAnalyzeJob(j, { resumes, skills })}
                                    userTier={userTier}
                                />
                            </div>
                        ) : (
                            <div className="text-center">
                                <LoadingState message="Loading Job..." />
                            </div>
                        )}
                    </Suspense>
                } />

                <Route path={ROUTES.EDUCATION_HOME} element={
                    <Suspense fallback={<LoadingState message="Loading Education Dashboard..." />}>
                        <EducationDashboard />
                    </Suspense>
                } />

                <Route path={ROUTES.GRAD} element={
                    <Suspense fallback={<LoadingState message="Loading Academic HQ..." />}>
                        <AcademicHQ />
                    </Suspense>
                } />

                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
        </ErrorBoundary>
    );
};
