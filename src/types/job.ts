export interface DistilledJob {
    companyName: string;
    roleTitle: string;
    location?: string | null;
    applicationDeadline: string | null;
    keySkills: string[];
    requiredSkills?: { name: string; level: 'learning' | 'comfortable' | 'expert' }[];
    coreResponsibilities: string[];
    salaryRange?: string | null;
    source?: string | null;
    category?: 'technical' | 'general' | 'managerial'; // AI-determined category
    isAiBanned?: boolean; // New: Safety flag
    aiBanReason?: string; // New: Context for the ban
}

export interface CoverLetterCritique {
    score: number;
    decision: 'interview' | 'reject' | 'maybe';
    feedback: string[];
    strengths: string[];
}

export interface JobAnalysis {
    compatibilityScore?: number;
    bestResumeProfileId?: string;
    reasoning?: string;
    strengths?: string[];
    weaknesses?: string[];
    distilledJob: DistilledJob;
    cleanedDescription?: string; // New: Persist the cleaned description for reuse
    // OLD: Single generic list
    tailoringInstructions?: string[]; // Kept for backwards compatibility with old analyses
    // NEW: Separate lists for resume vs cover letter
    resumeTailoringInstructions?: string[];
    coverLetterTailoringInstructions?: string[];
    recommendedBlockIds?: string[]; // New: AI tells us exactly which blocks to keep
}

export interface SavedJob {
    id: string; // The unique Submission ID for this specific user action
    roleId?: string; // The canonical ID for the role (e.g. 'software-engineer')
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

export interface JobFeedItem {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    postedDate: string; // ISO string
    matchScore?: number;
    source: 'ttc' | 'toronto' | 'other' | 'email';
    sourceType?: 'scraper' | 'email';
    triageReasoning?: string;
    isNew?: boolean;
}
