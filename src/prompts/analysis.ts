import { CONTENT_VALIDATION } from '../constants';

export const ANALYSIS_PROMPTS = {
  JOB_FIT_ANALYSIS: {
    DEFAULT: (jobDescription: string, resumeContext: string, bucketAdvice?: string[]) => `
    You are a Strategic Career Architect and Hiring Expert. Your job is to analyze this candidate's fit for the role with absolute professional objectivity.
    
    ${bucketAdvice ? `ROLE-SPECIFIC FOCUS (Follow these guidelines):
    ${bucketAdvice.map(a => `- ${a}`).join('\n')}
    ` : ''}

    INPUT DATA:
    1. RAW JOB TEXT: 
    "${jobDescription.substring(0, CONTENT_VALIDATION.MAX_JOB_DESCRIPTION_LENGTH)}"

    2. CANDIDATE RESUME BLOCKS:
    ${resumeContext}

    TASK:
    1. DISTILL: Extract the job requirements into a structured format.
    2. DOMAIN-AWARE ANALYSIS: 
       - If this is a Licensed/Regulated role (Healthcare, Legal, Trades), prioritize Certifications and Compliance.
       - If this is a Technical role (Software, Engineering), prioritize Hard Skill Stacks and Project Complexity.
       - If this is a Creative role (Design, Marketing), prioritize Portfolio Impact and Tool Mastery.
    3. GROUNDING RULE: Only credit the candidate for skills and experience explicitly present in the provided Resume Blocks. Do NOT hallucinate levels of seniority.
    4. MATCH BREAKDOWN: Identify key strengths and HONEST gaps.
    5. SCORE: Rate compatibility (0-100) based on hard evidence.

    OUTPUT SCHEMA:
    Return ONLY valid JSON matching this structure.
    CRITICAL: You MUST populate 'keySkills' and 'coreResponsibilities' even for brief job descriptions. Use your expertise to infer them if not explicitly stated.
    {
      "compatibilityScore": number (0-100),
      "reasoning": "High-level professional insight (2-3 sentences)",
      "strengths": ["list of 3-4 specific match points"],
      "weaknesses": ["list of 2-3 specific gaps or missing qualifications"],
      "distilledJob": {
        "roleTitle": "Official title",
        "companyName": "Company name",
        "location": "City, State or Remote",
        "keySkills": ["List of 5-8 priority skills found in the job post"],
        "requiredSkills": [
          { "name": "Skill Name", "level": "learning" | "comfortable" | "expert" }
        ],
        "coreResponsibilities": ["List of 4-6 primary duties"]
      },
      "resumeTailoringInstructions": ["3-4 bullet points on how to adjust the resume"],
      "coverLetterTailoringInstructions": ["3-4 bullet points for the cover letter strategy"],
      "recommendedBlockIds": ["List of IDs from the candidate resume blocks that are most relevant to this job"]
    }
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
            You are a Strategic Career Architect. Write a professional, high-impact cover letter.
            
            INSTRUCTIONS:
            - **Grounding Rule**: Use ONLY evidence from the provided Resume Blocks. Do NOT invent skills or experience.
            - **Metric Uniqueness**: Strictly forbid repeating the same specific metric/stat (e.g. "98% accuracy") more than once in the entire document.
            - **Vocabulary Audit**: Avoid generic "filler" phrasing (e.g. "look no further", "passion for"). Standard professional terms like "highly motivated" are acceptable.
            - Structure:
              1. THE HOOK: Open strong. Mention the specific role/company and ONE key reason you fit.
              2. THE EVIDENCE: Connect 1-2 specific achievements from my resume directly to their hardest requirements.
              3. THE CLOSE: Brief, confident call to action.
            - Tone: Professional but conversational (human), not robotic.
            - Avoid cliches like "I am writing to apply..." start fresher.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `,
      v2_storytelling: `
            You are a Career Architect helping a candidate stand out with narrative.
            
            INSTRUCTIONS:
            - **Grounding Rule**: Use ONLY evidence from the provided Resume Blocks. Do NOT invent skills or experience.
            - **Metric Uniqueness**: Strictly forbid repeating the same specific metric/stat more than once.
            - **Vocabulary Audit**: Avoid generic filler (e.g. "it is with great honor").
            - DO NOT start with "I am writing to apply". Start with a statement about the company's mission or a specific problem they are solving.
            - Narrative Arc: "I've always been interested in [Industry/Problem]... which is why [Company] caught my eye."
            - Then pivot to: "In my role at [Previous Org], I faced a similar challenge..." (Insert Resume Evidence).
            - Ending: "I'd love to bring this energy to [Company]."
            - Tone: Enthusiastic, genuine, slightly less formal than a standard corporate letter.
            - IMPORTANT: Do NOT include any (BLOCK_ID: ...) citations or metadata in the final text.
            `,
      v3_experimental_pro: `
            You are a senior executive writing a cover letter. Write a sophisticated, high-level strategic letter.
            Focus on value proposition and ROI, not just skills.
            - **Grounding Rule**: Use ONLY evidence from the provided Resume Blocks.
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
    - **Truthfulness**: Does the letter accurately reflect the resume? Flag any hallucinations.
    - **Metric Repetition**: Does it repeat the same stats multiple times?
    - **Hook**: Is it generic or specific to the company?
    - **Storytelling**: Is it just a repeat of the resume bullets or a narrative?

    Return specific JSON:
    {
      "decision": "Reject" | "Weak" | "Average" | "Strong" | "Exceptional",
      "strengths": ["string"],
      "feedback": ["string (Be specific about what to fix to get a 'Strong' or 'Exceptional' decision)"],
      "hallucinationAlerts": ["string (Specific claims not supported by the resume)"]
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
    You must be extremely specific to the named institution.

    TRANSCRIPT SUMMARY:
    ${transcriptText}

    TARGET PROGRAM & UNIVERSITY:
    ${targetProgram}

    TASK:
    1. MAPPING: Match the user's transcript courses against the standard requirements for this program.
    2. GPA BENCHMARK: Compare the user's average against the typical competitive intake.
    3. ADMISSION PROBABILITY: Estimate (High, Medium, Low).

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
  `,

  PROGRAM_REQUIREMENTS_ANALYSIS: (transcriptText: string, program: string, university: string) => `
    You are an Academic Advisor. Analyze the user's transcript against standard degree requirements for:
    Program: ${program}
    University: ${university}

    TASK:
    1. Map the user's transcript courses against the requirements for this degree.
    2. Determine if each requirement is 'met', 'missing', or 'in-progress'.
    3. Provide a target credit count for the degree.
    4. Give a general verdict on degree completion progress.
    Return JSON matching this schema:
    {
        "probability": "n/a",
        "analysis": "Brief summary of progress towards this specific degree",
        "gpaVerdict": "How their GPA compares to program honors or standing",
        "gpaContext": "Context on GPA requirements for this major",
        "prerequisites": [
            {
                "requirement": "Requirement Name (e.g. Linear Algebra)",
                "status": "met" | "missing" | "in-progress",
                "mapping": "Matching Course Code from transcript (if met)",
                "description": "Short explanation of the requirement"
            }
        ],
        "weaknesses": ["Specific missing areas"],
        "recommendations": ["Next courses to take or actions to complete"],
        "targetCredits": number (e.g. 120)
    }

    TRANSCRIPT:
    ${transcriptText}
  `,

  COURSE_PROJECT_EXTRACTION: (coursesList: string) => `
    You are a Career Portfolio Specialist. Your task is to look at a student's university courses and propose 2-3 "Portfolio Blocks" or "Projects" that they can highlight on their resume or GitHub.
    
    RATIONALE: We want to turn academic success (an 'A' in a class) into a tangible asset.
    
    COURSES:
    ${coursesList}
    
    TASK:
    1. Identify courses that likely involve significant project work (e.g. "Capstone", "Advanced Design", "Database Systems").
    2. For each identified course, propose a specific, technical project title and description.
    3. The description should be written like a high-impact resume bullet point.
    4. Suggest "Evidence of Mastery" (e.g. "Github Repo", "Technical Report", "Live Demo").
    
    Return JSON:
    [
      {
        "title": "string (e.g. 'Distributed File System')",
        "course": "string (e.g. 'CSC369')",
        "description": "string (A punchy resume-style bullet point)",
        "skills": ["string"],
        "evidence": "string"
      }
    ]
  `,
};
