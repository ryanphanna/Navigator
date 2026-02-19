import React, { Suspense } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useJobContext } from '../../modules/job/context/JobContext';
import { useModal } from '../../contexts/ModalContext';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

// Lazy load heavy modals to improve lighter initial bundle
const AuthModal = lazyWithRetry(() => import('../AuthModal').then(m => ({ default: m.AuthModal })));
import { SettingsModal } from '../SettingsModal';
const UpgradeModal = lazyWithRetry(() => import('../UpgradeModal').then(m => ({ default: m.UpgradeModal })));

export const GlobalModals: React.FC = () => {
    const { user, userTier, isTester, isAdmin, simulatedTier, setSimulatedTier } = useUser();
    const { upgradeModalData, closeUpgradeModal, usageStats } = useJobContext();
    const { activeModal, modalData, closeModal } = useModal();
    const { setView } = useGlobalUI();

    React.useEffect(() => {
        const handleNavigate = () => {
            setView('plans');
        };
        window.addEventListener('navigate-to-plans', handleNavigate);
        return () => window.removeEventListener('navigate-to-plans', handleNavigate);
    }, [setView]);

    return (
        <Suspense fallback={null}>
            {activeModal === 'AUTH' && (
                <AuthModal isOpen={true} onClose={closeModal} featureContext={modalData?.feature} />
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
