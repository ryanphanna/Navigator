import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeEditor from './ResumeEditor';
import { STORAGE_KEYS, TRACKING_EVENTS } from '../../constants';
import { EventService } from '../../services/eventService';

// Mock dependencies
vi.mock('../../services/eventService', () => ({
    EventService: {
        trackUsage: vi.fn(),
    },
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
        expect(screen.getByText(/Start with your current resume/i)).toBeInTheDocument();
        expect(screen.getByText(/We go beyond keywords/i)).toBeInTheDocument();
    });

    it('triggers file import when "Drop Resume" button is clicked', () => {
        render(<ResumeEditor {...defaultProps} />);

        const dropButton = screen.getByText('Drop Resume');
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(fileInput, 'click');

        fireEvent.click(dropButton);
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

        // When parsing, logic switches to main UI
        // Header button should indicate status
        const headerBtn = screen.getByRole('button', { name: /Parsing.../i });
        expect(headerBtn).toBeInTheDocument();
        expect(headerBtn).toBeDisabled();

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
});
