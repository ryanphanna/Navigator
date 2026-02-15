import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false } }
        );

        // 1. Parse Postmark Inbound Webhook
        const body = await req.json();
        const toEmail = body.To || "";
        const fromEmail = body.From || "";
        const subject = body.Subject || "";
        const textBody = body.TextBody || "";
        const htmlBody = body.HtmlBody || "";

        // 2. Extract Token (Format: navigator-TOKEN@inbound.domain.com)
        const tokenMatch = toEmail.match(/navigator-([a-zA-Z0-9]+)@/);
        if (!tokenMatch) {
            console.error("Invalid recipient email format:", toEmail);
            return new Response(JSON.stringify({ error: "Invalid recipient" }), { status: 400 });
        }
        const token = tokenMatch[1];

        // 3. Resolve User
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, subscription_tier")
            .eq("inbound_email_token", token)
            .single();

        if (profileError || !profile) {
            console.error("User not found for token:", token);
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        // Tier Check: Only Pro users can use this feature
        if (profile.subscription_tier !== "pro") {
            console.warn("Blocked ingestion for non-pro user:", profile.id);
            return new Response(JSON.stringify({ error: "Pro subscription required" }), { status: 403 });
        }

        const userId = profile.id;

        // 3b. Volume Limit Check: Prevent spam (Max 50 active feed items)
        const { count: feedCount } = await supabase
            .from("jobs")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId)
            .eq("status", "feed");

        if (feedCount && feedCount >= 50) {
            console.warn("User reached max feed limit:", userId);
            return new Response(JSON.stringify({ error: "Feed full. Resolve existing items first." }), { status: 429 });
        }

        // 4. Fetch User Context (Resumes & Skills) for Triage
        const { data: resumes } = await supabase
            .from("resumes")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);

        const { data: targetJobs } = await supabase
            .from("target_jobs")
            .select("*")
            .eq("user_id", userId)
            .order("date_added", { ascending: false })
            .limit(1);

        // 5. AI Parsing & Triage with Gemini
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        const prompt = `
      You are a specialized Job Ingestion Agent for "Navigator". 
      You just received a job alert email. Your task is to extract job details and triage it for the user.

      USER CONTEXT:
      - Latest Resume: ${resumes?.[0] ? JSON.stringify(resumes[0].content) : "No resume on file."}
      - Career Goals: ${targetJobs?.[0] ? JSON.stringify(targetJobs[0]) : "No specific goals set."}

      EMAIL SUBJECT: ${subject}
      EMAIL BODY:
      ${textBody || "See HTML body if empty"}
      ${htmlBody ? "(HTML content provided)" : ""}

      EXTRACTION RULES:
      1. Extract Job Title, Company, and a clean Job Description.
      2. Find the application URL if present.
      3. Calculate a "Match Score" (0-100) based on the user's resume and goals.
      4. Suggest a status: "feed".
      5. Provide a short "Triage Explanation" (e.g., "High match for transit roles you seek" or "Requires 5+ years experience, might be a stretch").

      Return ONLY a valid JSON object:
      {
        "job_title": "string",
        "company": "string",
        "description": "string (markdown allowed, but keep it clean)",
        "url": "string or null",
        "match_score": number,
        "triage_reasoning": "string"
      }
    `;

        const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!aiResponse.ok) throw new Error("Gemini API call failed");
        const aiData = await aiResponse.json();
        const resultText = aiData.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedJob = JSON.parse(resultText);

        // 6. TTL Cleanup: Remove old "feed" items for this user (7-day window)
        await supabase
            .from("jobs")
            .delete()
            .eq("user_id", userId)
            .eq("status", "feed")
            .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // 7. Insert into Jobs Table
        const { error: insertError } = await supabase.from("jobs").insert({
            user_id: userId,
            job_title: parsedJob.job_title,
            company: parsedJob.company,
            description: parsedJob.description,
            url: parsedJob.url,
            source_type: "email",
            status: "feed",
            analysis: {
                compatibilityScore: parsedJob.match_score,
                reasoning: parsedJob.triage_reasoning,
                distilledJob: {
                    roleTitle: parsedJob.job_title,
                    companyName: parsedJob.company,
                }
            }
        });

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ success: true, jobId: parsedJob.job_title }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Inbound Email Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
