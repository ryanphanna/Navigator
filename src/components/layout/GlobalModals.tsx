import React, { Suspense, lazy } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useJobContext } from '../../modules/job/context/JobContext';
import { useSkillContext } from '../../modules/skills/context/SkillContext';
import { useModal } from '../../contexts/ModalContext';

// Lazy load heavy modals to improve lighter initial bundle
const AuthModal = lazy(() => import('../AuthModal').then(m => ({ default: m.AuthModal })));
import { SettingsModal } from '../SettingsModal';
const UpgradeModal = lazy(() => import('../UpgradeModal').then(m => ({ default: m.UpgradeModal })));
const SkillInterviewModal = lazy(() => import('../skills/SkillInterviewModal').then(m => ({ default: m.SkillInterviewModal })));

export const GlobalModals: React.FC = () => {
    const { user, userTier, isTester, isAdmin, simulatedTier, setSimulatedTier } = useUser();
    const { upgradeModalData, closeUpgradeModal, usageStats } = useJobContext();
    const { interviewSkill, setInterviewSkill, handleInterviewComplete } = useSkillContext();
    const { activeModal, modalData, closeModal } = useModal();

    return (
        <Suspense fallback={null}>
            {activeModal === 'AUTH' && (
                <AuthModal isOpen={true} onClose={closeModal} />
            )}

            {user && activeModal === 'SETTINGS' && (
                <SettingsModal
                    isOpen={true}
                    onClose={closeModal}
                    user={user}
                    userTier={userTier}
                    isTester={isTester}
                    isAdmin={isAdmin}
                    simulatedTier={simulatedTier}
                    onSimulateTier={setSimulatedTier}
                    usageStats={usageStats}
                />
            )}

            {interviewSkill && (activeModal === 'INTERVIEW' || !activeModal) && (
                <SkillInterviewModal
                    onClose={() => setInterviewSkill(null)}
                    skillName={interviewSkill}
                    onComplete={handleInterviewComplete}
                />
            )}

            {(activeModal === 'UPGRADE' || upgradeModalData) && (
                <UpgradeModal
                    limitInfo={upgradeModalData}
                    onClose={() => {
                        closeModal();
                        closeUpgradeModal();
                    }}
                    initialView={modalData?.initialView}
                    userTier={userTier}
                />
            )}
        </Suspense>
    );
};
