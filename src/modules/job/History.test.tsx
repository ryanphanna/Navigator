import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import History from './History';
import type { SavedJob } from '../../types';

describe('History', () => {
  const mockJobs: SavedJob[] = [
    {
      id: '1',
      company: 'Google',
      position: 'Software Engineer',
      description: 'Build amazing things',
      resumeId: 'resume-1',
      dateAdded: Date.now(),
      status: 'saved',
      analysis: {
        distilledJob: {
          companyName: 'Google',
          roleTitle: 'Software Engineer',
          keySkills: ['React', 'TypeScript'],
          coreResponsibilities: ['Build features'],
          applicationDeadline: null,
        },
        compatibilityScore: 85,
        bestResumeProfileId: 'resume-1',
        reasoning: 'Good fit',
        strengths: ['Strong React skills'],
        weaknesses: ['Needs more backend'],
        tailoringInstructions: ['Highlight React'],
        recommendedBlockIds: ['block-1'],
      },
      fitScore: 85,
    },
    {
      id: '2',
      company: 'Meta',
      position: 'Frontend Developer',
      description: 'Work on UI',
      resumeId: 'resume-1',
      dateAdded: Date.now() - 1000,
      status: 'applied',
      analysis: {
        distilledJob: {
          companyName: 'Meta',
          roleTitle: 'Frontend Developer',
          keySkills: ['JavaScript', 'CSS'],
          coreResponsibilities: ['UI development'],
          applicationDeadline: null,
        },
        compatibilityScore: 70,
        bestResumeProfileId: 'resume-1',
        reasoning: 'Decent fit',
        strengths: ['Good CSS knowledge'],
        weaknesses: ['Limited experience'],
        tailoringInstructions: ['Emphasize frontend work'],
        recommendedBlockIds: ['block-2'],
      },
      fitScore: 70,
    },
  ];

  const mockOnSelectJob = vi.fn();
  const mockOnDeleteJob = vi.fn();

  it('should render empty state when no jobs', () => {
    render(
      <History
        jobs={[]}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('should render job list', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('should filter jobs by search query', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type 'Google' in search
    fireEvent.change(searchInput, { target: { value: 'Google' } });

    // Should show Google job
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();

    // Should not show Meta job
    expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
  });

  it('should filter by company name', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'Meta' } });

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('should be case insensitive', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'GOOGLE' } });

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('should show all jobs when search is cleared', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Filter
    fireEvent.change(searchInput, { target: { value: 'Google' } });
    expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();

    // Clear filter
    fireEvent.change(searchInput, { target: { value: '' } });

    // Both should show
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('should call onSelectJob when job is clicked', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    const jobCard = screen.getByText('Software Engineer').closest('div');
    if (jobCard) {
      fireEvent.click(jobCard);
    }

    expect(mockOnSelectJob).toHaveBeenCalledWith('1');
  });

  it('should display fit scores', () => {
    render(
      <History
        jobs={mockJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    expect(screen.getByText('85% Match')).toBeInTheDocument();
    expect(screen.getByText('70% Match')).toBeInTheDocument();
  });

  it('should show analyzing and error states in saved filter', () => {
    const statusJobs: SavedJob[] = [
      { id: '3', status: 'analyzing', position: 'Analyzing Role', company: 'Startup', dateAdded: Date.now(), description: '...', resumeId: 'r1' },
      { id: '4', status: 'error', position: 'Failed Role', company: 'Startup', dateAdded: Date.now(), description: '...', resumeId: 'r1' },
    ];

    render(
      <History
        jobs={statusJobs}
        onSelectJob={mockOnSelectJob}
        onDeleteJob={mockOnDeleteJob}
      />
    );

    // Should be in 'Saved' filter by default (or when selected)
    // Count for 'Saved' and 'All' should be 2
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Analyzing Role')).toBeInTheDocument();
    expect(screen.getByText('Failed Role')).toBeInTheDocument();

    // Check for status labels
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
