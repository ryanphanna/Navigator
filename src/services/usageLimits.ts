import { supabase } from './supabase';
import type { UserTier } from '../types/app';
import { PLAN_LIMITS } from '../constants';

export interface UsageLimitResult {
    allowed: boolean;
    reason?: 'free_limit_reached' | 'daily_limit_reached' | 'weekly_limit_reached' | 'rate_limit';
    used?: number;
    limit?: number;
}

export interface UsageStats {
    tier: UserTier;
    totalAnalyses: number;
    todayAnalyses: number;
    weekAnalyses: number;
    todayEmails: number;
    totalAICalls: number; // Cumulative AI events
    analysisLimit: number;
    analysisPeriod: string;
    emailLimit: number;
    inboundEmailToken?: string;
}

/**
 * Check if user can create a new job analysis
 */
export const checkAnalysisLimit = async (userId: string): Promise<UsageLimitResult> => {
    try {
        const { data, error } = await supabase.rpc('check_analysis_limit', {
            p_user_id: userId
        });

        if (error) {
            console.error('Error checking usage limit:', error);
            return { allowed: true }; // Fail open - don't block users on error
        }

        return data as UsageLimitResult;
    } catch (err) {
        console.error('Exception checking usage limit:', err);
        return { allowed: true }; // Fail open
    }
};

/**
 * Increment the analysis count after successful job creation
 */
export const incrementAnalysisCount = async (userId: string): Promise<void> => {
    try {
        const { error } = await supabase.rpc('increment_analysis_count', {
            p_user_id: userId
        });

        if (error) {
            console.error('Error incrementing analysis count:', error);
        }
    } catch (err) {
        console.error('Exception incrementing analysis count:', err);
    }
};

/**
 * Get current usage statistics for display
 */
export const getUsageStats = async (userId: string): Promise<UsageStats> => {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, is_admin, is_tester, job_analyses_count, total_ai_calls, inbound_email_token')
            .eq('id', userId)
            .single();

        const { count: todayCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('date_added', new Date().toISOString().split('T')[0]);

        // Weekly count: jobs created in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: weekCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('date_added', weekAgo.toISOString());

        let tier = profile?.subscription_tier || 'free';
        if (profile?.is_admin) tier = 'admin';
        else if (profile?.is_tester) tier = 'tester';

        const totalAnalyses = profile?.job_analyses_count || 0;
        const totalAICalls = profile?.total_ai_calls || 0;

        const { count: todayEmailCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('source_type', 'email')
            .gte('date_added', new Date().toISOString().split('T')[0]);

        const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['free'];

        // Determine the analysis limit based on tier period
        let analysisLimit: number;
        if ('TOTAL_ANALYSES' in limits) {
            analysisLimit = limits.TOTAL_ANALYSES;
        } else if ('WEEKLY_ANALYSES' in limits) {
            analysisLimit = limits.WEEKLY_ANALYSES;
        } else if ('DAILY_ANALYSES' in limits) {
            analysisLimit = limits.DAILY_ANALYSES as number;
        } else {
            analysisLimit = 3; // Fallback
        }

        return {
            tier: tier as UserTier,
            totalAnalyses,
            todayAnalyses: todayCount || 0,
            weekAnalyses: weekCount || 0,
            todayEmails: todayEmailCount || 0,
            totalAICalls,
            analysisLimit,
            analysisPeriod: limits.ANALYSES_PERIOD,
            emailLimit: limits.DAILY_EMAILS,
            inboundEmailToken: tier === 'free' ? undefined : profile?.inbound_email_token
        };
    } catch (err) {
        console.error('Error fetching usage stats:', err);
        return {
            tier: 'free',
            totalAnalyses: 0,
            todayAnalyses: 0,
            weekAnalyses: 0,
            todayEmails: 0,
            totalAICalls: 0,
            analysisLimit: 3,
            analysisPeriod: 'lifetime',
            emailLimit: 0,
            inboundEmailToken: undefined
        };
    }
};
