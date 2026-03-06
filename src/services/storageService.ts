import { supabase } from './supabase';
import { Vault, getUserId } from './storage/storageCore';
import { JobStorage } from './storage/jobStorage';
import { ResumeStorage } from './storage/resumeStorage';
import { SkillStorage } from './storage/skillStorage';
import { CoachStorage } from './storage/coachStorage';
import { STORAGE_KEYS } from '../constants';
import { LocalStorage } from '../utils/localStorage';
import type { ResumeProfile, SavedJob } from '../types';

export const Storage = {
    ...JobStorage,
    ...ResumeStorage,
    ...SkillStorage,
    ...CoachStorage,

    async syncLocalToCloud() {
        const userId = await getUserId();
        if (!userId) return;

        // Fetch local data and cloud state in parallel
        const [
            { data: cloudResume },
            { data: cloudJobs },
            { data: cloudSkills },
            { data: cloudModels },
            { data: cloudTargets },
            localResumes,
            localJobs,
            localSkills,
            localRoleModels,
            localTargetJobs,
        ] = await Promise.all([
            supabase.from('resumes').select('id').eq('user_id', userId).limit(1).maybeSingle(),
            supabase.from('jobs').select('id').eq('user_id', userId),
            supabase.from('user_skills').select('name').eq('user_id', userId),
            supabase.from('role_models').select('id').eq('user_id', userId),
            supabase.from('target_jobs').select('id').eq('user_id', userId),
            Vault.getSecure(STORAGE_KEYS.RESUMES) as Promise<ResumeProfile[]>,
            Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) as Promise<SavedJob[]>,
            Vault.getSecure<any[]>(STORAGE_KEYS.SKILLS),
            Vault.getSecure<any[]>(STORAGE_KEYS.ROLE_MODELS),
            Vault.getSecure<any[]>(STORAGE_KEYS.TARGET_JOBS),
        ]);

        const syncTasks: Promise<unknown>[] = [];

        // 1. Sync Resumes if Cloud is Empty
        if (!cloudResume && localResumes?.length > 0) {
            syncTasks.push(this.saveResumes(localResumes));
        }

        // 2. Sync Jobs (Push missing ones)
        if (localJobs?.length > 0) {
            const cloudJobIds = new Set(cloudJobs?.map(j => j.id) || []);
            for (const job of localJobs) {
                if (!cloudJobIds.has(job.id) && !(job as any)._synced) syncTasks.push(this.addJob(job));
            }
        }

        // 3. Sync Skills
        if (localSkills && localSkills.length > 0) {
            const cloudSkillNames = new Set(cloudSkills?.map(s => s.name) || []);
            for (const skill of localSkills) {
                if (!cloudSkillNames.has(skill.name)) syncTasks.push(this.saveSkill(skill));
            }
        }

        // 4. Sync Role Models
        if (localRoleModels && localRoleModels.length > 0) {
            const cloudModelIds = new Set(cloudModels?.map(m => m.id) || []);
            for (const model of localRoleModels) {
                if (!cloudModelIds.has(model.id)) syncTasks.push(this.addRoleModel(model));
            }
        }

        // 5. Sync Target Jobs
        if (localTargetJobs && localTargetJobs.length > 0) {
            const cloudTargetIds = new Set(cloudTargets?.map(t => t.id) || []);
            for (const target of localTargetJobs) {
                if (!cloudTargetIds.has(target.id)) syncTasks.push(this.saveTargetJob(target));
            }
        }

        await Promise.all(syncTasks);
    },

    async signOut() {
        await supabase.auth.signOut();
    },

    async clearAllData() {
        // Wipe all user-specific localStorage keys
        const userKeys = [
            STORAGE_KEYS.RESUMES,
            STORAGE_KEYS.JOBS_HISTORY,
            STORAGE_KEYS.SKILLS,
            STORAGE_KEYS.ROLE_MODELS,
            STORAGE_KEYS.TARGET_JOBS,
            STORAGE_KEYS.TRANSCRIPT_CACHE,
            'jobfit_vault_seed' // Also clear the encryption seed
        ];

        userKeys.forEach(key => LocalStorage.remove(key));
    },

    // Legacy support for feedback and optimization logging if needed
    async submitFeedback(jobId: string, rating: 1 | -1, context: string) {
        const userId = await getUserId();
        if (userId) {
            await supabase.from('feedback').insert({ user_id: userId, job_id: jobId, rating, context });
        }
    }
};
