import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
      <MemoryRouter>
        <History
          jobs={[]}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('should render job list', () => {
    render(
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('should filter jobs by search query', () => {
    render(
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
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
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'Meta' } });

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('should be case insensitive', () => {
    render(
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    fireEvent.change(searchInput, { target: { value: 'GOOGLE' } });

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('should show all jobs when search is cleared', () => {
    render(
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
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
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
    );

    const jobCard = screen.getByText('Software Engineer').closest('div');
    if (jobCard) {
      fireEvent.click(jobCard);
    }

    expect(mockOnSelectJob).toHaveBeenCalledWith('1');
  });

  it('should display fit scores', () => {
    render(
      <MemoryRouter>
        <History
          jobs={mockJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
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
      <MemoryRouter>
        <History
          jobs={statusJobs}
          onSelectJob={mockOnSelectJob}
          onDeleteJob={mockOnDeleteJob}
        />
      </MemoryRouter>
    );

    // Should be in 'Saved' filter by default (or when selected)
    // Count for 'Saved' and 'All' should be 2
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Processing Job...')).toBeInTheDocument();
    expect(screen.getByText('Incomplete Analysis')).toBeInTheDocument();

    // Check for status labels
    expect(screen.getByText('Finding your fit...')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should display progress bar with custom message', () => {
    const progressJob: SavedJob = {
      id: '5',
      company: 'Startup',
      position: 'Analyzing Role',
      description: '...',
      resumeId: 'r1',
      dateAdded: Date.now(),
      status: 'analyzing',
      progress: 45,
      progressMessage: 'Extracting skills...'
    };

    const mockOnSelect = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <MemoryRouter>
        <History
          jobs={[progressJob]}
          onSelectJob={mockOnSelect}
          onDeleteJob={mockOnDelete}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Extracting skills...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should restrict access when analyzing', () => {
    const analyzingJob: SavedJob = {
      id: '6',
      company: 'Analyzing Corp',
      position: 'Processing Role',
      description: '...',
      resumeId: 'r1',
      dateAdded: Date.now(),
      status: 'analyzing',
      progress: 50
    };

    const mockOnSelect = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <MemoryRouter>
        <History
          jobs={[analyzingJob]}
          onSelectJob={mockOnSelect}
          onDeleteJob={mockOnDelete}
        />
      </MemoryRouter>
    );

    // Click card should not select
    const card = screen.getByText('Processing Job...').closest('div');
    if (card) {
      fireEvent.click(card);
    }
    expect(mockOnSelect).not.toHaveBeenCalled();

    // View Analysis button should not be present
    expect(screen.queryByText('View Analysis')).not.toBeInTheDocument();

    // Delete button should be hidden (not disabled, as it only renders when !isAnalyzing conditionally or isn't assigned a title)
    const deleteBtn = screen.queryByTitle('Delete');
    expect(deleteBtn).not.toBeInTheDocument();
  });
});
