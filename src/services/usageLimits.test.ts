import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAnalysisLimit, getUsageStats, incrementAnalysisCount } from './usageLimits';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn(),
    },
}));

describe('checkAnalysisLimit', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return allowed=true when usage limit is not reached', async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: { allowed: true }, error: null } as any);

        const result = await checkAnalysisLimit(userId);

        expect(result).toEqual({ allowed: true });
        expect(supabase.rpc).toHaveBeenCalledWith('check_analysis_limit', { p_user_id: userId });
    });

    it('should return denial reason when usage limit is reached', async () => {
        const deniedResponse = { allowed: false, reason: 'daily_limit_reached' };
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: deniedResponse, error: null } as any);

        const result = await checkAnalysisLimit(userId);

        expect(result).toEqual(deniedResponse);
    });

    it('should fail open (allow=true) when Supabase returns an error', async () => {
        const error = { message: 'Database error' };
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error } as any);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await checkAnalysisLimit(userId);

        expect(result).toEqual({ allowed: true });
        expect(consoleSpy).toHaveBeenCalledWith('Error checking usage limit:', error);

        consoleSpy.mockRestore();
    });

    it('should fail open (allow=true) when an exception occurs', async () => {
        const error = new Error('Network failure');
        vi.mocked(supabase.rpc).mockRejectedValueOnce(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await checkAnalysisLimit(userId);

        expect(result).toEqual({ allowed: true });
        expect(consoleSpy).toHaveBeenCalledWith('Exception checking usage limit:', error);

        consoleSpy.mockRestore();
    });
});

describe('incrementAnalysisCount', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call rpc with correct arguments', async () => {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ error: null } as any);

        await incrementAnalysisCount(userId);

        expect(supabase.rpc).toHaveBeenCalledWith('increment_analysis_count', { p_user_id: userId });
    });

    it('should log error when Supabase returns error', async () => {
        const error = { message: 'Database error' };
        vi.mocked(supabase.rpc).mockResolvedValueOnce({ error } as any);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        await incrementAnalysisCount(userId);

        expect(consoleSpy).toHaveBeenCalledWith('Error incrementing analysis count:', error);

        consoleSpy.mockRestore();
    });

    it('should log exception when rpc throws', async () => {
        const error = new Error('Network failure');
        vi.mocked(supabase.rpc).mockRejectedValueOnce(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        await incrementAnalysisCount(userId);

        expect(consoleSpy).toHaveBeenCalledWith('Exception incrementing analysis count:', error);

        consoleSpy.mockRestore();
    });
});

describe('getUsageStats', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return usage stats correctly for pro tier', async () => {
        // Mock chain for profiles query
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                subscription_tier: 'pro',
                is_admin: false,
                is_tester: false,
                job_analyses_count: 50,
                total_ai_calls: 100,
                inbound_email_token: 'token-123'
            }
        });
        const mockSelectProfile = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });

        // Mock chain for jobs query (count)
        const mockGte = vi.fn().mockResolvedValue({ count: 5 });
        const mockEqJobs = vi.fn().mockReturnValue({ gte: mockGte });
        const mockSelectJobs = vi.fn().mockReturnValue({ eq: mockEqJobs });

        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'profiles') return { select: mockSelectProfile } as any;
            if (table === 'jobs') return { select: mockSelectJobs } as any;
            return {} as any;
        });

        const result = await getUsageStats(userId);

        expect(result).toEqual({
            tier: 'pro',
            totalAnalyses: 50,
            todayAnalyses: 5,
            totalAICalls: 100,
            limit: Infinity,
            inboundEmailToken: 'token-123'
        });
    });

    it('should return admin tier and unlimited limit for admin users', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                subscription_tier: 'free',
                is_admin: true,
                is_tester: false,
                job_analyses_count: 5,
                total_ai_calls: 10,
                inbound_email_token: 'admin-token'
            }
        });
        const mockSelectProfile = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });
        const mockGte = vi.fn().mockResolvedValue({ count: 0 });
        const mockEqJobs = vi.fn().mockReturnValue({ gte: mockGte });
        const mockSelectJobs = vi.fn().mockReturnValue({ eq: mockEqJobs });

        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'profiles') return { select: mockSelectProfile } as any;
            if (table === 'jobs') return { select: mockSelectJobs } as any;
            return {} as any;
        });

        const result = await getUsageStats(userId);

        expect(result.tier).toBe('admin');
        expect(result.limit).toBe(Infinity);
    });

    it('should return tester tier and unlimited limit for tester users', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                subscription_tier: 'free',
                is_admin: false,
                is_tester: true,
                job_analyses_count: 5,
                total_ai_calls: 10,
                inbound_email_token: 'tester-token'
            }
        });
        const mockSelectProfile = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });
        const mockGte = vi.fn().mockResolvedValue({ count: 0 });
        const mockEqJobs = vi.fn().mockReturnValue({ gte: mockGte });
        const mockSelectJobs = vi.fn().mockReturnValue({ eq: mockEqJobs });

        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'profiles') return { select: mockSelectProfile } as any;
            if (table === 'jobs') return { select: mockSelectJobs } as any;
            return {} as any;
        });

        const result = await getUsageStats(userId);

        expect(result.tier).toBe('tester');
        expect(result.limit).toBe(Infinity);
    });

    it('should return default stats on error', async () => {
        vi.mocked(supabase.from).mockImplementation(() => {
            throw new Error('DB Error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = await getUsageStats(userId);

        expect(result).toEqual({
            tier: 'free',
            totalAnalyses: 0,
            todayAnalyses: 0,
            totalAICalls: 0,
            limit: 3
        });
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching usage stats:', expect.any(Error));

        consoleSpy.mockRestore();
    });
});
