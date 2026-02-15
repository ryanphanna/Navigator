import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { UserProvider } from './UserContext';
import { supabase } from '../services/supabase';

// Mock Supabase
vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(),
    },
}));

describe('UserContext Security Check', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.clearAllMocks();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it('should NOT log sensitive profile data to the console', async () => {
        const mockUser = { id: 'test-user-id', email: 'test@example.com' };
        const mockProfileData = {
            subscription_tier: 'pro',
            is_admin: true,
            is_tester: false,
            sensitive_info: 'SUPER_SECRET',
        };

        // Mock getSession to return a user
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { session: { user: mockUser } },
            error: null,
        } as any);

        // Mock database query to return profile data
        const mockFrom = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: mockProfileData,
                        error: null,
                    }),
                }),
            }),
        });
        vi.mocked(supabase.from).mockImplementation(mockFrom);

        render(
            <UserProvider>
                <div>Test Child</div>
            </UserProvider>
        );

        // Wait for the async processUser to complete
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('profiles');
        });

        // Check if sensitive data was logged
        // The vulnerable code does: console.log('[Auth Debug] SUCCESS - Profile Data:', data);
        const sensitiveLogCall = consoleLogSpy.mock.calls.find(call =>
            call[0] && call[0].includes('[Auth Debug] SUCCESS - Profile Data:')
        );

        // We expect the sensitive data NOT to be logged
        expect(sensitiveLogCall).toBeUndefined();
    });
});
