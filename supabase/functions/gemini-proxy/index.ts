
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
        analysis: 'gemini-2.5-pro',
    },
    admin: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-3-pro',
    },
    tester: {
        extraction: 'gemini-2.0-flash',
        analysis: 'gemini-3-pro',
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

        // Fetch user's subscription tier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error("Profile lookup error:", sanitizeLog(profileError));
            throw new Error('Failed to retrieve user profile')
        }

        const userTier = profile.subscription_tier || 'free';

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

        // 4. CALL GEMINI API VIA FETCH
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...payload,
                generationConfig
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", response.status, sanitizeLog(errorText));
            throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Extract text from standard Gemini response structure
        let text = "";
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            text = data.candidates[0].content.parts.map((p: { text: string }) => p.text).join('');
        }

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Gemini Proxy Error:", sanitizeLog(message));
        return new Response(JSON.stringify({ error: `Edge Function Error: ${message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so client gets the error message JSON
        })
    }
}

Deno.serve(handler)
