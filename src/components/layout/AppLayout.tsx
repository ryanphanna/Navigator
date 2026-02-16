import React from 'react';
import { Header } from './Header';
import { GlobalModals } from './GlobalModals';
import { ToastContainer } from '../common/Toast';
import { Analytics } from '@vercel/analytics/react';

// Context Hooks
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentView, setView } = useGlobalUI();
    const navigate = useNavigate();

    const isCoachMode = typeof currentView === 'string' && currentView.startsWith('coach');
    const isEduMode = currentView === 'edu' || (typeof currentView === 'string' && currentView.startsWith('edu-'));

    const handleViewChange = (viewId: string) => {
        const viewToPath: Record<string, string> = {
            'home': ROUTES.HOME,
            'analyze': ROUTES.ANALYZE,
            'job': ROUTES.ANALYZE,
            'job-fit': ROUTES.FEED,
            'history': ROUTES.HISTORY,
            'skills': ROUTES.SKILLS,
            'resumes': ROUTES.RESUMES,
            'coach-home': ROUTES.COACH_HOME,
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

            <GlobalModals />

            <Header
                currentView={currentView}
                isCoachMode={isCoachMode}
                isEduMode={isEduMode}
                onViewChange={handleViewChange}
            />

            <main className="w-full pb-16 sm:pb-8">
                {children}
            </main>
        </div>
    );
};
