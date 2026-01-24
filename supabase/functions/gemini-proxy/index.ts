const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Gemini Proxy Function Started (Deno.serve)");

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. AUTHORIZATION CHECK
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        // 2. PARSE REQUEST
        const { payload, modelName = "gemini-2.0-flash", generationConfig } = await req.json()

        // 3. RETRIEVE API KEY
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            console.error("GEMINI_API_KEY missing in secrets");
            throw new Error('GEMINI_API_KEY not set in Edge Function secrets.')
        }

        // 4. CALL GEMINI API VIA FETCH (No SDK Dependencies)
        // using gemini-2.0-flash by default
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        console.log(`Proxying to ${modelName}...`);

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
            console.error("Gemini API Error:", response.status, errorText);
            throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Extract text from standard Gemini response structure
        let text = "";
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            text = data.candidates[0].content.parts.map((p: any) => p.text).join('');
        }

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("Link Proxy Error:", error.message);
        return new Response(JSON.stringify({ error: `Edge Function Error: ${error.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so client gets the error message JSON
        })
    }
})
