import React, { Suspense, lazy } from 'react';
import type { UserTier, CustomSkill } from '../../types';

// Lazy load heavy modals to improve lighter initial bundle
const AuthModal = lazy(() => import('../AuthModal').then(m => ({ default: m.AuthModal })));
import { SettingsModal } from '../SettingsModal';
const UpgradeModal = lazy(() => import('../UpgradeModal').then(m => ({ default: m.UpgradeModal })));
const SkillInterviewModal = lazy(() => import('../skills/SkillInterviewModal').then(m => ({ default: m.SkillInterviewModal })));

interface GlobalModalsProps {
    showAuth: boolean;
    setShowAuth: (show: boolean) => void;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    showUpgradeModal: any;
    setShowUpgradeModal: (show: any) => void;
    interviewSkill: string | null;
    setInterviewSkill: (skill: string | null) => void;
    user: any;
    userTier: UserTier;
    isTester: boolean;
    isAdmin: boolean;
    simulatedTier: UserTier | null;
    setSimulatedTier: (tier: UserTier | null) => void;
    handleInterviewComplete: (proficiency: CustomSkill['proficiency'], evidence: string) => void;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
    showAuth,
    setShowAuth,
    showSettings,
    setShowSettings,
    showUpgradeModal,
    setShowUpgradeModal,
    interviewSkill,
    setInterviewSkill,
    user,
    userTier,
    isTester,
    isAdmin,
    simulatedTier,
    setSimulatedTier,
    handleInterviewComplete
}) => {
    return (
        <Suspense fallback={null}>
            {showAuth && (
                <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
            )}

            {showSettings && (
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
            )}

            {interviewSkill && (
                <SkillInterviewModal
                    onClose={() => setInterviewSkill(null)}
                    skillName={interviewSkill}
                    onComplete={handleInterviewComplete}
                />
            )}

            {showUpgradeModal && (
                <UpgradeModal
                    limitInfo={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(null)}
                />
            )}
        </Suspense>
    );
};
