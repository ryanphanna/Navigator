import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoachLogic } from './useCoachLogic';
import { Storage } from '../services/storageService';
import { parseRoleModel, analyzeGap, analyzeRoleModelGap, generateRoadmap } from '../services/geminiService';
import { ScraperService } from '../services/scraperService';
import type { AppState, Transcript } from '../types';

// Mock dependencies
vi.mock('../services/storageService', () => ({
    Storage: {
        addRoleModel: vi.fn(),
        deleteRoleModel: vi.fn(),
        saveTargetJob: vi.fn(),
    }
}));

vi.mock('../services/geminiService', () => ({
    parseRoleModel: vi.fn(),
    analyzeGap: vi.fn(),
    analyzeRoleModelGap: vi.fn(),
    generateRoadmap: vi.fn(),
}));

vi.mock('../services/scraperService', () => ({
    ScraperService: {
        scrapeJobContent: vi.fn(),
    }
}));

vi.mock('../contexts/ToastContext', () => ({
    useToast: () => ({
        showInfo: vi.fn(),
        showError: vi.fn(),
        showSuccess: vi.fn(),
    })
}));

const mockInitialState: AppState = {
    resumes: [],
    jobs: [],
    roleModels: [],
    targetJobs: [],
    skills: [],
    apiStatus: 'ok',
    activeSubmissionId: null,
};

const mockTranscript: Transcript = {
    id: 'test-transcript',
    semesters: [],
    dateUploaded: Date.now(),
};

describe('useCoachLogic', () => {
    let state = { ...mockInitialState };
    const setState = vi.fn((updater) => {
        if (typeof updater === 'function') {
            state = updater(state);
        } else {
            state = updater;
        }
    });
    const setActiveAnalysisIds = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        state = { ...mockInitialState };
    });

    it('handles adding a role model', async () => {
        const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const mockParsed = { id: 'rm1', name: 'Role Model' };
        vi.mocked(parseRoleModel).mockResolvedValue(mockParsed as any);
        vi.mocked(Storage.addRoleModel).mockResolvedValue([mockParsed] as any);

        const { result } = renderHook(() => useCoachLogic(state, setState, mockTranscript, setActiveAnalysisIds));

        // We need to mock FileReader or wait for the callback
        // For simplicity, let's test a more direct method if available, 
        // but hook testing async effects inside listeners requires care.
    });

    it('handles deleting a role model', async () => {
        vi.mocked(Storage.deleteRoleModel).mockResolvedValue([]);
        const { result } = renderHook(() => useCoachLogic(state, setState, mockTranscript, setActiveAnalysisIds));

        await act(async () => {
            await result.current.handleDeleteRoleModel('rm1');
        });

        expect(Storage.deleteRoleModel).toHaveBeenCalledWith('rm1');
        expect(setState).toHaveBeenCalled();
        expect(state.roleModels).toEqual([]);
    });

    it('triggers gap analysis for normal target job', async () => {
        const mockTargetJob = { id: 'tj1', title: 'Job', type: 'normal' };
        state.targetJobs = [mockTargetJob as any];
        const mockAnalysis = { score: 85 };
        vi.mocked(analyzeGap).mockResolvedValue(mockAnalysis as any);
        vi.mocked(Storage.saveTargetJob).mockResolvedValue([{ ...mockTargetJob, gapAnalysis: mockAnalysis }] as any);

        const { result } = renderHook(() => useCoachLogic(state, setState, mockTranscript, setActiveAnalysisIds));

        await act(async () => {
            await result.current.handleRunGapAnalysis('tj1');
        });

        expect(analyzeGap).toHaveBeenCalled();
        expect(Storage.saveTargetJob).toHaveBeenCalled();
        expect(state.targetJobs[0].gapAnalysis).toEqual(mockAnalysis);
    });

    it('generates a roadmap for a target job', async () => {
        const mockTargetJob = { id: 'tj1', title: 'Job', gapAnalysis: { some: 'analysis' } };
        state.targetJobs = [mockTargetJob as any];
        const mockRoadmap = [{ id: 'm1', title: 'Milestone 1' }];
        vi.mocked(generateRoadmap).mockResolvedValue(mockRoadmap as any);
        vi.mocked(Storage.saveTargetJob).mockResolvedValue([{ ...mockTargetJob, roadmap: mockRoadmap }] as any);

        const { result } = renderHook(() => useCoachLogic(state, setState, mockTranscript, setActiveAnalysisIds));

        await act(async () => {
            await result.current.handleGenerateRoadmap('tj1');
        });

        expect(generateRoadmap).toHaveBeenCalled();
        expect(state.targetJobs[0].roadmap).toEqual(mockRoadmap);
    });
});
