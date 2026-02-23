import { supabase } from './supabase';
import { Vault, getUserId } from './storage/storageCore';
import { JobStorage } from './storage/jobStorage';
import { ResumeStorage } from './storage/resumeStorage';
import { SkillStorage } from './storage/skillStorage';
import { CoachStorage } from './storage/coachStorage';
import { STORAGE_KEYS } from '../constants';
import type { ResumeProfile, SavedJob } from '../types';

export const Storage = {
    ...JobStorage,
    ...ResumeStorage,
    ...SkillStorage,
    ...CoachStorage,

    async syncLocalToCloud() {
        const userId = await getUserId();
        if (!userId) return;

        // 1. Sync Resumes if Cloud is Empty
        const { data: cloudResume } = await supabase.from('resumes').select('id').eq('user_id', userId).maybeSingle();
        if (!cloudResume) {
            const resumes = await Vault.getSecure(STORAGE_KEYS.RESUMES) as ResumeProfile[];
            if (resumes && resumes.length > 0) {
                await this.saveResumes(resumes);
            }
        }

        // 2. Sync Jobs (Push missing ones)
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        if (localJobs.length > 0) {
            const { data: cloudJobs } = await supabase.from('jobs').select('id').eq('user_id', userId);
            const cloudIds = new Set(cloudJobs?.map(j => j.id) || []);

            for (const job of localJobs) {
                if (!cloudIds.has(job.id)) {
                    await this.addJob(job);
                }
            }
        }

        // 3. Sync Skills
        const localSkills = await Vault.getSecure<any[]>(STORAGE_KEYS.SKILLS) || [];
        if (localSkills.length > 0) {
            const { data: cloudSkills } = await supabase.from('user_skills').select('name').eq('user_id', userId);
            const cloudNames = new Set(cloudSkills?.map(s => s.name) || []);

            for (const skill of localSkills) {
                if (!cloudNames.has(skill.name)) {
                    await this.saveSkill(skill);
                }
            }
        }

        // 4. Sync Coach Data (Role Models & Target Jobs)
        const localRoleModels = await Vault.getSecure<any[]>(STORAGE_KEYS.ROLE_MODELS) || [];
        if (localRoleModels.length > 0) {
            const { data: cloudModels } = await supabase.from('role_models').select('id').eq('user_id', userId);
            const cloudIds = new Set(cloudModels?.map(m => m.id) || []);
            for (const model of localRoleModels) {
                if (!cloudIds.has(model.id)) {
                    await this.addRoleModel(model);
                }
            }
        }

        const localTargetJobs = await Vault.getSecure<any[]>(STORAGE_KEYS.TARGET_JOBS) || [];
        if (localTargetJobs.length > 0) {
            const { data: cloudTargets } = await supabase.from('target_jobs').select('id').eq('user_id', userId);
            const cloudIds = new Set(cloudTargets?.map(t => t.id) || []);
            for (const target of localTargetJobs) {
                if (!cloudIds.has(target.id)) {
                    await this.saveTargetJob(target);
                }
            }
        }
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

        userKeys.forEach(key => localStorage.removeItem(key));
    },

    // Legacy support for feedback and optimization logging if needed
    async submitFeedback(jobId: string, rating: 1 | -1, context: string) {
        const userId = await getUserId();
        if (userId) {
            supabase.from('feedback').insert({ user_id: userId, job_id: jobId, rating, context });
        }
    }
};
