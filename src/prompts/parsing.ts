

export const PARSING_PROMPTS = {
  RESUME_PARSE: (extractedText: string | null = null) => `
    Analyze this resume content. 
    Break it down into discrete "Experience Blocks". 
    For each job, education, or project, create a block.

    CRITICAL SAFETY CHECK:
    If this document is NOT a resume/CV (e.g. it is a receipt, a random photo, spam, hate speech, or offensive content), 
    return a single block with type="other", title="INVALID_DOCUMENT", and put the reason in the bullets.
    
    Return a JSON Array of objects with this schema:
    {
      "type": "summary" | "work" | "education" | "project" | "skill" | "other",
      "title": "Job Title or Degree",
      "organization": "Company or School Name",
      "dateRange": "e.g. 2020-2022",
      "bullets": ["bullet point 1", "bullet point 2"]
    }
  ${extractedText ? `\nRESUME CONTENT:\n${extractedText}` : ''}`,

  JOB_LISTING_PARSE: (cleanHtml: string, baseUrl: string) => `
    You are a smart scraper. Extract job listings from this HTML. 
    
    CRITICAL INSTRUCTIONS:
    1. Look for lists of jobs, tables, or repeated "card" elements.
    2. For TTC/SAP sites, jobs might be in a "current opportunities" section or a search results table.
    3. Tables often have "Job Title", "Date", "Location" columns.
    4. If you see a "Search Jobs" button but NO results, return an empty array (do not hallucinate).
    5. Extract the REAL link (href). Resolving relative URLs against "${baseUrl}".
    
    Return ONLY a JSON array. No markdown.
    
    Schema:
    [
      {
        "title": "string (The clear job title)",
        "url": "string (The absolute URL to the specific job details)",
        "company": "string (Default to 'TTC' if not found)",
        "location": "string (Toronto)",
        "postedDate": "string (ISO date or 'Recently')"
      }
    ]

    HTML Content:
    ${cleanHtml}
  `,

  ROLE_MODEL_PARSE: () => `
    You are a Career Path Analyst. Analyze this LinkedIn profile (or resume) of a "Role Model".
    Extract their core career progression, top skills, and industry patterns.

    TASK:
    1. EXTRACT: 
       - Name (if visible)
       - Headline (e.g. "Staff Engineer at Google")
       - Organization (Most recent company)
       - Skills (Top 10 most relevant skills mentioned)
       - Career Snapshot (Briefly summarize their "climb" - e.g. "Started in QA, transitioned to Dev, then Management")
    
    Return JSON with:
    {
      "name": "string",
      "headline": "string",
      "organization": "string",
      "topSkills": ["string"],
      "careerSnapshot": "string",
      "rawTextSummary": "string (A clean, slightly condensed version of their experience)"
    }
  `
};
