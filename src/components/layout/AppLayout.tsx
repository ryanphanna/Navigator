import React from 'react';
import { Header } from './Header';
import { GlobalModals } from './GlobalModals';
import { ToastContainer } from '../common/Toast';
import { Analytics } from '@vercel/analytics/react';

// Context Hooks
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';


import { Footer } from './Footer';
import { useToast } from '../../contexts/ToastContext';
import { useLocation } from 'react-router-dom';



export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentView, setView } = useGlobalUI();
    const navigate = useNavigate();
    const location = useLocation();
    const { clearToasts } = useToast();

    // Clear toasts on every route change
    React.useEffect(() => {
        clearToasts();
    }, [location.pathname, clearToasts]);

    const isCoachMode = typeof currentView === 'string' && (currentView.startsWith('career') || currentView.startsWith('coach') || currentView === 'skills');
    const isEduMode = typeof currentView === 'string' && currentView.startsWith('edu');




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
            'career-home': ROUTES.CAREER_HOME,
            'coach-home': ROUTES.CAREER_HOME,
            'skills': ROUTES.SKILLS,
            'coach-role-models': ROUTES.CAREER_MODELS,
            'career-models': ROUTES.CAREER_MODELS,
            'career-growth': ROUTES.CAREER_GROWTH,
            'coach-gap-analysis': ROUTES.CAREER_HOME, // Maps to base career path

            // Edu
            'edu-home': ROUTES.EDUCATION_HOME,
            'edu-transcript': ROUTES.TRANSCRIPT,
            'edu-programs': ROUTES.PROGRAM_EXPLORER,
            'edu-gpa': ROUTES.GPA_CALCULATOR,

            'admin': ROUTES.ADMIN,
            'plans': ROUTES.PLANS,
            'plans-compare': ROUTES.PLANS_COMPARE,
            'welcome': ROUTES.WELCOME,
            'privacy': ROUTES.PRIVACY,
            'terms': ROUTES.TERMS,
            'contact': ROUTES.CONTACT,
            'features': ROUTES.FEATURES,
        };

        const path = viewToPath[viewId];

        // CRITICAL: Update state and URL together to prevent lag/stuck states
        setView(viewId);

        if (path) {
            navigate(path);
        }
    };



    return (
        <div className={`min-h-screen flex flex-col bg-white dark:bg-[#000000] font-sans selection:bg-emerald-500/30 text-neutral-900 dark:text-neutral-100 transition-colors duration-500 ${isCoachMode ? 'theme-coach' : isEduMode ? 'theme-edu' : 'theme-job'}`}>
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                        scroll-behavior: auto !important;
                    }
                }

                @keyframes theme-pulse {
                    0% { filter: brightness(1); }
                    50% { filter: brightness(1.2) saturate(1.2); }
                    100% { filter: brightness(1); }
                }

                .animate-theme-pulse {
                    animation: theme-pulse 2s ease-in-out;
                }
            `}</style>
            <ToastContainer />
            <Analytics />

            <GlobalModals />

            {!['job-detail'].includes(currentView as string) && (
                <Header
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    isCoachMode={isCoachMode}
                    isEduMode={isEduMode}
                />
            )}

            <main className="flex-1 w-full pt-16 pb-16 sm:pb-8">
                {children}
            </main>

            <Footer />
        </div>
    );
};
