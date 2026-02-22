export const COVER_LETTER_PROMPTS = {
    COVER_LETTER: {
        VARIANTS: {
            v1_direct: `
            You are a Strategic Career Architect. Write a professional, high-impact, and SUBSTANTIAL cover letter.
            
            INSTRUCTIONS:
            - **Grounding Rule**: Use ONLY evidence from the provided Resume Blocks. Do NOT invent skills or experience.
            - **Professional Depth**: The letter must feel substantial and thoroughly persuasive. Avoid a "template" feel by weaving evidence naturally into a narrative of why you are the best fit.
            - **Metric Uniqueness**: Strictly forbid repeating the same specific metric/stat (e.g. "98% accuracy") more than once in the entire document.
            - **Vocabulary Audit**: Avoid generic "filler" phrasing (e.g. "look no further", "passion for"). Standard professional terms like "highly motivated" are acceptable.
            - Structure:
              1. THE HOOK: Open with a compelling reason why this specific role and company align with your professional trajectory.
              2. THE EVIDENCE: Connect your most relevant and impactful achievements directly to the job's core challenges. Group these logically to demonstrate mastery.
              3. STRATEGIC ALIGNMENT: Articulate your unique value proposition—how your background makes you a uniquely safe and high-ROI choice for this specific team.
              4. THE CLOSE: A brief, confident call to action.
            - Tone: Professional, authoritative yet human.
            - Avoid cliches like "I am writing to apply..." start fresher.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `,
            v2_storytelling: `
            You are a Career Architect helping a candidate stand out with narrative. Write a detailed, compelling letter that tells a professional story.
            
            INSTRUCTIONS:
            - **Grounding Rule**: Use ONLY evidence from the provided Resume Blocks. Do NOT invent skills or experience.
            - **Substance & Narrative**: Develop a narrative arc that connects your professional journey to the company's future. Avoid brevity; aim for a complete, persuasive story.
            - **Metric Uniqueness**: Strictly forbid repeating the same specific metric/stat more than once.
            - **Vocabulary Audit**: Avoid generic filler (e.g. "it is with great honor").
            - DO NOT start with "I am writing to apply". Start with a statement about the company's mission or a specific problem they are solving.
            - Narrative Arc: "I've always been interested in [Industry/Problem]... which is why [Company] caught my eye."
            - Then pivot to: "In my role at [Previous Org], I faced a similar challenge..." (Insert impactful Resume Evidence woven into the story).
            - Strategic Fit: Connect the themes of your career to the future of the company.
            - Ending: "I'd love to bring this energy to [Company]."
            - Tone: Enthusiastic, genuine, slightly less formal than a standard corporate letter.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `,
            v3_experimental_pro: `
            You are a senior executive writing a cover letter. Write a sophisticated, high-level strategic letter with significant depth.
            Focus on value proposition, ROI, and strategic alignment, not just skills.
            - **Grounding Rule**: Use ONLY evidence from the provided Resume Blocks.
            - **Strategic Depth**: Use the core pillars of your experience to demonstrate long-term value and leadership potential.
            - **Metric Uniqueness**: Do not repeat specific stats.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `
        },
        GENERATE: (template: string, jobDescription: string, resumeText: string, tailoringInstructions: string[], additionalContext?: string, trajectoryContext?: string, bucketStrategy?: string) => `
    ${template}
 
    ${bucketStrategy ? `CANDIDATE NARRATIVE STRATEGY:
    ${bucketStrategy}
    ` : ''}

    JOB DESCRIPTION:
    ${jobDescription}
 
    MY EXPERIENCE:
    ${resumeText}
 
    ${trajectoryContext ? `MY CAREER CONTEXT (Goals & Patterns):
    ${trajectoryContext}
    (Context: This includes my 12-month goals and established application patterns. Use this to ensure the letter aligns with my professional identity.)` : ''}

    STRATEGY:
    ${tailoringInstructions.join("\n")}

    ${additionalContext ? `MY ADDITIONAL CONTEXT (Important):
    ${additionalContext}
    Include this context naturally if relevant to the job requirements.` : ''}

    ${tailoringInstructions.includes("CRITIQUE_FIX") ? `
    IMPORTANT - REVISION INSTRUCTIONS:
    The previous draft was reviewed by a hiring manager. Fix these specific issues:
    ${additionalContext} 
    (Note: The text above is the critique feedback, not personal context in this case).
    ` : ''}
    
    FINAL CHECK:
    - Ensure no (BLOCK_ID) tags remain in the output.
    - REFLECT: Does this letter repeat any specific metric more than once? If yes, remove the repetition.
    - REFLECT: Does it sound like an AI? Remove "look no further" or excessive "passion for".
  `
    },

    CRITIQUE_COVER_LETTER: (jobDescription: string, coverLetter: string, resumeContext: string) => `
    You are a strict technical hiring manager. Review this cover letter against the candidate's actual resume for the job below.
    
    JOB:
    ${jobDescription.substring(0, 5000)}

    CANDIDATE RESUME (Source of Truth):
    ${resumeContext}

    CANDIDATE LETTER:
    ${coverLetter}

    TASK:
    1. WOULD YOU INTERVIEW THIS PERSON based on this letter and their resume?
       - Be extremely critical. If the letter claims achievements NOT found in the resume, it is a "Reject".
    
    CRITIQUE CRITERIA:
    1. TECHNICAL FIDELITY (The "Checkboxes"):
       - **Truthfulness**: Does the letter claim ANY achievements not found in the resume? (Hallucinations = Reject).
       - **Metric Uniqueness**: Does it repeat the same specific stat twice? (Repetition = Weak).
       - **Grounding**: Is every core claim traceable to a specific block in the resume?
    
    2. NARRATIVE QUALITY (The "Persuasion"):
       - **Substance & Depth**: Does the letter have enough professional "meat" to be persuasive, or is it just a few generic sentences?
       - **Evidence Quality**: Does it leverage the *most impactful* resume evidence for this specific role's challenges?
       - **Strategic Alignment**: Does it articulate a clear value proposition—how the candidate's journey makes them a safe, high-ROI choice?
       - **Storytelling vs. Listing**: Is it a cohesive narrative or just a bullet-to-paragraph mapping? It must feel "human-written" and tailored.

    Return specific JSON:
    {
      "decision": "Reject" | "Weak" | "Average" | "Strong" | "Exceptional",
      "strengths": ["string"],
      "feedback": ["string (Be specific about what to fix to get a 'Strong' or 'Exceptional' decision)"],
      "hallucinationAlerts": ["string (Specific claims not supported by the resume)"]
    }
    `,
};
