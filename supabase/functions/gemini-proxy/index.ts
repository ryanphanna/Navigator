
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_LOG_LENGTH = 200;
const sanitizeLog = (val: unknown) => {
    const str = String(val).replace(/[\n\r]/g, ' ');
    return str.length > MAX_LOG_LENGTH ? str.substring(0, MAX_LOG_LENGTH) + '...' : str;
};

export const TIER_MODELS: Record<string, { extraction: string; analysis: string }> = {
    free: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-2.0-flash',
    },
    plus: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-2.0-flash',
    },
    pro: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-1.5-pro',
    },
    admin: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-1.5-pro',
    },
    tester: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-1.5-pro',
    }
};

export const handler = async (req: Request) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. AUTHORIZATION & USER TIER CHECK
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Fetch user's subscription tier and flags
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier, is_admin, is_tester')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error("Profile lookup error:", sanitizeLog(profileError));
            throw new Error('Failed to retrieve user profile')
        }

        let userTier = profile.subscription_tier || 'free';
        if (profile.is_admin) userTier = 'admin';
        else if (profile.is_tester) userTier = 'tester';

        // 1b. PRE-EXECUTION LIMIT CHECK
        const { data: limitCheck, error: limitError } = await supabase.rpc('check_analysis_limit', {
            p_user_id: user.id,
            p_source_type: 'manual'
        });

        if (limitError) {
            console.error("Limit check error:", sanitizeLog(limitError));
        } else if (limitCheck && !limitCheck.allowed) {
            return new Response(JSON.stringify({
                error: "Limit reached",
                reason: limitCheck.reason,
                used: limitCheck.used,
                limit: limitCheck.limit
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 429, // Correct Rate Limit status code
            });
        }

        // 2. PARSE REQUEST & RESOLVE MODEL
        // We no longer trust the client to provide modelName
        const { payload, task = "analysis", generationConfig } = await req.json()

        // Validate task
        const validTasks = ['extraction', 'analysis'];
        const safeTask = validTasks.includes(task) ? task : 'analysis';

        const tierConfig = TIER_MODELS[userTier] || TIER_MODELS.free;
        const modelName = safeTask === 'extraction' ? tierConfig.extraction : tierConfig.analysis;

        console.log(`User ${sanitizeLog(user.id)} (${sanitizeLog(userTier)}) performing ${sanitizeLog(safeTask)} using ${sanitizeLog(modelName)}`);

        // 3. RETRIEVE API KEY
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            console.error("GEMINI_API_KEY missing in secrets");
            throw new Error('GEMINI_API_KEY not set in Edge Function secrets.')
        }

        // 4. PESSIMISTIC QUOTA INCREMENT
        let quotaIncremented = false;
        if (safeTask === 'analysis') {
            const { error: incError } = await supabase.rpc('increment_analysis_count', {
                p_user_id: user.id
            });
            if (incError) {
                console.error("Analysis increment error:", sanitizeLog(incError));
                throw new Error(`Failed to increment analysis quota: ${incError.message}`);
            }
            quotaIncremented = true;
        }

        // 5. CALL GEMINI API VIA FETCH
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let response;
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...payload,
                    generationConfig,
                    // Inject a safety rule for all analysis tasks
                    systemInstruction: safeTask === 'analysis' ? {
                        role: 'system',
                        parts: [{ text: "CRITICAL: First validate if the provided content is a job description or job-related. If it is NOT a job, your entire response must be: {\"error\": \"not_a_job\"}. Otherwise, proceed with the requested analysis." }]
                    } : undefined
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
            }
        } catch (apiError: any) {
            console.error("API execution failure:", sanitizeLog(apiError.message));

            // REFUND Logic
            if (quotaIncremented) {
                const { error: decError } = await supabase.rpc('decrement_analysis_count', {
                    p_user_id: user.id
                });
                if (decError) console.error("Refund failed:", sanitizeLog(decError));
            }
            throw apiError; // Re-throw to be caught by main catch block
        }

        const data = await response.json();

        // Extract text from standard Gemini response structure
        let text = "";
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            text = data.candidates[0].content.parts.map((p: { text: string }) => p.text).join('');
        }

        // 6. CONTENT VALIDATION & REFUND
        // If the AI returns a "not_a_job" flag (which we instruct it to do in prompts), we refund the credit
        if (safeTask === 'analysis' && (text.includes('"error": "not_a_job"') || text.includes('not_a_job'))) {
            console.warn(`Analysis rejected by AI (not a job) for user ${user.id}`);
            if (quotaIncremented) {
                const { error: decError } = await supabase.rpc('decrement_analysis_count', {
                    p_user_id: user.id
                });
                if (decError) console.error("Refund failed on rejection:", sanitizeLog(decError));
            }
            // Transform to a standard error format the client expects
            return new Response(JSON.stringify({
                error: "not_a_job",
                message: "This content doesn't look like a valid job description."
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 7. TRACK USAGE (Tokens only, as analysis was already incremented)
        const totalTokens = (data.usageMetadata?.totalTokenCount) || 0;
        if (totalTokens > 0) {
            const { error: usageError } = await supabase.rpc('track_usage', {
                p_tokens: totalTokens,
                p_is_analysis: false // Always false here as we handled it pessimistically
            });
            if (usageError) console.error("Usage tracking error:", sanitizeLog(usageError));
        }

        return new Response(JSON.stringify({ text, usage: data.usageMetadata }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Gemini Proxy Error:", sanitizeLog(message));
        return new Response(JSON.stringify({ error: `Edge Function Error: ${message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500, // Correctly return an error status code
        })
    }
}

Deno.serve(handler)
