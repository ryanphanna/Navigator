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
    experience: ExperienceBlock[];
    rawTextSummary: string;
    dateAdded: number;
}
