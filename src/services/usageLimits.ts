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
    todayAnalyses: number;
    weekAnalyses: number;
    todayEmails: number;
    monthInterviews: number;
    roleModelCount: number;
    totalAICalls: number;
    analysisLimit: number;
    analysisPeriod: string;
    emailLimit: number;
    roleModelLimit: number;
    interviewLimit: number;
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
 * Check if user can start a new interview
 */
export const checkInterviewLimit = async (userId: string): Promise<UsageLimitResult> => {
    try {
        const stats = await getUsageStats(userId);
        if (stats.tier === 'admin' || stats.tier === 'tester') return { allowed: true };

        if (stats.monthInterviews >= stats.interviewLimit) {
            return {
                allowed: false,
                reason: 'rate_limit',
                used: stats.monthInterviews,
                limit: stats.interviewLimit
            };
        }
        return { allowed: true };
    } catch (err) {
        console.error('Exception checking interview limit:', err);
        return { allowed: true };
    }
};

/**
 * Check if user can add a new role model
 */
export const checkRoleModelLimit = async (userId: string): Promise<UsageLimitResult> => {
    try {
        const stats = await getUsageStats(userId);
        if (stats.tier === 'admin' || stats.tier === 'tester') return { allowed: true };

        if (stats.roleModelCount >= stats.roleModelLimit) {
            return {
                allowed: false,
                reason: 'free_limit_reached',
                used: stats.roleModelCount,
                limit: stats.roleModelLimit
            };
        }
        return { allowed: true };
    } catch (err) {
        console.error('Exception checking role model limit:', err);
        return { allowed: true };
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

        // Monthly interview count: count the START of sessions, not individual analyses
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);

        const { count: monthInterviewCount } = await supabase
            .from('logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('event_type', ['interview_generation', 'unified_skill_interview_generation', 'skill_interview_generation'])
            .gte('created_at', firstOfMonth.toISOString());

        const { count: roleModelCount } = await supabase
            .from('role_models')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        let tier = profile?.subscription_tier || 'free';
        if (profile?.is_admin) tier = 'admin';
        else if (profile?.is_tester) tier = 'tester';

        const totalAICalls = profile?.total_ai_calls || 0;

        const { count: todayEmailCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('source_type', 'email')
            .gte('date_added', new Date().toISOString().split('T')[0]);

        const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['free'];

        // Determine the analysis limit
        const analysisLimit = (limits as any).WEEKLY_ANALYSES || (limits as any).DAILY_ANALYSES || (limits as any).TOTAL_ANALYSES || 0;

        return {
            tier: tier as UserTier,
            todayAnalyses: todayCount || 0,
            weekAnalyses: weekCount || 0,
            todayEmails: todayEmailCount || 0,
            monthInterviews: monthInterviewCount || 0,
            roleModelCount: roleModelCount || 0,
            totalAICalls,
            analysisLimit,
            analysisPeriod: (limits as any).ANALYSES_PERIOD || 'weekly',
            emailLimit: limits.DAILY_EMAILS,
            roleModelLimit: (limits as any).ROLE_MODELS || 0,
            interviewLimit: (limits as any).SKILLS_INTERVIEWS || 0,
            inboundEmailToken: tier === 'free' ? undefined : profile?.inbound_email_token
        };
    } catch (err) {
        console.error('Error fetching usage stats:', err);
        return {
            tier: 'free',
            todayAnalyses: 0,
            weekAnalyses: 0,
            todayEmails: 0,
            monthInterviews: 0,
            roleModelCount: 0,
            totalAICalls: 0,
            analysisLimit: 3,
            analysisPeriod: 'lifetime',
            emailLimit: 0,
            roleModelLimit: 0,
            interviewLimit: 0,
            inboundEmailToken: undefined
        };
    }
};
