import type { ResumeProfile, RoleModelProfile } from './resume';
import type { SavedJob } from './job';
import type { TargetJob } from './target';
import type { CustomSkill } from './skills';

export interface AppState {
    resumes: ResumeProfile[];
    jobs: SavedJob[];
    roleModels: RoleModelProfile[];
    targetJobs: TargetJob[];
    skills: CustomSkill[];
    apiStatus: 'ok' | 'offline' | 'checking';
    activeSubmissionId: string | null;
    importError?: string | null;
}
