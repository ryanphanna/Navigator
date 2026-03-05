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
        const { data: cloudResume } = await supabase.from('resumes').select('id').eq('user_id', userId).limit(1).maybeSingle();
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

            const missingJobs = localJobs.filter(job => !cloudIds.has(job.id));
            if (missingJobs.length > 0) {
                // To avoid duplication in Vault during sync loop,
                // we bypass the normal vault append in addJobs since they are already local.
                // Alternatively, we just map and insert directly to avoid messing with local order.
                const payload = missingJobs.map(job => ({
                    user_id: userId,
                    id: job.id,
                    job_title: job.analysis?.distilledJob?.roleTitle || job.position || 'Untitled Role',
                    company: job.analysis?.distilledJob?.companyName || job.company || 'Unknown Company',
                    original_text: job.description,
                    url: job.url,
                    analysis: job.analysis,
                    canonical_role: job.analysis?.distilledJob?.canonicalTitle,
                    status: job.status || 'saved',
                    resume_id: job.resumeId,
                    cover_letter: job.coverLetter,
                    cover_letter_critique: job.coverLetterCritique,
                    date_added: new Date(job.dateAdded).toISOString()
                }));
                const { error } = await supabase.from('jobs').insert(payload);
                if (error) console.error("Cloud Sync Error (Sync Jobs):", error);
            }
        }

        // 3. Sync Skills
        const localSkills = await Vault.getSecure<any[]>(STORAGE_KEYS.SKILLS) || [];
        if (localSkills.length > 0) {
            const { data: cloudSkills } = await supabase.from('user_skills').select('name').eq('user_id', userId);
            const cloudNames = new Set(cloudSkills?.map(s => s.name) || []);

            const missingSkills = localSkills.filter(skill => !cloudNames.has(skill.name));
            if (missingSkills.length > 0) {
                const payload = missingSkills.map(skill => ({
                    user_id: userId,
                    name: skill.name,
                    proficiency: skill.proficiency,
                    evidence: skill.evidence,
                    updated_at: new Date().toISOString()
                }));
                const { error } = await supabase.from('user_skills').upsert(payload, { onConflict: 'user_id,name' });
                if (error) console.error("Cloud Sync Error (Sync Skills):", error);
            }
        }

        // 4. Sync Coach Data (Role Models & Target Jobs)
        const localRoleModels = await Vault.getSecure<any[]>(STORAGE_KEYS.ROLE_MODELS) || [];
        if (localRoleModels.length > 0) {
            const { data: cloudModels } = await supabase.from('role_models').select('id').eq('user_id', userId);
            const cloudIds = new Set(cloudModels?.map(m => m.id) || []);

            const missingModels = localRoleModels.filter(model => !cloudIds.has(model.id));
            if (missingModels.length > 0) {
                const payload = missingModels.map(model => ({
                    id: model.id,
                    user_id: userId,
                    name: model.name,
                    content: model
                }));
                const { error } = await supabase.from('role_models').insert(payload);
                if (error) console.error("Cloud Sync Error (Sync Role Models):", error);
            }
        }

        const localTargetJobs = await Vault.getSecure<any[]>(STORAGE_KEYS.TARGET_JOBS) || [];
        if (localTargetJobs.length > 0) {
            const { data: cloudTargets } = await supabase.from('target_jobs').select('id').eq('user_id', userId);
            const cloudIds = new Set(cloudTargets?.map(t => t.id) || []);

            const missingTargets = localTargetJobs.filter(target => !cloudIds.has(target.id));
            if (missingTargets.length > 0) {
                const payload = missingTargets.map(target => ({
                    id: target.id,
                    user_id: userId,
                    title: target.title,
                    description: target.description,
                    role_model_id: target.roleModelId,
                    gap_analysis: target.gapAnalysis,
                    roadmap: target.roadmap,
                    type: target.type || 'goal',
                    strict_mode: target.strictMode ?? true,
                    date_added: new Date(target.dateAdded).toISOString()
                }));
                const { error } = await supabase.from('target_jobs').upsert(payload);
                if (error) console.error("Cloud Sync Error (Sync Target Jobs):", error);
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
