import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeEditor from './ResumeEditor';
import { STORAGE_KEYS, TRACKING_EVENTS } from '../../constants';
import { EventService } from '../../services/eventService';
import { useResumeContext } from './context/ResumeContext';

// Mock dependencies
vi.mock('../../services/eventService', () => ({
    EventService: {
        trackUsage: vi.fn(),
    },
}));

vi.mock('./context/ResumeContext', () => ({
    useResumeContext: () => ({
        clearImportError: vi.fn(),
    }),
}));

// Mock PageLayout to simplify DOM
vi.mock('../../components/common/PageLayout', () => ({
    PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}));

describe('ResumeEditor', () => {
    const mockOnSave = vi.fn();
    const mockOnImport = vi.fn();

    const defaultProps = {
        resumes: [],
        skills: [],
        onSave: mockOnSave,
        onImport: mockOnImport,
        isParsing: false,
        importError: null,
        importTrigger: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the 3-card empty state when no resumes exist', () => {
        render(<ResumeEditor {...defaultProps} />);

        // Verify 3-card layout headers
        expect(screen.getByText('Foundation')).toBeInTheDocument();
        expect(screen.getByText('Intelligence')).toBeInTheDocument();
        expect(screen.getByText('Upload')).toBeInTheDocument();

        // Verify value prop text
        expect(screen.getByText(/We need your history/i)).toBeInTheDocument();
        expect(screen.getByText(/Our AI processes your data/i)).toBeInTheDocument();
    });

    it('triggers file import when "Upload" zone is clicked', () => {
        render(<ResumeEditor {...defaultProps} />);

        // Find the DropZone container by its title
        const dropZoneTitle = screen.getByText('Upload');
        const dropZone = dropZoneTitle.closest('.group');
        expect(dropZone).not.toBeNull();

        // Scope input selection to the DropZone container to avoid finding the top-level input
        const fileInput = dropZone!.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(fileInput, 'click');

        fireEvent.click(dropZone!);
        expect(clickSpy).toHaveBeenCalled();
    });

    it('triggers file import when input changes', () => {
        render(<ResumeEditor {...defaultProps} />);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(mockOnImport).toHaveBeenCalledWith(file);
    });

    it('switches to manual entry when "Start Fresh" is clicked', () => {
        render(<ResumeEditor {...defaultProps} />);

        const startFreshBtn = screen.getByText('Start Fresh');
        fireEvent.click(startFreshBtn);

        expect(screen.getByText('Professional Summary')).toBeInTheDocument();
        expect(screen.queryByText('Foundation')).not.toBeInTheDocument();
    });

    it('displays loading state when isParsing is true', () => {
        render(<ResumeEditor {...defaultProps} isParsing={true} />);

        // When parsing, logic switches to full-page loading view
        expect(screen.getByText('Analyzing your history...')).toBeInTheDocument();
        expect(screen.getByText(/Intelligence Engine active/i)).toBeInTheDocument();

        // 3-card empty state should be gone
        expect(screen.queryByText('Foundation')).not.toBeInTheDocument();
    });

    it('displays import error when provided in empty state', () => {
        const propsWithError = {
            ...defaultProps,
            importError: 'Failed to parse file'
        };

        render(<ResumeEditor {...propsWithError} />);

        expect(screen.getByText('Failed to parse file')).toBeInTheDocument();

        // Should still show 3 cards as we are in empty state
        expect(screen.getByText('Foundation')).toBeInTheDocument();
    });

    it('tracks usage when saving', async () => {
        vi.useFakeTimers();
        const propsWithResume = {
            ...defaultProps,
            resumes: [{ id: '1', name: 'Test Resume', blocks: [] }]
        };

        render(<ResumeEditor {...propsWithResume} />);

        vi.runAllTimers();

        expect(mockOnSave).toHaveBeenCalled();
        expect(EventService.trackUsage).toHaveBeenCalledWith(TRACKING_EVENTS.RESUMES);

        vi.useRealTimers();
    });

    it('does not render redundant section type badges on entry blocks', () => {
        const propsWithBlocks = {
            ...defaultProps,
            resumes: [{
                id: '1',
                name: 'Test Resume',
                blocks: [{
                    id: 'b1',
                    type: 'work' as const,
                    title: 'Software Engineer',
                    organization: 'Tech Corp',
                    dateRange: '2020-2022',
                    bullets: ['Did stuff'],
                    isVisible: true
                }]
            }]
        };

        render(<ResumeEditor {...propsWithBlocks} />);

        // The section header "Work Experience" should be there
        expect(screen.getAllByText('Work Experience').length).toBeGreaterThan(0);

        // But the badge (which used the same text) should NOT be there as a separate element 
        // with the specific badge styling classes we removed.
        // We can't easily check for classes with getByText, but we can check the count.
        // Previously there would be THREE (header, badge, and select option). 
        // Now there should only be TWO (header and select option).
        expect(screen.getAllByText('Work Experience')).toHaveLength(2);
    });
});
