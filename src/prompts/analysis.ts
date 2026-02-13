import { CONTENT_VALIDATION } from '../constants';

export const ANALYSIS_PROMPTS = {
  JOB_FIT_ANALYSIS: {
    DEFAULT: (jobDescription: string, resumeContext: string) => `
    You are a ruthless technical recruiter. Your job is to screen candidates for this role.
    
    INPUT DATA:
    1. RAW JOB TEXT (Scraped): 
    "${jobDescription.substring(0, CONTENT_VALIDATION.MAX_JOB_DESCRIPTION_LENGTH)}"

    2. MY EXPERIENCE PROFILES (Blocks with IDs):
    ${resumeContext}

    TASK:
    1. DISTILL: Extract the messy job text into a structured format.
    2. ANALYZE: Compare the Job to my experience blocks with extreme scrutiny. 
    3. PROFICIENCY: For 'requiredSkills', categorize based on language:
       - 'learning': Familiarity, exposure, want to learn, junior-level intro.
       - 'comfortable': Proficient, strong understanding, 2-5 years, core part of job.
       - 'expert': Advanced, lead, deep knowledge, 5-8+ years, architect-level.
    4. MATCH BREAKDOWN: Identify key strengths (PROVEN skills only) and weaknesses (MISSING or UNDER-LEVELLED requirements).
    5. SCORE: Rate compatibility (0-100). Be harsh. matching < 50% = reject.
    6. TAILORING: 
       - Select the specific BLOCK_IDs that are VITAL to this job. Exclude anything irrelevant.
       - Provide concise instructions. Don't say "Highlight your skills." Say "Rename 'Software Engineer' to 'React Developer' to match line 4 of job description."
    7. PERSONA: Address the user directly as "You". Do NOT refer to "The Candidate".
    
    Return ONLY JSON.
  `,
    TECHNICAL: (jobDescription: string, resumeContext: string) => `
    You are a Hiring Manager for a highly skilled role (Engineering, Trades, Medical, or Specialized Tech). 
    Your job is to screen candidates for this hard-skill requirement job.

    INPUT DATA:
    "${jobDescription.substring(0, CONTENT_VALIDATION.MAX_JOB_DESCRIPTION_LENGTH)}"
    
    CANDIDATE PROFILE:
    ${resumeContext}

    CRITICAL ANALYSIS RULES (SKILLED MODE):
    1. PROOF OVER PASSION: Ignore "fast learner". Look for specific certifications, tools, or years of practice.
    2. HARD SKILL MATCH: If the job needs "Welding" or "Python" or "Phlebotomy", and they don't have it, it's a GAP.
    3. EXPERIENCE LEVEL: Do they have real-world experience?
    
    TASK:
    1. DISTILL requirements.
    2. ANALYZE fit using the rules above.
    3. MATCH BREAKDOWN:
       - Strengths: Must be backed by specific tools/licenses/metrics.
       - Weaknesses: Call out missing specific hard skills (e.g. "Missing Forklift Certification").
    4. SCORE: Rate compatibility (0-100). 
    5. TAILORING:
       - Be extremely specific. e.g. "Change 'Helped on site' to 'Operated Excavator for 3 years'."
    
    Return ONLY JSON.
    `
  },

  TAILOR_EXPERIENCE_BLOCK: (jobDescription: string, blockTitle: string, blockOrg: string, blockBullets: string[], instructions: string[]) => `
    You are an expert resume writer. 
    Rewrite the bullet points for this specific job experience to perfectly match the target job description.

    TARGET JOB:
    ${jobDescription.substring(0, 3000)}

    MY EXPERIENCE BLOCK:
    Title: ${blockTitle}
    Company: ${blockOrg}
    Original Bullets:
    ${blockBullets.map(b => `- ${b}`).join('\n')}

    TAILORING INSTRUCTIONS (Strategy):
    ${instructions.join('\n')}

    TASKS:
    1. Rewrite the bullets to use keywords from the Target Job.
    2. Shift the focus to relevant skills (e.g. if job needs "Leadership", emphasize leading the team).
    3. Quantify impact where possible.
    4. Keep the same number of bullets (or fewer if some are irrelevant).
    5. Tone: Action-oriented, professional, high-impact.
    
    Return ONLY a JSON array of strings: ["bullet 1", "bullet 2"]
    `,

  TAILORED_SUMMARY: (jobDescription: string, resumeContext: string) => `
    You are an expert resume writer. 
    Write a 2-3 sentence "Professional Summary" for the top of my resume.
    
    TARGET JOB:
    ${jobDescription.substring(0, 5000)}

    MY BACKGROUND:
    ${resumeContext}

    INSTRUCTIONS:
    - Pitch me as the perfect candidate for THIS specific role.
    - Use keywords from the job description.
    - Keep it concise, punchy, and confident (no "I believe", just facts).
    - **CRITICAL**: Do NOT return "N/A" or empty text. If the resume is weak, spin it as a "Aspiring [Role Name]" or "motivated professional".
    - Return a JSON object: { "summary": "Text..." }
    `,

  COVER_LETTER: {
    VARIANTS: {
      v1_direct: `
            You are an expert copywriter. Write a professional cover letter.
            
            INSTRUCTIONS:
            - Structure:
              1. THE HOOK: Open strong. Mention the specific role/company and ONE key reason you fit.
              2. THE EVIDENCE: Connect 1-2 specific achievements from my resume directly to their hardest requirements.
              3. THE CLOSE: Brief, confident call to action.
            - Tone: Professional but conversational (human), not robotic.
            - Avoid cliches like "I am writing to apply..." start fresher.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `,
      v2_storytelling: `
            You are a career coach helping a candidate stand out. Write a cover letter that tells a compelling story.
            
            INSTRUCTIONS:
            - DO NOT start with "I am writing to apply". Start with a statement about the company's mission or a specific problem they are solving.
            - Narrative Arc: "I've always been passionate about [Industry/Problem]... which is why [Company] caught my eye."
            - Then pivot to: "In my role at [Previous Org], I faced a similar challenge..." (Insert Resume Evidence).
            - Ending: "I'd love to bring this energy to [Company]."
            - Tone: Enthusiastic, genuine, slightly less formal than a standard corporate letter.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `,
      v3_experimental_pro: `
            You are a senior executive writing a cover letter. Write a sophisticated, high-level strategic letter.
            Focus on value proposition and ROI, not just skills.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `
    },
    GENERATE: (template: string, jobDescription: string, resumeText: string, tailoringInstructions: string[], additionalContext?: string, trajectoryContext?: string) => `
    ${template}
 
    JOB DESCRIPTION:
    ${jobDescription}
 
    MY EXPERIENCE:
    ${resumeText}
 
    ${trajectoryContext ? `MY LONG-TERM CAREER GOAL & PROGRESS:
    ${trajectoryContext}
    (Context: Mention how this current role fits into your 12-month trajectory if it makes for a stronger narrative.)` : ''}

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
    
    FINAL CHECK: Ensure no (BLOCK_ID) tags remain in the output.
  `
  },

  CRITIQUE_COVER_LETTER: (jobDescription: string, coverLetter: string) => `
    You are a strict technical hiring manager. Review this cover letter for the job below.

    JOB:
    ${jobDescription.substring(0, 5000)}

    CANDIDATE LETTER:
    ${coverLetter}

    TASK:
    1. Would you interview this person based *only* on the letter?
    2. Score it 0-100. (50 is average, 75 is strong, 90+ is perfect).
    
    CRITIQUE CRITERIA:
    - Does it have a strong "Hook" (referencing the company/role specifically) or is it generic?
    - Is it just repeating the resume? (Bad) vs Telling a story? (Good)
    - Is it concise?

    3. List 3 strengths.
    4. List 3 specific improvements needed to make it a "Must Hire".

    Return specific JSON:
    {
      "score": number, 
      "decision": "interview" | "reject" | "maybe",
      "strengths": ["string"],
      "feedback": ["string"]
    }
    `,

  SUGGEST_SKILLS: (resumeContext: string) => `
    You are an expert career consultant. Based on your resume profiles below, extract a comprehensive list of professional skills.
    
    YOUR EXPERIENCE PROFILES:
    ${resumeContext}
    
    TASK:
    - Identify technical skills, soft skills, tools, and methodologies mentioned or implied.
    - Use industry standard terms that commonly appear on job postings.
    - For EACH skill, provide a concise 1-sentence description explaining what it means in practical terms.
    - Example: {"name": "Retail Operations", "description": "Managing daily store operations including inventory, staff scheduling, and customer flow"}
    - Example: {"name": "Stakeholder Management", "description": "Building and maintaining relationships with internal and external partners"}
    - Focus on high-value skills important for your job matching.
    
    Return ONLY a JSON array of objects: [{"name": "Skill Name", "description": "Brief explanation"}]
    `,

  SKILL_VERIFICATION: (skillName: string, proficiency: string) => `
    You are a technical interviewer verifying a candidate's claim of being "${proficiency}" in "${skillName}".
    
    Generate 3 specific, falsifiable "I have..." statements that a VALID ${proficiency} user would agree with.
    
    CONSTRAINTS:
    - Write in **PLAIN ENGLISH** (geared to commoners).
    - Max 15 words per statement.
    - NO corporate jargon.
    - **AVOID** generic claims about "introducing tools", "saving money", or "efficiency" unless specific to the skill.
    - Focus on **HOW** the work is done and **WHAT** specific problems are solved.
    
    GUIDELINES by Level:
    - Learning: I know the basics and how to start.
    - Comfortable: I can do the work without help.
    - Expert: I can fix complex problems and teach others.
    
    EXAMPLES for "React" (Expert):
    - "I have fixed slow-loading pages by stopping unnecessary re-renders."
    - "I have built a system to manage app data without extra libraries."
    - "I have set up server-side rendering to make the app load faster."
    
    TASK:
    Generate 3 statements for "${skillName}" at "${proficiency}" level.
    Return ONLY a JSON array of strings.
    `,

  GAP_ANALYSIS: (roleModelContext: string, userProfileContext: string, academicContext?: string) => `
    You are a Strategic Career Architect. Your task is to perform a high-resolution Gap Analysis between your current profile and the collective patterns of your "Role Models".

    ROLE MODEL PATTERNS:
    ${roleModelContext}

    YOUR PROFILE (Current):
    ${userProfileContext}

    ${academicContext ? `ACADEMIC BACKGROUND (Transcript):
    ${academicContext}` : ''}
    
    TASK:
    1. IDENTIFY GAPS: Compare the Role Models' career paths and top skills to your experience.
    2. REVERSE-ENGINEER PATHS: Identify "Strategic Moves" or "Career Jumps" common across role models. Look for timing (e.g., "pivoted after 2 years"), company types (e.g., "moved to a startup to get senior title"), and ladder logic.
    3. QUANTIFY: For each major gap, provide "Actionable Evidence" — specific, measurable projects or milestones you should complete.
    4. STRATEGY: 
       - Avoid generic advice like "Learn React".
       - Say "Build a full-stack e-commerce app using React and Stripe to prove you can handle production-ready payment flows."
    5. **STRICT RULE**: FOCUS on hard technical skills, tools, and certifications for the skill gaps section.
    
    Return JSON with this schema:
    {
      "careerTrajectoryGap": "string (High-level summary of path differences)",
      "strategicPathPatterns": [
        {
          "title": "string (e.g., 'The Mid-Stage Startup Leap')",
          "description": "string (Explain the pattern/jump seen across models)",
          "timing": "string (e.g., 'Year 3-5')",
          "prevalence": "string (e.g., 'Seen in 4/5 Role Models')"
        }
      ],
      "topSkillGaps": [
        {
          "skill": "string",
          "importance": 1-5,
          "gapDescription": "string",
          "actionableEvidence": [
            {
              "type": "project" | "metric" | "certification" | "tool",
              "task": "string",
              "metric": "string (The proof of success)",
              "tools": ["string"],
              "resumeBullet": "Specifically written XYZ bullet for a resume (e.g. 'Engineered X using Y to deliver Z')"
            }
          ]
        }
      ],
      "estimatedTimeToBridge": "string (e.g. 6-12 months)"
    }
  `,

  ROLE_MODEL_GAP_ANALYSIS: (roleModelContext: string, userProfileContext: string) => `
    You are a Strategic Career Architect analyzing a "Role Model Emulation" path.
    You are NOT comparing the user to a generic job description. You are comparing them to a specific person's actual history.

    ROLE MODEL PROFILE (The Goal):
    ${roleModelContext}

    YOUR PROFILE (Current):
    ${userProfileContext}

    TASK:
    Compare the User's qualifications against the Role Model's achievements to create an actionable "Emulation Plan".
    - Look for "Leap Points": When did the role model get their big break? (e.g. "After 2 years as Analyst, they jumped to Manager")
    - Look for "Education Gaps": Do they have a Masters? Certs?
    - Look for "Experience Gaps": Did they work at "Tier 1" companies? Specific roles the user skipped?

    OUTPUT JSON (Strictly matching GapAnalysisResult):
    {
      "careerTrajectoryGap": "A narrative comparison of their speed/seniority vs yours. e.g. 'They reached VP in 8 years, you are on track for 10.'",
      "strategicPathPatterns": [
        { "title": "The specific move", "description": "Why it mattered", "timing": "Role Model Year X", "prevalence": "High Impact" }
      ],
      "topSkillGaps": [
        { 
          "skill": "Skill Name", 
          "importance": 5, 
          "gapDescription": "Why you need it", 
          "actionableEvidence": [
            { 
              "type": "project", 
              "task": "Build X", 
              "metric": "Prove Y", 
              "tools": ["Tool A"],
              "resumeBullet": "Specifically written XYZ bullet for a resume (e.g. 'Engineered X using Y to deliver Z')" 
            }
          ] 
        }
      ],
      "estimatedTimeToBridge": "e.g. 18-24 months",
      "dateGenerated": ${Date.now()}
    }
  `,

  FILTER_HARD_SKILLS: (gapAnalysisData: string) => `
    You are a Skill Filter AI. Your job is to take a Gap Analysis and filter out any "Soft Skills" while RETAINING the "Strategic Path Patterns".

    GAP ANALYSIS DATA:
    ${gapAnalysisData}

    CRITICAL RULES:
    1. CATEGORIZE skills in 'topSkillGaps' by adding a 'category' field:
       - 'technical': Hard skills, languages, frameworks.
       - 'soft': Interpersonal, leadership, communication.
       - 'methodology': Agile, Scrum, specific processes.
    2. RETAIN ALL 'strategicPathPatterns' and 'careerTrajectoryGap' content.
    3. Do NOT delete skills. Categorize them so the UI can filter them.
    4. REWRITE tasks to be specific if they are too vague.

    Return the same JSON schema, but add "category" to each item in "topSkillGaps".
  `,

  GENERATE_ROADMAP: (gapAnalysis: string) => `
    You are a Strategic Career Architect. Your task is to transform a Gap Analysis into a structured 12-month Roadmap.

    GAP ANALYSIS DATA:
    ${gapAnalysis}

    TASK:
    1. DISTRIBUTE: Take the "Actionable Evidence" items from the Gap Analysis and distribute them across a 12-month timeline.
    2. SEQUENCING: Prioritize foundational skills first. 
    3. BALANCE: Ensure a realistic workload (not everything in month 1 or month 12).
    4. SCHEMA: Return a JSON object with a "milestones" array.
    5. PERSONA: Speak directly to "You" in the milestone descriptions.

    Return JSON with this schema:
    {
      "milestones": [
        {
          "id": "string",
          "month": 1-12,
          "title": "string (Short, punchy)",
          "type": "project" | "metric" | "certification" | "tool",
          "task": "string",
          "metric": "string",
          "tools": ["string"],
          "linkedSkill": "string (The skill name this addresses)"
        }
      }
    }
  `,


  GRAD_SCHOOL_ELIGIBILITY: (transcriptText: string, targetProgram: string) => `
    You are a Graduate Admissions Consultant. Analyze this transcript for eligibility into a specific university program.
    You must be extremely specific to the named institution (e.g. if they ask for Waterloo, look for Waterloo-specific requirements).

    TRANSCRIPT SUMMARY:
    ${transcriptText}

    TARGET PROGRAM & UNIVERSITY:
    ${targetProgram}

    TASK:
    1. RESEARCH prerequisites (mandatory courses, volunteer hours, tests like GRE/GMAT) for THIS specific program.
    2. MAPPING: Match the user's transcript courses against these prerequisites.
    3. GPA BENCHMARK: Compare the user's average against the typical competitive intake for this specific program.
    4. ADMISSION PROBABILITY: Estimate (High, Medium, Low).

    Return JSON:
    {
      "probability": "High" | "Medium" | "Low",
      "analysis": "string (Summary of fit)",
      "gpaVerdict": "string (e.g. 'Strong')",
      "gpaContext": "string (e.g. 'Your 85% is in the top decile for Waterloo Planning')",
      "gpaBenchmark": {
        "userGPA": "string (e.g. '85%')",
        "typicalIntake": "string (e.g. '80-82%')",
        "standing": "Safe" | "Competitive" | "Reach"
      },
      "prerequisites": [
        {
          "requirement": "string (e.g. 'Intro to Stats')",
          "status": "met" | "missing" | "in-progress",
          "mapping": "string (e.g. 'MATH 101 - A+')",
          "description": "string (Briefly explain the requirement)"
        }
      ],
      "weaknesses": ["string"],
      "recommendations": ["string"]
    }
  `,

  COURSE_SKILL_EXTRACTION: (coursesList: string) => `
    You are a Skills Taxonomist. Analyze this list of university courses and extract skills.
    
    CRITICAL: Distinguish between "Hard Skills" (Technical, Tools, Subject Matter) and "Soft Skills" (Transferable, Interpersonal).

    COURSES:
    ${coursesList}

    TASK:
    1. Infer skills based on course titles & level.
    2. Categorize each skill strictly as 'hard' or 'soft'.
    3. Estimate proficiency based on course level.

    Return JSON:
    [
      {
        "name": "string",
        "category": "hard" | "soft",
        "proficiency": "learning" | "comfortable" | "expert",
        "evidence": "string (e.g. 'From CSC207')"
      }
    ]
  `
};
