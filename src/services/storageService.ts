import type { ResumeProfile, SavedJob } from '../types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
    RESUMES: 'jobfit_resumes_v2',
    JOBS: 'jobfit_jobs_history',
};

// Helper: Get User ID if logged in
const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

export const Storage = {
    // --- Resumes ---
    async getResumes(): Promise<ResumeProfile[]> {
        // 1. Try Local First (Instant)
        const local = localStorage.getItem(STORAGE_KEYS.RESUMES);
        let profiles: ResumeProfile[] = [];

        if (local) {
            try {
                profiles = JSON.parse(local);
            } catch { /* ignore */ }
        } else {
            // Default State
            profiles = [{ id: 'master', name: 'Master Experience', blocks: [] }];
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
                // Cloud is source of truth
                // We assume 1 profile for now (MVP), but schema supports many
                // If cloud has content, overwrite local (simple sync)
                // NOTE: Real sync needs conflict res. For MVP, Last Write Wins (Cloud Wins on Load)
                // Actually, for "get", we trust Cloud if available.
                // Ideally we merge, but let's stick to simple "Cloud overrides local" on fresh load
                // But wait, structure is ResumeProfile[], schema stores JSONB.
                // Let's assume schema stores ResumeProfile[] in 'content' column?
                // Checking schema: 'content jsonb'.
                // We need to adhere to schema.
                const cloudProfiles = data.content as ResumeProfile[];
                if (Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
                    profiles = cloudProfiles;
                    // Update local cache
                    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(profiles));
                }
            }
        }
        return profiles;
    },

    async saveResumes(resumes: ResumeProfile[]) {
        // 1. Save Local
        localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));

        // 2. Save Cloud (if logged in)
        const userId = await getUserId();
        if (userId) {
            // Upsert based on user_id. 
            // Our schema has 'id' (uuid) and 'user_id'. 
            // We probably want 1 row per user for ALL resumes (simpler for now) OR 1 row per resume.
            // My schema defined 'content jsonb'. Let's treat it as "The Resume Array".
            // We need to find the resume row for this user.

            // Check if row exists
            const { data } = await supabase.from('resumes').select('id').eq('user_id', userId).maybeSingle();

            if (data) {
                const { error } = await supabase.from('resumes').update({
                    content: resumes, // Store the whole array
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
        // 1. Get existing
        const localRaw = localStorage.getItem(STORAGE_KEYS.RESUMES);
        const existing: ResumeProfile[] = localRaw ? JSON.parse(localRaw) : [{ id: 'master', name: 'Master Experience', blocks: [] }];

        // 2. Add new
        const updated = [...existing, profile];
        localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(updated));

        // 3. Sync to Cloud
        const userId = await getUserId();
        if (userId) {
            // Update the single row
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
        // 1. Local
        const local = localStorage.getItem(STORAGE_KEYS.JOBS);
        let jobs: SavedJob[] = local ? JSON.parse(local) : [];

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
                    coverLetter: row.cover_letter,
                    coverLetterCritique: row.cover_letter_critique,
                    fitAnalysis: row.fit_analysis
                }));

                // Merge/Overlay
                // Simple strategy: Cloud wins.
                jobs = cloudJobs;
                localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
            }
        }
        return jobs;
    },

    async addJob(job: SavedJob) {
        // 1. Local
        const localRaw = localStorage.getItem(STORAGE_KEYS.JOBS);
        const localJobs: SavedJob[] = localRaw ? JSON.parse(localRaw) : [];
        const updated = [job, ...localJobs];
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            // Insert row
            const { error } = await supabase.from('jobs').insert({
                user_id: userId,
                // generate uuid? or let DB do it? 
                // Front end generated an ID. Let's use it if UUID, else let DB gen and we might have mismatch.
                // Best practice: Let DB gen ID. But frontend needs known ID.
                // We'll trust frontend ID if it's UUID.
                // job.id is crypto.randomUUID().
                id: job.id,
                job_title: job.analysis?.distilledJob?.roleTitle || 'Untitled Role',
                company: job.analysis?.distilledJob?.companyName || 'Unknown Company',
                analysis: job.analysis, // Stores full object including coverLetter if attached
                status: job.status,
                date_added: new Date(job.dateAdded).toISOString()
            });
            if (error) console.error("Cloud Sync Error (Add Job):", error);
        }
        // Return updated list to keep frontend in sync
        return updated;
    },

    async updateJob(updatedJob: SavedJob) {
        // 1. Local
        const localRaw = localStorage.getItem(STORAGE_KEYS.JOBS);
        const localJobs: SavedJob[] = localRaw ? JSON.parse(localRaw) : [];
        const updated = localJobs.map(j => j.id === updatedJob.id ? updatedJob : j);
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));

        // 2. Cloud
        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('jobs').update({
                job_title: updatedJob.analysis?.distilledJob?.roleTitle,
                company: updatedJob.analysis?.distilledJob?.companyName,
                status: updatedJob.status,
                analysis: updatedJob.analysis
            }).eq('id', updatedJob.id);
            if (error) console.error("Cloud Sync Error (Update Job):", error);
        }
        return updated;
    },

    async deleteJob(id: string) {
        // 1. Local
        const localRaw = localStorage.getItem(STORAGE_KEYS.JOBS);
        const localJobs: SavedJob[] = localRaw ? JSON.parse(localRaw) : [];
        const updated = localJobs.filter(j => j.id !== id);
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));

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
            const localResumesRaw = localStorage.getItem(STORAGE_KEYS.RESUMES);
            if (localResumesRaw) {
                const resumes = JSON.parse(localResumesRaw);
                if (resumes.length > 0) {
                    await this.saveResumes(resumes);
                }
            }
        }

        // 2. Sync Jobs (Push missing ones)
        const localJobsRaw = localStorage.getItem(STORAGE_KEYS.JOBS);
        if (localJobsRaw) {
            const localJobs: SavedJob[] = JSON.parse(localJobsRaw);

            // Get all Cloud IDs to avoid duplicates
            const { data: cloudJobs } = await supabase.from('jobs').select('id').eq('user_id', userId);
            const cloudIds = new Set(cloudJobs?.map(j => j.id) || []);

            for (const job of localJobs) {
                if (!cloudIds.has(job.id)) {
                    await this.addJob(job);
                }
            }
        }
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
    }
};
