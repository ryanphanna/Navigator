import type { ResumeProfile, SavedJob, CustomSkill } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { encryptionService } from './encryptionService';

import { STORAGE_KEYS } from '../constants';

// Helper: Get User ID if logged in
const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

// --- Private Vault (Encryption) Logic ---

const getVaultSeed = () => {
    let seed = localStorage.getItem(STORAGE_KEYS.VAULT_SEED);
    if (!seed) {
        seed = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEYS.VAULT_SEED, seed);
    }
    return seed;
};

const Vault = {
    initialized: false,

    async ensureInit() {
        if (this.initialized) return;
        const seed = getVaultSeed();
        await encryptionService.init(seed);
        this.initialized = true;
    },

    async getSecure<T = unknown>(key: string): Promise<T | null> {
        await this.ensureInit();
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        // Migration/Compatibility check
        // If it starts with '{' or '[', it's legacy unencrypted JSON
        if (raw.startsWith('{') || raw.startsWith('[')) {
            console.log(`[Vault] Migrating legacy content for key: ${key}`);
            try {
                const data = JSON.parse(raw);
                // Auto-encrypt for next time
                await this.setSecure(key, data);
                return data;
            } catch {
                return null;
            }
        }

        try {
            const decrypted = await encryptionService.decrypt(raw);
            return JSON.parse(decrypted);
        } catch {
            console.error(`[Vault] Decryption failed for ${key}. Data may be corrupted.`);
            return null;
        }
    },

    async setSecure(key: string, data: unknown) {
        await this.ensureInit();
        const serialized = JSON.stringify(data);
        const encrypted = await encryptionService.encrypt(serialized);
        localStorage.setItem(key, encrypted);
    }
};

// Helper: Compare blocks for equality
const areBlocksEqual = (a: import('../types').ExperienceBlock, b: import('../types').ExperienceBlock) => {
    // ... (logic remains same)
    if (a.type !== b.type) return false;
    const normTitleA = a.title.toLowerCase().trim();
    const normTitleB = b.title.toLowerCase().trim();
    const normOrgA = a.organization.toLowerCase().trim();
    const normOrgB = b.organization.toLowerCase().trim();
    if (['work', 'education', 'project'].includes(a.type)) {
        return normTitleA === normTitleB && normOrgA === normOrgB;
    }
    if (a.type === 'skill') return normTitleA === normTitleB;
    if (a.type === 'summary') return true;
    return false;
};

