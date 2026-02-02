
export interface ExperienceBlock {
    id: string;
    type: 'summary' | 'work' | 'education' | 'project' | 'skill' | 'other';
    title: string;       // Job Title, Degree, or Project Name
    organization: string; // Company, School, or Organization
    dateRange: string;   // e.g. "Jan 2023 - Present"
    bullets: string[];   // The specific points
    isVisible: boolean;  // toggle to include/exclude in analysis
}

export interface ResumeProfile {
    id: string;
    name: string;
    blocks: ExperienceBlock[]; // The new structure
}

export interface RoleModelProfile {
    id: string;
    name: string;
    headline: string;
    organization: string;
    topSkills: string[];
    careerSnapshot: string;
    rawTextSummary: string;
    dateAdded: number;
}

export interface DistilledJob {
    companyName: string;
    roleTitle: string;
    applicationDeadline: string | null;
    keySkills: string[];
    requiredSkills?: { name: string; level: 'learning' | 'comfortable' | 'expert' }[];
    coreResponsibilities: string[];
    salaryRange?: string | null;
}

export interface JobAnalysis {
    compatibilityScore: number;
    bestResumeProfileId: string;
    reasoning: string;
    strengths?: string[];
    weaknesses?: string[];
    distilledJob: DistilledJob;
    tailoringInstructions: string[];
    recommendedBlockIds?: string[]; // New: AI tells us exactly which blocks to keep
}

export interface CoverLetterCritique {
    score: number;
    decision: 'interview' | 'reject' | 'maybe';
    feedback: string[];
    strengths: string[];
}

export interface SavedJob {
    id: string;
    company: string;
    position: string;
    description: string;
    url?: string;
    dateAdded: number;

    // Legacy / Full Analysis
    analysis?: JobAnalysis;

    // Analysis & Content
    fitScore?: number;
    fitAnalysis?: string;
    resumeId: string; // The resume used for this application

    // Application Assets
    contextNotes?: string;
    coverLetter?: string;
    customInstructions?: string; // "Make it punchy"
    coverLetterCritique?: string | CoverLetterCritique;

    // Hyper-Tailored Resume (Ephemeral)
    // Key = Block ID, Value = Rewritten Bullets
    tailoredResumes?: Record<string, string[]>;

    // Optimization / A/B Testing
    initialCoverLetter?: string; // The raw AI output before user edits
    promptVersion?: string;      // ID of the prompt variant used
    editScore?: number;          // Levenshtein distance (lower = better)

    // Outcome Tracking
    status?: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'ghosted' | 'analyzing' | 'error';
}

export interface GapAction {
    type: 'project' | 'metric' | 'certification' | 'tool';
    task: string;
    metric: string;
    tools: string[];
}

export interface SkillGap {
    skill: string;
    importance: number; // 1-5
    gapDescription: string;
    actionableEvidence: GapAction[];
}

export interface GapAnalysisResult {
    careerTrajectoryGap: string;
    topSkillGaps: SkillGap[];
    estimatedTimeToBridge: string;
    dateGenerated: number;
}

export interface RoadmapMilestone extends GapAction {
    id: string;
    title: string;
    month: number; // 1-12
    status: 'pending' | 'completed';
    linkedSkill: string;
}

export interface TargetJob {
    id: string;
    title: string;          // e.g. "Senior Product Manager"
    company?: string;       // Optional, if they have a specific target
    description: string;    // The pasted JD or requirements
    dateAdded: number;
    gapAnalysis?: GapAnalysisResult;
    roadmap?: RoadmapMilestone[];
}

export interface JobFeedItem {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    postedDate: string; // ISO string
    matchScore?: number;
    source: 'ttc' | 'toronto' | 'other';
    isNew?: boolean;
}

export interface CustomSkill {
    id: string;
    user_id: string;
    name: string;
    proficiency: 'learning' | 'comfortable' | 'expert';
    description?: string; // Brief explanation of what this skill means
    evidence?: string;
    created_at: string;
    updated_at: string;
}

export interface AppState {
    resumes: ResumeProfile[];
    jobs: SavedJob[];
    roleModels: RoleModelProfile[];
    targetJobs: TargetJob[];
    skills: CustomSkill[];
    apiStatus: 'ok' | 'offline' | 'checking';
    currentView: 'home' | 'job-fit' | 'history' | 'resumes' | 'job-detail' | 'pro' | 'admin' | 'skills' | 'coach' | 'coach-home' | 'coach-role-models' | 'coach-gap-analysis';
    activeJobId: string | null;
    importError?: string | null;
}
