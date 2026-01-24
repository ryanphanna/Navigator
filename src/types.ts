
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

export interface DistilledJob {
    companyName: string;
    roleTitle: string;
    applicationDeadline: string | null;
    keySkills: string[];
    coreResponsibilities: string[];
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
    source: 'ttc' | 'toronto' | 'other';
    isNew?: boolean;
}

export interface AppState {
    resumes: ResumeProfile[];
    jobs: SavedJob[];
    apiStatus: 'ok' | 'error' | 'checking';
    currentView: 'home' | 'history' | 'resumes' | 'job-detail' | 'pro';
    activeJobId: string | null;
    importError?: string | null;
}
