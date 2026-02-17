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
import { WelcomeScreen } from '../../modules/onboarding/WelcomeScreen';
// import { useUser } from '../../contexts/UserContext'; // Removed unused import

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentView, setView } = useGlobalUI();
    const navigate = useNavigate();

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
            'cover-letters': ROUTES.COVER_LETTERS,

            // Career
            'career-home': ROUTES.CAREER_HOME,
            'coach-home': ROUTES.CAREER_HOME,
            'skills': ROUTES.SKILLS,
            'career-models': ROUTES.CAREER_MODELS,
            'career-growth': ROUTES.CAREER_GROWTH,

            // Edu
            'edu-home': ROUTES.EDUCATION_HOME,
            'edu-transcript': ROUTES.TRANSCRIPT,

            'admin': ROUTES.ADMIN,
        };

        const path = viewToPath[viewId];
        if (path) {
            navigate(path);
        } else {
            setView(viewId);
        }
    };

    const [showWelcome, setShowWelcome] = React.useState(() => {
        if (typeof window === 'undefined') return false;
        return !localStorage.getItem('navigator_privacy_accepted');
    });

    // const { updateProfile } = useUser(); // Removed unused variable

    const handleWelcomeComplete = async (data: any) => {
        // Save privacy flag
        localStorage.setItem('navigator_privacy_accepted', 'true');
        setShowWelcome(false);

        // If we have user data (name/device), try to update profile
        if (data.userData) {
            // We might not be logged in yet, so we store this in sessionStorage
            // to be picked up by the auth flow later
            sessionStorage.setItem('pending_user_meta', JSON.stringify(data.userData));

            // If we ARE logged in, update immediately (future proofing)
            try {
                const { supabase } = await import('../../services/supabase');
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('profiles').update({
                        first_name: data.userData.firstName,
                        last_name: data.userData.lastName,
                        device_id: data.userData.deviceId
                    }).eq('id', user.id);
                }
            } catch (e) {
                console.error("Failed to update profile", e);
            }
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
                onViewChange={handleViewChange}
                isCoachMode={isCoachMode}
                isEduMode={isEduMode}
            />

            <WelcomeScreen
                isOpen={showWelcome}
                onContinue={handleWelcomeComplete}
                onImportResume={() => { }} // Handled internally or via context if needed
            />

            <main className="w-full pb-16 sm:pb-8 min-h-[60vh]">
                {children}
            </main>

            <Footer />
        </div>
    );
};
