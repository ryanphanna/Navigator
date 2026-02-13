import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobStorage } from './jobStorage';
import { Vault, getUserId } from './storageCore';
import { STORAGE_KEYS } from '../../constants';
import type { SavedJob } from '../../types';

vi.mock('./storageCore', () => ({
    Vault: {
        getSecure: vi.fn(),
        setSecure: vi.fn()
    },
    getUserId: vi.fn()
}));

vi.mock('../supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })),
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            select: vi.fn(() => ({ order: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })) }))
        })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }))
        }
    }
}));

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const createMockJob = (id: string, status: SavedJob['status'] = 'saved'): SavedJob => ({
    id,
    position: 'Developer',
    company: 'Tech',
    status,
    dateAdded: Date.now(),
    description: 'A test job description',
    resumeId: 'resume-1'
});

describe('JobStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add a job to local storage', async () => {
        const mockJob = createMockJob(VALID_UUID);
        vi.mocked(Vault.getSecure).mockResolvedValue([]);
        vi.mocked(getUserId).mockResolvedValue('test-user');

        await JobStorage.addJob(mockJob);

        expect(Vault.setSecure).toHaveBeenCalledWith(STORAGE_KEYS.JOBS_HISTORY, [mockJob]);
    });

    it('should update a job in local storage', async () => {
        const oldJob = createMockJob(VALID_UUID);
        const updatedJob: SavedJob = { ...oldJob, status: 'applied' };
        vi.mocked(Vault.getSecure).mockResolvedValue([oldJob]);
        vi.mocked(getUserId).mockResolvedValue('test-user');

        await JobStorage.updateJob(updatedJob);

        expect(Vault.setSecure).toHaveBeenCalledWith(STORAGE_KEYS.JOBS_HISTORY, [updatedJob]);
    });

    it('should delete a job from local storage', async () => {
        const mockJob = createMockJob(VALID_UUID);
        vi.mocked(Vault.getSecure).mockResolvedValue([mockJob]);
        vi.mocked(getUserId).mockResolvedValue('test-user');

        await JobStorage.deleteJob(VALID_UUID);

        expect(Vault.setSecure).toHaveBeenCalledWith(STORAGE_KEYS.JOBS_HISTORY, []);
    });
});
