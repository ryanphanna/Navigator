import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { fetchSafe, readTextSafe } from "./validator.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // 1. CORS & Auth Check
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization')

        // Initialize Supabase to check User
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        // 2. Parse Request
        const { url, source, mode } = await req.json()
        if (!url) throw new Error('Missing URL')

        // 3. Fetch HTML (with SSRF protection including redirect validation)
        const response = await fetchSafe(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (!response.ok) throw new Error(`Failed to fetch site: ${response.status}`)

        // Use safe reader to prevent DoS (max 5MB)
        const html = await readTextSafe(response, 5 * 1024 * 1024)

        // 3.5 Return Text Mode (for Job Analysis)
        if (mode === 'text') {
            // Simple cleanup
            const text = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                .replace(/<[^>]+>/g, "\n") // Replace tags with newlines
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 50000)

            return new Response(JSON.stringify({ text }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 4. Parse based on source
        let jobs: { title: string; url: string; company: string; location: string | null; postedDate: string | null }[] = []

        // Special handling for TTC Early Talent page (simple HTML parsing)
        if (source === 'ttc' && url.includes('Early-Talent')) {
            // This page is just a simple list of job links
            const linkRegex = /<a\s+[^>]*href=["'](https:\/\/career17\.sapsf\.com\/sfcareer\/jobreqcareer\?[^"']+)["'][^>]*>([^<]+)<\/a>/gi
            const dateRegex = /Last Day to Apply:\s*<\/b><\/span><span[^>]*>([^<]+)<\/span>/gi

            let match
            const jobData: { url: string; title: string }[] = []
            const dates: string[] = []

            // Extract all job links
            while ((match = linkRegex.exec(html)) !== null) {
                const jobUrl = match[1]
                let title = match[2].trim()

                // Remove job ID in parentheses if present
                title = title.replace(/\s*\(\d+\)\s*$/, '')

                jobData.push({ url: jobUrl, title })
            }

            // Extract all dates
            let dateMatch
            while ((dateMatch = dateRegex.exec(html)) !== null) {
                dates.push(dateMatch[1].trim())
            }

            // Combine jobs with dates
            jobs = jobData.map((job, index) => ({
                title: job.title,
                url: job.url,
                company: 'Toronto Transit Commission',
                location: 'Toronto, ON',
                postedDate: dates[index] || null
            }))

        } else {
            // For other pages, use Gemini AI parsing
            // Clean HTML (Naive regex cleanup to save tokens)
            const cleanHtml = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                .replace(/<!--([\s\S]*?)-->/gim, "")
                .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "")
                .replace(/\s+/g, " ")
                .substring(0, 30000)

            const apiKey = Deno.env.get('GEMINI_API_KEY')
            if (!apiKey) throw new Error('GEMINI_API_KEY not set')

            const prompt = `
            You are a smart web scraper. Your task is to extract ALL job listings from the provided HTML.

            IMPORTANT INSTRUCTIONS:
            1. Look for job titles in <a> tags, <h3> tags, <div> tags, or any other elements
            2. Job titles often contain words like "Co-op", "Student", "Analyst", "Engineer", etc.
            3. Each job may have an associated closing date (e.g., "Last Day to Apply: 18 January 2026")
            4. Look for links that point to job application pages (often containing "career", "job", "apply", etc.)
            5. If you find a list of jobs (<ul> or <ol> with <li> items), extract each one
            6. The company name might be in the page title, header, or metadata - infer it if not explicit

            Return ONLY a valid JSON array with NO markdown formatting (no backticks, no "json" label).
            
            Schema:
            [
              {
                "title": "Job Title (remove any job ID numbers in parentheses)",
                "url": "absolute URL to job posting (resolve relative paths using base: ${new URL(url).origin})",
                "company": "Company name (inferred from page if needed)",
                "location": "Location or null",
                "postedDate": "Closing/Posted date in ISO format or null"
              }
            ]

            If you find NO jobs, return an empty array: []

            HTML Content:
            ${cleanHtml}
            `

            // Call Gemini via Fetch (Native)
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const aiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!aiResponse.ok) {
                const errText = await aiResponse.text();
                throw new Error(`Gemini Error: ${errText}`);
            }

            const result = await aiResponse.json();
            let text = "";
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
                text = result.candidates[0].content.parts.map((p: { text: string }) => p.text).join('');
            }

            // Clean JSON (remove markdown fences if AI adds them)
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
            jobs = JSON.parse(jsonStr)
        }

        // 5. Return jobs
        return new Response(JSON.stringify(jobs), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
