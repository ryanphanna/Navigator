import { bench, describe } from 'vitest';
import React, { useMemo } from 'react';
import { render } from '@testing-library/react';

// Simplified version of the component for testing performance
const UnmemoizedProvider = ({ value, children }: any) => {
    return (
        <div data-testid="unmemoized" value={{ ...value, showUpgradeModal: !!value.upgradeModalData }}>
            {children}
        </div>
    );
};

const MemoizedProvider = ({ value, children }: any) => {
    const {
        jobs, activeJobId, activeJob, isLoading, usageStats,
        upgradeModalData, nudgeJob, setActiveJobId, handleUpdateJob,
        handleJobCreated, handleDraftApplication, handleDeleteJob,
        handleAnalyzeJob, handlePromoteFromFeed, handleSaveFromFeed,
        closeUpgradeModal, dismissNudge
    } = value;

    const contextValue = useMemo(() => ({
        jobs, activeJobId, activeJob, isLoading, usageStats,
        upgradeModalData, nudgeJob, setActiveJobId, handleUpdateJob,
        handleJobCreated, handleDraftApplication, handleDeleteJob,
        handleAnalyzeJob, handlePromoteFromFeed, handleSaveFromFeed,
        closeUpgradeModal, dismissNudge,
        showUpgradeModal: !!upgradeModalData,
    }), [
        jobs, activeJobId, activeJob, isLoading, usageStats,
        upgradeModalData, nudgeJob, setActiveJobId, handleUpdateJob,
        handleJobCreated, handleDraftApplication, handleDeleteJob,
        handleAnalyzeJob, handlePromoteFromFeed, handleSaveFromFeed,
        closeUpgradeModal, dismissNudge
    ]);

    return (
        <div data-testid="memoized" value={contextValue as any}>
            {children}
        </div>
    );
};

const dummyValue = {
    jobs: [],
    activeJobId: null,
    activeJob: undefined,
    isLoading: false,
    usageStats: {},
    upgradeModalData: null,
    nudgeJob: null,
    setActiveJobId: () => {},
    handleUpdateJob: async () => {},
    handleJobCreated: async () => {},
    handleDraftApplication: async () => {},
    handleDeleteJob: () => {},
    handleAnalyzeJob: async () => ({} as any),
    handlePromoteFromFeed: async () => {},
    handleSaveFromFeed: async () => {},
    closeUpgradeModal: () => {},
    dismissNudge: () => {},
};

describe('JobContext Provider Render Performance', () => {
    bench('Unmemoized Provider Render', () => {
        render(<UnmemoizedProvider value={dummyValue}><div>Test</div></UnmemoizedProvider>);
    });

    bench('Memoized Provider Render', () => {
        render(<MemoizedProvider value={dummyValue}><div>Test</div></MemoizedProvider>);
    });
});
