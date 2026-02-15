import { supabase } from './supabase';

export interface UsageLimitResult {
    allowed: boolean;
    reason?: 'free_limit_reached' | 'daily_limit_reached' | 'rate_limit';
    used?: number;
    limit?: number;
}

export interface UsageStats {
    tier: string;
    totalAnalyses: number;
    todayAnalyses: number;
    totalAICalls: number; // Cumulative AI events
    limit: number;
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
            .select('subscription_tier, job_analyses_count, total_ai_calls, inbound_email_token')
            .eq('id', userId)
            .single();

        const { count: todayCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('date_added', new Date().toISOString().split('T')[0]);

        const tier = profile?.subscription_tier || 'free';
        const totalAnalyses = profile?.job_analyses_count || 0;
        const totalAICalls = profile?.total_ai_calls || 0;

        return {
            tier,
            totalAnalyses,
            todayAnalyses: todayCount || 0,
            totalAICalls,
            limit: tier === 'free' ? 3 : Infinity,
            inboundEmailToken: profile?.inbound_email_token
        };
    } catch (err) {
        console.error('Error fetching usage stats:', err);
        return {
            tier: 'free',
            totalAnalyses: 0,
            todayAnalyses: 0,
            totalAICalls: 0,
            limit: 3
        };
    }
};