export const Storage = {
    // --- Resumes ---
    async getResumes(): Promise<ResumeProfile[]> {
        // 1. Try Local First (Instant) - Now via Vault
        let profiles = (await Vault.getSecure(STORAGE_KEYS.RESUMES)) as ResumeProfile[];

        if (!profiles) {
            profiles = [{ id: 'primary', name: 'Primary Experience', blocks: [] }];
        }

        // 2. If Logged In, Sync with Cloud
        const userId = await getUserId();
        if (userId) {
            const { data } = await supabase
                .from('resumes')
                .select('content')
                .eq('user_id', userId)
                .maybeSingle();

            if (data && data.content) {
                const cloudProfiles = data.content as ResumeProfile[];
                if (Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
                    profiles = cloudProfiles;
                    await Vault.setSecure(STORAGE_KEYS.RESUMES, profiles);
                }
            }
        }
        return profiles;
    },

    async saveResumes(resumes: ResumeProfile[]) {
        // 1. Save Local (Secured)
        await Vault.setSecure(STORAGE_KEYS.RESUMES, resumes);

        // 2. Save Cloud (if logged in)
        const userId = await getUserId();
        if (userId) {
            const { data } = await supabase.from('resumes').select('id').eq('user_id', userId).maybeSingle();

            if (data) {
                const { error } = await supabase.from('resumes').update({
                    content: resumes,
                    name: 'Default Profile'
                }).eq('id', data.id);
                if (error) console.error("Cloud Sync Error (Update Resume):", error);
            } else {
                const { error } = await supabase.from('resumes').insert({
                    user_id: userId,
                    name: 'Default Profile',
                    content: resumes
                });
                if (error) console.error("Cloud Sync Error (Insert Resume):", error);
            }
        }
    },

    async addResume(profile: ResumeProfile) {
        // 1. Get existing (Secured)
        const existing: ResumeProfile[] = await Vault.getSecure(STORAGE_KEYS.RESUMES) || [];

        // 2. Smart Merge Logic
        let updated: ResumeProfile[];
        if (existing.length === 0) {
            updated = [profile];
        } else {
            const master = existing[0];
            const newBlocks = [...master.blocks];
            profile.blocks.forEach(newBlock => {
                const matchIndex = newBlocks.findIndex(b => areBlocksEqual(b, newBlock));
                if (matchIndex !== -1) {
                    const existingBlock = newBlocks[matchIndex];
                    const combinedBullets = Array.from(new Set([
                        ...existingBlock.bullets,
                        ...newBlock.bullets
                    ])).filter(b => b.trim().length > 0);
                    newBlocks[matchIndex] = {
                        ...existingBlock,
                        bullets: combinedBullets,
                        dateRange: existingBlock.dateRange || newBlock.dateRange
                    };
                } else {
                    newBlocks.push(newBlock);
                }
            });
            const updatedMaster = { ...master, blocks: newBlocks };
            updated = [updatedMaster, ...existing.slice(1)];
        }

        await Vault.setSecure(STORAGE_KEYS.RESUMES, updated);

        // 3. Sync to Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('resumes').update({
                content: updated
            }).eq('user_id', userId);
            if (error) console.error("Cloud Sync Error (Add Resume):", error);
        }
        return updated;
    },

    // --- Jobs ---
    // Alias for compatibility if needed, or just use updateJob
    async saveJob(job: SavedJob) {
        return this.updateJob(job);
    },


    async getJobs(): Promise<SavedJob[]> {
        // 1. Local (Secured)
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        let jobs = localJobs;

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { data } = await supabase
                .from('jobs')
                .select('*')
                .eq('user_id', userId)
                .order('date_added', { ascending: false });

            if (data) {
                const cloudJobs: SavedJob[] = data.map(row => ({
                    id: row.id,
                    company: row.company,
                    position: row.position,
                    location: row.location,
                    description: row.description,
                    fitScore: row.fit_score,
                    status: row.status as SavedJob['status'],
                    dateAdded: new Date(row.created_at).getTime(),
                    resumeId: row.resume_id,


                }));

                // --- SMART MERGE STRATEGY ---
                // We trust the Cloud for the list of jobs (source of truth for existence),
                // but we trust Local Storage for the content if the Cloud is incomplete.
                // This prevents "Re-Analyze" loops where the server hasn't saved the analysis JSON yet.
                jobs = cloudJobs.map(cloudJob => {
                    const localMatch = (localJobs || []).find(l => l.id === cloudJob.id);
                    let needsRepair = false;
                    let finalJob = cloudJob;

                    // Case 1: Cloud is missing analysis, but Local has it. Keep Local.
                    if (!cloudJob.analysis && localMatch?.analysis) {
                        finalJob = { ...finalJob, analysis: localMatch.analysis, status: localMatch.status };
                        needsRepair = true;
                    }

                    // Case 2: Cloud description is empty/short (bad scrape?), Local is better. Keep Local.
                    if ((!cloudJob.description || cloudJob.description.length < 50) && localMatch?.description && localMatch.description.length > 50) {
                        finalJob = { ...finalJob, description: localMatch.description };
                        needsRepair = true;
                    }

                    if (needsRepair) {
                        // SELF-HEALING: If we found better local data, push it back to the cloud
                        // to fix the corrupted/incomplete state permanently.
                        this.updateJob(finalJob).catch(err => console.error("Self-healing failed:", err));
                    }

                    return finalJob;
                });

                await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, jobs);
            }
        }
        return jobs;
    },

    async addJob(job: SavedJob) {
        // 1. Local (Secured)
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = [job, ...localJobs];
        await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('jobs').insert({
                user_id: userId,
                id: job.id,
                job_title: job.analysis?.distilledJob?.roleTitle || job.position || 'Untitled Role',
                company: job.analysis?.distilledJob?.companyName || job.company || 'Unknown Company',
                description: job.description,
                analysis: job.analysis,
                status: job.status,
                resume_id: job.resumeId,
                cover_letter: job.coverLetter,
                cover_letter_critique: job.coverLetterCritique,
                date_added: new Date(job.dateAdded).toISOString()
            });
            if (error) console.error("Cloud Sync Error (Add Job):", error);
        }
        return updated;
    },

    async updateJob(updatedJob: SavedJob) {
        // 1. Local (Secured)
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = localJobs.map(j => j.id === updatedJob.id ? updatedJob : j);
        await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('jobs').update({
                job_title: updatedJob.analysis?.distilledJob?.roleTitle || updatedJob.position,
                company: updatedJob.analysis?.distilledJob?.companyName || updatedJob.company,
                description: updatedJob.description,
                status: updatedJob.status,
                analysis: updatedJob.analysis,
                resume_id: updatedJob.resumeId,
                cover_letter: updatedJob.coverLetter,
                cover_letter_critique: updatedJob.coverLetterCritique,
                fit_score: updatedJob.analysis?.compatibilityScore
            }).eq('id', updatedJob.id);
            if (error) console.error("Cloud Sync Error (Update Job):", error);
        }
        return updated;
    },

    async deleteJob(id: string) {
        // 1. Local (Secured)
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = localJobs.filter(j => j.id !== id);
        await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            await supabase.from('jobs').delete().eq('id', id);
        }
        return updated;
    },

    // --- Migration / Sync ---
    async syncLocalToCloud() {
        const userId = await getUserId();
        if (!userId) return;

        // 1. Sync Resumes if Cloud is Empty
        const { data: cloudResume } = await supabase.from('resumes').select('id').eq('user_id', userId).maybeSingle();
        if (!cloudResume) {
            const resumes = (await Vault.getSecure(STORAGE_KEYS.RESUMES)) as ResumeProfile[];
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
    },

    // --- Profiles ---
    async updateProfile(userId: string, updates: Record<string, unknown>) {
        if (!isSupabaseConfigured()) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        if (error) throw error;
    },

    // --- Feedback ---
    async submitFeedback(jobId: string, rating: 1 | -1, context: string) {
        const userId = await getUserId();
        if (userId) {
            // Fire and forget
            supabase.from('feedback').insert({
                user_id: userId,
                job_id: jobId,
                rating,
                context
            });
        }
    },

    // --- Optimization Helpers ---
    calculateEditDistance(original: string, modified: string): number {
        if (!original || !modified) return 0;
        const track = Array(modified.length + 1).fill(null).map(() =>
            Array(original.length + 1).fill(null));
        for (let i = 0; i <= original.length; i += 1) {
            track[0][i] = i;
        }
        for (let j = 0; j <= modified.length; j += 1) {
            track[j][0] = j;
        }
        for (let j = 1; j <= modified.length; j += 1) {
            for (let i = 1; i <= original.length; i += 1) {
                const indicator = original[i - 1] === modified[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1, // deletion
                    track[j - 1][i] + 1, // insertion
                    track[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        return track[modified.length][original.length];
    },

    async logOptimizationEvent(jobId: string, promptVersion: string, original: string, final: string) {
        const distance = this.calculateEditDistance(original, final);

        // Log to console for dev visibility
        console.log(`[Optimization] Job: ${jobId} | Prompt: ${promptVersion || '1.0'} | Edit Distance: ${distance}`);

        const userId = await getUserId();
        if (userId) {
            // In a real DB we'd have an 'experiments' table. 
            // For now, we abuse 'feedback' or just rely on the 'jobs' table having the metadata.
            // Let's rely on the Job Update to store the score, but we can also fire a specific event if we add an analytics table later.
            // Updating the Job with the score is enough for MVP.
        }
        return distance;
    },

    // --- Skills Portfolio ---
    async getSkills(): Promise<CustomSkill[]> {
        // 1. Local (Secured)
        let skills: CustomSkill[] = await Vault.getSecure(STORAGE_KEYS.SKILLS) || [];

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { data, error } = await supabase
                .from('user_skills')
                .select('*')
                .eq('user_id', userId)
                .order('name');

            if (!error && data) {
                skills = data.map(row => ({
                    id: row.id,
                    user_id: row.user_id,
                    name: row.name,
                    proficiency: row.proficiency,
                    evidence: row.evidence,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                }));
                await Vault.setSecure(STORAGE_KEYS.SKILLS, skills);
            }
        }
        return skills;
    },

    async saveSkill(skill: Partial<CustomSkill>): Promise<CustomSkill> {
        const userId = await getUserId();
        if (!userId) {
            // Local-only fallback (Secured)
            const skills: CustomSkill[] = await Vault.getSecure(STORAGE_KEYS.SKILLS) || [];
            const existingIdx = skills.findIndex(s => s.name === skill.name);

            const newSkill: CustomSkill = {
                ...skill,
                id: existingIdx !== -1 ? skills[existingIdx].id : crypto.randomUUID(),
                user_id: 'anonymous',
                created_at: existingIdx !== -1 ? skills[existingIdx].created_at : new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as CustomSkill; // Cast to CustomSkill as Partial might miss required fields

            if (existingIdx !== -1) skills[existingIdx] = newSkill;
            else skills.push(newSkill);

            await Vault.setSecure(STORAGE_KEYS.SKILLS, skills);
            return newSkill;
        }

        // Cloud + Local Sync
        const { data, error } = await supabase
            .from('user_skills')
            .upsert({
                user_id: userId,
                name: skill.name,
                proficiency: skill.proficiency,
                evidence: skill.evidence,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,name' })
            .select()
            .single();

        if (error) {
            console.error("Failed to save skill:", error);
            throw error;
        }

        // Update Local Cache (Secured)
        const localSkills: CustomSkill[] = await Vault.getSecure(STORAGE_KEYS.SKILLS) || [];
        const updated = localSkills.filter(s => s.name !== skill.name);
        updated.push(data);
        await Vault.setSecure(STORAGE_KEYS.SKILLS, updated);

        return data as CustomSkill;
    },

    async deleteSkill(name: string) {
        // 1. Local (Secured)
        const localSkills: CustomSkill[] = await Vault.getSecure(STORAGE_KEYS.SKILLS) || [];
        const updated = localSkills.filter(s => s.name !== name);
        await Vault.setSecure(STORAGE_KEYS.SKILLS, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase
                .from('user_skills')
                .delete()
                .eq('user_id', userId)
                .eq('name', name);
            if (error) console.error("Cloud Delete Error (Skill):", error);
        }
    },

    // --- Role Models ---
    async getRoleModels(): Promise<import('../types').RoleModelProfile[]> {
        // 1. Local (Secured)
        let roleModels: import('../types').RoleModelProfile[] = await Vault.getSecure(STORAGE_KEYS.ROLE_MODELS) || [];

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { data, error } = await supabase
                .from('role_models')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                roleModels = data.map(row => ({
                    ...row.content,
                    id: row.id,
                }));
                await Vault.setSecure(STORAGE_KEYS.ROLE_MODELS, roleModels);
            }
        }
        return roleModels;
    },

    async addRoleModel(roleModel: import('../types').RoleModelProfile) {
        // 1. Local (Secured)
        const existing: import('../types').RoleModelProfile[] = await Vault.getSecure(STORAGE_KEYS.ROLE_MODELS) || [];
        const updated = [roleModel, ...existing];
        await Vault.setSecure(STORAGE_KEYS.ROLE_MODELS, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('role_models').insert({
                id: roleModel.id,
                user_id: userId,
                name: roleModel.name,
                content: roleModel
            });
            if (error) console.error("Cloud Sync Error (Add Role Model):", error);
        }
        return updated;
    },

    async deleteRoleModel(id: string) {
        // 1. Local (Secured)
        const existing: import('../types').RoleModelProfile[] = await Vault.getSecure(STORAGE_KEYS.ROLE_MODELS) || [];
        const updated = existing.filter(rm => rm.id !== id);
        await Vault.setSecure(STORAGE_KEYS.ROLE_MODELS, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            await supabase.from('role_models').delete().eq('id', id);
        }
        return updated;
    },

    // --- Target Jobs ---
    async getTargetJobs(): Promise<import('../types').TargetJob[]> {
        // 1. Local (Secured)
        let targetJobs: import('../types').TargetJob[] = await Vault.getSecure(STORAGE_KEYS.TARGET_JOBS) || [];

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { data, error } = await supabase
                .from('target_jobs')
                .select('*')
                .eq('user_id', userId)
                .order('date_added', { ascending: false });

            if (!error && data) {
                targetJobs = data.map(row => ({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    roleModelId: row.role_model_id,
                    gapAnalysis: row.gap_analysis,
                    roadmap: row.roadmap,
                    type: row.type,
                    strictMode: row.strict_mode,
                    dateAdded: new Date(row.date_added).getTime()
                }));
                await Vault.setSecure(STORAGE_KEYS.TARGET_JOBS, targetJobs);
            }
        }
        return targetJobs;
    },

    async saveTargetJob(targetJob: import('../types').TargetJob) {
        // 1. Local (Secured)
        const existing: import('../types').TargetJob[] = await Vault.getSecure(STORAGE_KEYS.TARGET_JOBS) || [];
        const index = existing.findIndex(tj => tj.id === targetJob.id);

        let updated: import('../types').TargetJob[];
        if (index !== -1) {
            updated = [...existing];
            updated[index] = targetJob;
        } else {
            updated = [targetJob, ...existing];
        }
        await Vault.setSecure(STORAGE_KEYS.TARGET_JOBS, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('target_jobs').upsert({
                id: targetJob.id,
                user_id: userId,
                title: targetJob.title,
                description: targetJob.description,
                role_model_id: targetJob.roleModelId,
                gap_analysis: targetJob.gapAnalysis,
                roadmap: targetJob.roadmap,
                type: targetJob.type || 'goal',
                strict_mode: targetJob.strictMode ?? true,
                date_added: new Date(targetJob.dateAdded).toISOString()
            });
            if (error) console.error("Cloud Sync Error (Save Target Job):", error);
        }
        return updated;
    },

    async deleteTargetJob(id: string) {
        // 1. Local (Secured)
        const existing: import('../types').TargetJob[] = await Vault.getSecure(STORAGE_KEYS.TARGET_JOBS) || [];
        const updated = existing.filter(tj => tj.id !== id);
        await Vault.setSecure(STORAGE_KEYS.TARGET_JOBS, updated);

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            await supabase.from('target_jobs').delete().eq('id', id);
        }
        return updated;
    },

    async signOut() {
        await supabase.auth.signOut();
    }
};
