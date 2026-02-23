import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { SavedJob } from '../../modules/job/types';
import { LoadingState } from '../common/LoadingState';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ROUTES } from '../../constants';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { ProtectedRoute } from './ProtectedRoute';

// Context Hooks
import { useJobContext } from '../../modules/job/context/JobContext';
import { useResumeContext } from '../../modules/resume/context/ResumeContext';
import { useCoachContext } from '../../modules/career/context/CoachContext';
import { useSkillContext } from '../../modules/skills/context/SkillContext';
import { useModal } from '../../contexts/ModalContext';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { useUser } from '../../contexts/UserContext';

// Core Modules
import { NudgeCard } from '../NudgeCard';

// Lazy load heavy modules
const HomePage = lazyWithRetry(() => import('../../modules/job/HomePage'));
const JobMatchInput = lazyWithRetry(() => import('../../modules/job/JobMatchInput'));
const History = lazyWithRetry(() => import('../../modules/job/History'));
const JobDetail = lazyWithRetry(() => import('../../modules/job/JobDetail'));
const CoachDashboard = lazyWithRetry(() => import('../../modules/career/CoachDashboard').then(m => ({ default: m.CoachDashboard })));
const ResumeEditor = lazyWithRetry(() => import('../../modules/resume/ResumeEditor'));
const NavigatorPro = lazyWithRetry(() => import('../../modules/job/NavigatorPro').then(m => ({ default: m.NavigatorPro })));
const AdminDashboard = lazyWithRetry(() => import('../../modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const EducationDashboard = lazyWithRetry(() => import('../../modules/grad/EducationDashboard').then(m => ({ default: m.EducationDashboard })));
const AcademicHQ = lazyWithRetry(() => import('../../modules/grad/AcademicHQ').then(m => ({ default: m.AcademicHQ })));
const SEOLandingPage = lazyWithRetry(() => import('../../modules/seo/SEOLandingPage').then(m => ({ default: m.SEOLandingPage })));
const SkillsView = lazyWithRetry(() => import('../skills/SkillsView').then(m => ({ default: m.SkillsView })));
const CoverLetters = lazyWithRetry(() => import('../../modules/job/CoverLetters').then(m => ({ default: m.CoverLetters })));
const Privacy = lazyWithRetry(() => import('../../modules/legal/Privacy').then(m => ({ default: m.Privacy })));
const GPACalculatorPage = lazyWithRetry(() => import('../../modules/grad/GPACalculatorPage').then(m => ({ default: m.GPACalculatorPage })));
const ProgramExplorerPage = lazyWithRetry(() => import('../../modules/grad/ProgramExplorerPage').then(m => ({ default: m.ProgramExplorerPage })));
const Terms = lazyWithRetry(() => import('../../modules/legal/Terms').then(m => ({ default: m.Terms })));
const Contact = lazyWithRetry(() => import('../../modules/contact/Contact').then(m => ({ default: m.Contact })));
const PlansPage = lazyWithRetry(() => import('../../modules/plans/PlansPage').then(m => ({ default: m.PlansPage })));
const ComparisonTable = lazyWithRetry(() => import('../../modules/plans/ComparisonTable').then(m => ({ default: m.ComparisonTable })));
const FeaturesPage = lazyWithRetry(() => import('../../modules/features/FeaturesPage').then(m => ({ default: m.FeaturesPage })));
const OnboardingPage = lazyWithRetry(() => import('../../modules/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const SettingsPage = lazyWithRetry(() => import('../../modules/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SkillInterviewPage = lazyWithRetry(() => import('../../modules/skills/SkillInterviewPage').then(m => ({ default: m.SkillInterviewPage })));
const InterviewAdvisor = lazyWithRetry(() => import('../../modules/job/InterviewAdvisor').then(m => ({ default: m.InterviewAdvisor })));

export const AppRoutes: React.FC = () => {
    const {
        jobs, activeJobId, activeJob,
        handleJobCreated, handleUpdateJob, handleDeleteJob, handleAnalyzeJob, handleDraftApplication,
        handlePromoteFromFeed,
        setActiveJobId, usageStats,
        nudgeJob, dismissNudge
    } = useJobContext();

    const {
        resumes, isParsingResume, importError, isLoading: isResumesLoading,
        handleImportResume, handleUpdateResumes, clearImportError
    } = useResumeContext();

    const {
        roleModels, targetJobs, transcript, activeAnalysisIds,
        handleAddRoleModel, handleDeleteRoleModel, handleRunGapAnalysis, handleGenerateRoadmap,
        handleToggleMilestone, handleTargetJobCreated, handleEmulateRoleModel, handleUpdateTargetJob
    } = useCoachContext();

    const {
        skills, updateSkills
    } = useSkillContext();

    const {
        currentView, setView
    } = useGlobalUI();

    const { openModal } = useModal();

    const { user, userTier, isAdmin, isTester, journey } = useUser();
    const location = useLocation();
    const navigate = useNavigate();

    // URL Sync Effect: Update currentView based on URL
    useEffect(() => {
        const path = location.pathname;

        // Reverse mapping from Path to View ID
        const pathToView: Record<string, string> = {
            [ROUTES.HOME]: 'home',

            // Jobs
            [ROUTES.JOB_HOME]: 'job-home',
            [ROUTES.FEED]: 'feed',
            [ROUTES.PRO_FEED]: 'feed',
            [ROUTES.HISTORY]: 'history',
            [ROUTES.RESUMES]: 'resumes',
            [ROUTES.INTERVIEWS]: 'interviews',
            [ROUTES.COVER_LETTERS]: 'cover-letters',

            // Career
            [ROUTES.CAREER_HOME]: 'coach-home',
            [ROUTES.SKILLS]: 'skills',
            [ROUTES.CAREER_MODELS]: 'coach-role-models',
            [ROUTES.CAREER_GROWTH]: 'career-growth',
            [ROUTES.COACH_GAP]: 'coach-gap-analysis',

            // Edu
            [ROUTES.EDUCATION_HOME]: 'edu-home',
            [ROUTES.TRANSCRIPT]: 'edu-transcript',
            [ROUTES.GPA_CALCULATOR]: 'edu-gpa',
            [ROUTES.PROGRAM_EXPLORER]: 'edu-programs',

            [ROUTES.ADMIN]: 'admin',
            [ROUTES.PRIVACY]: 'privacy',
            [ROUTES.TERMS]: 'terms',
            [ROUTES.CONTACT]: 'contact',
            [ROUTES.PLANS]: 'plans',
            [ROUTES.PLANS_COMPARE]: 'plans-compare',
            [ROUTES.FEATURES]: 'features',
            [ROUTES.WELCOME]: 'welcome',
            [ROUTES.SETTINGS]: 'settings',
            ['/career/skills/interview']: 'skills-interview',
        };

        // Handle dynamic job detail route
        if (path.startsWith('/jobs/match/')) {
            if (currentView !== 'job-detail') setView('job-detail');
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
        const match = location.pathname.match(/\/jobs\/match\/([^/]+)/);
        const urlJobId = match ? match[1] : null;
        if (urlJobId !== activeJobId) {
            setActiveJobId(urlJobId);
        }
    }, [location.pathname, setActiveJobId, activeJobId]);

    const handleViewChange = (viewId: string) => {
        const viewToPath: Record<string, string> = {
            'home': ROUTES.HOME,

            // Jobs
            'job-home': ROUTES.JOB_HOME,
            'feed': ROUTES.FEED,
            'history': ROUTES.HISTORY,
            'resumes': ROUTES.RESUMES,
            'interviews': ROUTES.INTERVIEWS,
            'cover-letters': ROUTES.COVER_LETTERS,

            // Career
            'coach-home': ROUTES.CAREER_HOME,
            'career-home': ROUTES.CAREER_HOME,
            'skills': ROUTES.SKILLS,
            'coach-role-models': ROUTES.CAREER_MODELS,
            'career-models': ROUTES.CAREER_MODELS,
            'career-growth': ROUTES.CAREER_GROWTH,
            'coach-gap-analysis': ROUTES.CAREER_HOME,

            // Edu
            'edu-home': ROUTES.EDUCATION_HOME,
            'edu-transcript': ROUTES.TRANSCRIPT,
            'edu-gpa': ROUTES.GPA_CALCULATOR,
            'edu-programs': ROUTES.PROGRAM_EXPLORER,

            'admin': ROUTES.ADMIN,
            'plans': ROUTES.PLANS,
            'plans-compare': ROUTES.PLANS_COMPARE,
            'welcome': ROUTES.WELCOME,
            'privacy': ROUTES.PRIVACY,
            'terms': ROUTES.TERMS,
            'contact': ROUTES.CONTACT,
            'features': ROUTES.FEATURES,
            'settings': ROUTES.SETTINGS,
        };

        const path = viewToPath[viewId];

        // CRITICAL: Update state and URL together to prevent lag/stuck states
        setView(viewId);

        if (path) {
            navigate(path);
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
                        <Suspense fallback={<LoadingState />}>
                            <HomePage
                                user={user}
                                isAdmin={isAdmin}
                                isTester={isTester}
                                journey={journey}
                                userTier={userTier}
                                onNavigate={handleViewChange}
                                onShowAuth={(feature) => openModal('AUTH', feature ? { feature } : undefined)}
                            />
                        </Suspense>
                    </>
                } />

                <Route path={ROUTES.WELCOME} element={
                    <Suspense fallback={<LoadingState />}>
                        <OnboardingPage />
                    </Suspense>
                } />

                <Route path={ROUTES.JOB_HOME} element={
                    <Suspense fallback={<LoadingState />}>
                        <JobMatchInput
                            resumes={resumes}
                            onJobCreated={handleJobCreated}
                            onTargetJobCreated={handleTargetJobCreated}
                            onImportResume={handleImportResume}
                            onClearError={clearImportError}
                            isParsing={isParsingResume}
                            importError={importError}
                            isAdmin={isAdmin}
                            user={user}
                            usageStats={usageStats}
                            mode="apply"

                            onNavigate={handleViewChange}
                            onShowAuth={(feature) => openModal('AUTH', feature ? { feature } : undefined)}
                        />
                    </Suspense>
                } />


                {/* SEO Landing Pages (Dynamic) */}
                <Route path={ROUTES.SEO_LANDING} element={
                    <Suspense fallback={<LoadingState />}>
                        <SEOLandingPage />
                    </Suspense>
                } />

                {/* Core Views */}
                <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.FEED} element={
                        <Suspense fallback={<LoadingState message="Loading Feed..." />}>
                            <NavigatorPro onDraftApplication={handleDraftApplication} onPromoteFromFeed={handlePromoteFromFeed} />
                        </Suspense>
                    } />
                </Route>

                <Route element={<ProtectedRoute requireAdmin />}>
                    <Route path="/admin" element={
                        <Suspense fallback={<LoadingState message="Loading Admin Console..." />}>
                            <AdminDashboard />
                        </Suspense>
                    } />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.RESUMES} element={
                        <Suspense fallback={<LoadingState message="Opening Editor..." />}>
                            {isResumesLoading ? (
                                <LoadingState message="Loading Resume..." />
                            ) : (
                                <ResumeEditor
                                    resumes={resumes}
                                    skills={skills}
                                    onSave={handleUpdateResumes}
                                    onImport={handleImportResume}
                                    isParsing={isParsingResume}
                                    importError={importError}
                                    importTrigger={0}
                                />
                            )}
                        </Suspense>
                    } />


                    <Route path={ROUTES.INTERVIEWS} element={
                        <Suspense fallback={<LoadingState message="Prepping Advisor..." />}>
                            {isAdmin ? <InterviewAdvisor /> : <Navigate to={ROUTES.HOME} replace />}
                        </Suspense>
                    } />


                    {/* Career Routes */}
                    <Route path={ROUTES.CAREER_HOME + "/*"} element={
                        <Suspense fallback={<LoadingState message="Consulting Career Coach..." />}>
                            <CoachDashboard
                                userSkills={skills}
                                roleModels={roleModels}
                                targetJobs={targetJobs}
                                resumes={resumes}
                                transcript={transcript}
                                activeAnalysisIds={activeAnalysisIds}
                                view={typeof currentView === 'string' && (currentView.startsWith('career') || currentView.startsWith('coach')) ? (currentView as any) : 'coach-home'}
                                onViewChange={handleViewChange}
                                onAddRoleModel={handleAddRoleModel}
                                onAddTargetJob={handleTargetJobCreated}
                                onUpdateTargetJob={handleUpdateTargetJob}
                                onEmulateRoleModel={handleEmulateRoleModel}
                                onDeleteRoleModel={handleDeleteRoleModel}
                                onRunGapAnalysis={(id: string) => handleRunGapAnalysis(id, { resumes, skills })}
                                onGenerateRoadmap={handleGenerateRoadmap}
                                onToggleMilestone={handleToggleMilestone}
                            />
                        </Suspense>
                    } />

                    {/* Skills is now distinct but under Career header */}
                    <Route path={ROUTES.SKILLS} element={
                        <Suspense fallback={<LoadingState message="Loading Skills Dashboard..." />}>
                            <SkillsView
                                skills={skills}
                                resumes={resumes}
                                onSkillsUpdated={updateSkills}
                                onStartUnifiedInterview={(skillsToVerify: { name: string; proficiency: string }[]) => navigate('/career/skills/interview', { state: { skills: skillsToVerify } })}
                            />
                        </Suspense>
                    } />

                    <Route path="/career/skills/interview" element={
                        <Suspense fallback={<LoadingState message="Starting Interview..." />}>
                            <SkillInterviewPage />
                        </Suspense>
                    } />

                    {/* History */}
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
                                <JobDetail
                                    job={activeJob}
                                    resumes={resumes}
                                    onBack={() => handleViewChange('history')}
                                    onUpdateJob={handleUpdateJob}
                                    onAnalyzeJob={(j: SavedJob) => handleAnalyzeJob(j, { resumes, skills })}
                                    userTier={userTier}
                                    userSkills={skills}
                                />
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



                    <Route path={ROUTES.COVER_LETTERS} element={
                        <Suspense fallback={<LoadingState message="Opening Cover Letters..." />}>
                            <CoverLetters
                                jobs={jobs}
                                onSelectJob={setActiveJobId}
                            />
                        </Suspense>
                    } />

                    <Route path={ROUTES.TRANSCRIPT} element={
                        <Suspense fallback={<LoadingState message="Loading Academic HQ..." />}>
                            <AcademicHQ />
                        </Suspense>
                    } />

                    <Route path={ROUTES.GPA_CALCULATOR} element={
                        <Suspense fallback={<LoadingState message="Loading GPA Calculator..." />}>
                            <GPACalculatorPage />
                        </Suspense>
                    } />

                    <Route path={ROUTES.PROGRAM_EXPLORER} element={
                        <Suspense fallback={<LoadingState message="Loading Program Explorer..." />}>
                            <ProgramExplorerPage />
                        </Suspense>
                    } />
                </Route>

                <Route path={ROUTES.PRIVACY} element={
                    <Suspense fallback={<LoadingState />}>
                        <Privacy />
                    </Suspense>
                } />

                <Route path={ROUTES.TERMS} element={
                    <Suspense fallback={<LoadingState />}>
                        <Terms />
                    </Suspense>
                } />

                <Route path={ROUTES.CONTACT} element={
                    <Suspense fallback={<LoadingState />}>
                        <Contact />
                    </Suspense>
                } />


                <Route path={ROUTES.PLANS} element={
                    <Suspense fallback={<LoadingState message="Loading Plans..." />}>
                        <PlansPage />
                    </Suspense>
                } />

                <Route path={ROUTES.PLANS_COMPARE} element={
                    <Suspense fallback={<LoadingState message="Loading Comparison..." />}>
                        <ComparisonTable />
                    </Suspense>
                } />

                <Route path={ROUTES.FEATURES} element={
                    <Suspense fallback={<LoadingState message="Loading Features..." />}>
                        <FeaturesPage />
                    </Suspense>
                } />

                <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.SETTINGS} element={
                        <Suspense fallback={<LoadingState message="Loading Settings..." />}>
                            <SettingsPage />
                        </Suspense>
                    } />
                </Route>

                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
        </ErrorBoundary>
    );
};
