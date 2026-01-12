import type { ResumeProfile, SavedJob, ExperienceBlock } from '../types';

const STORAGE_KEYS = {
    RESUMES: 'jobfit_resumes_v2', // Bump version key to avoid conflicts
    JOBS: 'jobfit_jobs_history',
};

export const getResumes = (): ResumeProfile[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.RESUMES);

    // Default Empty State
    const defaultState: ResumeProfile[] = [{
        id: 'master',
        name: 'Master Experience',
        blocks: []
    }];

    if (!stored) {
        // Check for legacy data from v1
        const legacy = localStorage.getItem('jobfit_resumes');
        if (legacy) {
            try {
                const parsedLegacy = JSON.parse(legacy);
                if (parsedLegacy.length > 0 && parsedLegacy[0].content) {
                    // Convert legacy text blob into a single "Legacy Block"
                    const legacyBlock: ExperienceBlock = {
                        id: crypto.randomUUID(),
                        type: 'other',
                        title: 'Unsorted Experience',
                        organization: 'Legacy Import',
                        dateRange: '',
                        bullets: [parsedLegacy[0].content],
                        isVisible: true
                    };
                    return [{ id: 'master', name: 'Master Experience', blocks: [legacyBlock] }];
                }
            } catch {
                // ignore legacy parse errors
            }
        }
        return defaultState;
    }

    try {
        const parsed = JSON.parse(stored);
        return parsed.length > 0 ? parsed : defaultState;
    } catch {
        return defaultState;
    }
};

export const saveResumes = (resumes: ResumeProfile[]) => {
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
};

export const getJobs = (): SavedJob[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.JOBS);
    return stored ? JSON.parse(stored) : [];
};

export const saveJobs = (jobs: SavedJob[]) => {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
};

export const addJob = (job: SavedJob) => {
    const jobs = getJobs();
    const updated = [job, ...jobs]; // Newest first
    saveJobs(updated);
    return updated;
};

export const updateJob = (updatedJob: SavedJob) => {
    const jobs = getJobs();
    const updated = jobs.map(j => j.id === updatedJob.id ? updatedJob : j);
    saveJobs(updated);
    return updated;
};

export const deleteJob = (id: string) => {
    const jobs = getJobs();
    const updated = jobs.filter(j => j.id !== id);
    saveJobs(updated);
    return updated;
};
