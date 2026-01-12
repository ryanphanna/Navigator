
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

export interface SavedJob {
    id: string;
    url?: string;
    originalText?: string;
    dateAdded: number;
    analysis?: JobAnalysis;
    status: 'new' | 'applied' | 'interview' | 'offer' | 'rejected' | 'analyzing' | 'error';
    coverLetter?: string;
    contextNotes?: string; // New: optional user context for this specific job
}

export interface AppState {
    resumes: ResumeProfile[];
    jobs: SavedJob[];
    currentView: 'home' | 'history' | 'resumes' | 'job-detail';
    activeJobId: string | null;
}
