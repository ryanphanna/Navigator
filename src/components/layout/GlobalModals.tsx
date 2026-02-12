import React, { Suspense } from 'react';
import { AuthModal } from '../AuthModal';
import { SettingsModal } from '../SettingsModal';
import { UpgradeModal } from '../UpgradeModal';
import { SkillInterviewModal } from '../skills/SkillInterviewModal';
import type { UserTier } from '../../types/app';

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
    handleInterviewComplete: () => void;
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
        <>
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
        </>
    );
};
