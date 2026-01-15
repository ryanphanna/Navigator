import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. SECURITY GUARD CHECK (Authentication)
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
            return new Response(JSON.stringify({ error: 'Unauthorized: You must be logged in.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 1.5 CHECK SUBSCRIPTION TIER (The "VIP List")
        // This safely gates the API costs by only allowing 'pro' or 'admin' users to use the server-side API key.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

        if (profileError || !profile || (profile.subscription_tier !== 'pro' && profile.subscription_tier !== 'admin' && profile.subscription_tier !== 'free')) {
            // If they are not even 'free' (legacy?), default to free behavior but ensure they exist.
            // Actually, we enforce PRO for this particular proxy in the ORIGINAL plan, 
            // BUT the new plan is "Rate Limits for All".
            // So we allow 'free' users to pass this check, but they will hit the rate limit.
        }

        // 1.8 RATE LIMITING (The "Circuit Breaker")
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!serviceRoleKey) throw new Error('Service Role Key missing')

        const adminSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey,
            { auth: { persistSession: false } }
        )

        const today = new Date().toISOString().split('T')[0]
        const limits: Record<string, number> = { free: 4, pro: 50, admin: 1000 }
        const tier = profile?.subscription_tier ?? 'free'
        const userLimit = limits[tier] || 4

        const { data: usageData } = await adminSupabase
            .from('daily_usage')
            .select('request_count')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()

        const currentUsage = usageData?.request_count ?? 0

        if (currentUsage >= userLimit) {
            return new Response(JSON.stringify({
                error: `Daily Limit Reached (${currentUsage}/${userLimit}). Upgrade to Pro for more capability.`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 429,
            })
        }

        // Increment Usage
        await adminSupabase.from('daily_usage').upsert({
            user_id: user.id,
            date: today,
            request_count: currentUsage + 1
        })

        // 2. PARSE REQUEST
        const { payload, modelName, generationConfig } = await req.json()

        // 3. RETRIEVE MASTER KEY (Server-side Secret)
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set in Edge Function secrets.')
        }

        // 4. CALL AI
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: modelName || "gemini-2.0-flash",
            generationConfig
        })

        const result = await model.generateContent(payload)
        const text = result.response.text()

        // Return the text result
        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
