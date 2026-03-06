import { supabase } from '../supabase';
import { Vault, getUserId } from './storageCore';
import { STORAGE_KEYS } from '../../constants';
import type { SavedJob } from '../../types';

export const JobStorage = {
    async getJobs(): Promise<SavedJob[]> {
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        let jobs = localJobs;

        const userId = await getUserId();
        if (userId) {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date_added', { ascending: false });

                if (error) {
                    if (error.code === 'PGRST204' || error.message?.includes('column')) {
                        console.warn("Cloud fetch partially failed due to schema mismatch. Using local data fallback.");
                    } else {
                        console.error("Cloud Sync Error (Get Jobs):", error);
                    }
                }

                if (data) {
                    const cloudJobs: SavedJob[] = data.map(row => ({
                        id: row.id,
                        company: row.company,
                        position: row.job_title || row.position || 'Untitled Role',
                        location: row.location,
                        description: row.original_text || row.description,
                        fitScore: row.fit_score,
                        status: row.status as SavedJob['status'],
                        dateAdded: new Date(row.date_added || row.created_at || Date.now()).getTime(),
                        resumeId: row.resume_id,
                        coverLetter: row.cover_letter,
                        coverLetterCritique: row.cover_letter_critique,
                        analysis: row.analysis,
                    }));

                    // Non-destructive merge: 
                    // 1. Process cloud jobs (with self-healing from local matches)
                    const processedCloudJobs = cloudJobs.map(cloudJob => {
                        const localMatch = localJobs.find(l => l.id === cloudJob.id);
                        let needsRepair = false;
                        let finalJob = cloudJob;

                        if (localMatch) {
                            if (!cloudJob.analysis && localMatch.analysis) {
                                finalJob = { ...finalJob, analysis: localMatch.analysis, status: localMatch.status };
                                needsRepair = true;
                            }

                            if ((!cloudJob.description || cloudJob.description.length < 50) && localMatch.description && localMatch.description.length > 50) {
                                finalJob = { ...finalJob, description: localMatch.description };
                                needsRepair = true;
                            }

                            if (needsRepair) {
                                this.updateJob(finalJob).catch(err => console.error("Self-healing failed:", err));
                            }
                        }

                        // Mark as synced so we don't resurrect it if it gets deleted on another device
                        (finalJob as any)._synced = true;

                        return finalJob;
                    });

                    // 2. Keep local jobs that haven't synced to cloud yet (ignore previously synced ones that are now missing, i.e., deleted elsewhere)
                    const cloudIds = new Set(cloudJobs.map(j => j.id));
                    const unsyncedLocalJobs = localJobs.filter(l => !cloudIds.has(l.id) && !(l as any)._synced);

                    jobs = [...processedCloudJobs, ...unsyncedLocalJobs].sort((a, b) => b.dateAdded - a.dateAdded);

                    await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, jobs);
                }
            } catch (err) {
                console.warn("Exception during cloud job fetch:", err);
                // Fall through to returning local jobs
            }
        }
        return jobs;
    },

    async addJob(job: SavedJob) {
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = [job, ...localJobs];

        await Promise.all([
            Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated),
            getUserId().then(userId => {
                if (!userId) return;
                return supabase.from('jobs').insert({
                    user_id: userId,
                    id: job.id,
                    job_title: job.analysis?.distilledJob?.roleTitle || job.position || 'Untitled Role',
                    company: job.analysis?.distilledJob?.companyName || job.company || 'Unknown Company',
                    original_text: job.description,
                    url: job.url,
                    analysis: job.analysis,
                    canonical_role: job.analysis?.distilledJob?.canonicalTitle,
                    // 'analyzing' is a transient client-side state; store as 'saved' so the row
                    // lands in Supabase and gets updated when analysis completes via updateJob.
                    status: (job.status === 'analyzing' || !job.status) ? 'saved' : job.status,
                    resume_id: job.resumeId,
                    cover_letter: job.coverLetter,
                    cover_letter_critique: job.coverLetterCritique,
                    fit_score: job.analysis?.compatibilityScore,
                    date_added: new Date(job.dateAdded).toISOString()
                }).then(({ error }) => {
                    if (error) console.error("Cloud Sync Error (Add Job):", error);
                });
            })
        ]);

        return updated;
    },

    async updateJob(updatedJob: SavedJob) {
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = localJobs.map(j => j.id === updatedJob.id ? updatedJob : j);

        await Promise.all([
            Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated),
            getUserId().then(userId => {
                if (!userId) return;
                return supabase.from('jobs').update({
                    job_title: updatedJob.analysis?.distilledJob?.roleTitle || updatedJob.position,
                    company: updatedJob.analysis?.distilledJob?.companyName || updatedJob.company,
                    original_text: updatedJob.description,
                    status: updatedJob.status || 'saved',
                    analysis: updatedJob.analysis,
                    canonical_role: updatedJob.analysis?.distilledJob?.canonicalTitle,
                    resume_id: updatedJob.resumeId,
                    cover_letter: updatedJob.coverLetter,
                    cover_letter_critique: updatedJob.coverLetterCritique,
                    fit_score: updatedJob.analysis?.compatibilityScore
                }).eq('id', updatedJob.id).then(({ error }) => {
                    if (error) console.error("Cloud Sync Error (Update Job):", error);
                });
            })
        ]);

        return updated;
    },

    async syncLocalToCloud() {
        const userId = await getUserId();
        if (!userId) return;

        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        if (localJobs.length === 0) return;

        try {
            // 1. Check cloud state
            const { data: cloudJobs, error } = await supabase
                .from('jobs')
                .select('id')
                .eq('user_id', userId);

            if (error) {
                console.error("Sync: Failed to fetch cloud IDs", error);
                return;
            }

            const cloudIds = new Set(cloudJobs?.map(j => j.id) || []);

            // 2. Identify jobs that need to be uploaded
            const missingFromCloud = localJobs.filter(l => !cloudIds.has(l.id));

            if (missingFromCloud.length > 0) {
                console.log(`Sync: Uploading ${missingFromCloud.length} unsynced jobs to cloud...`);

                // Upload in small batches to avoid hitting limits
                for (const job of missingFromCloud) {
                    await supabase.from('jobs').insert({
                        user_id: userId,
                        id: job.id,
                        job_title: job.analysis?.distilledJob?.roleTitle || job.position || 'Untitled Role',
                        company: job.analysis?.distilledJob?.companyName || job.company || 'Unknown Company',
                        original_text: job.description,
                        url: job.url,
                        analysis: job.analysis,
                        canonical_role: job.analysis?.distilledJob?.canonicalTitle,
                        status: (job.status === 'analyzing' || !job.status) ? 'saved' : job.status,
                        resume_id: job.resumeId,
                        cover_letter: job.coverLetter,
                        cover_letter_critique: job.coverLetterCritique,
                        date_added: new Date(job.dateAdded || Date.now()).toISOString(),
                        source_type: 'manual',
                        fit_score: job.analysis?.compatibilityScore
                    });
                }
                console.log("Sync: Bulk upload complete.");
            }
        } catch (err) {
            console.error("Sync: Fatal error during sync", err);
        }
    },

    async deleteJob(id: string) {
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = localJobs.filter(j => j.id !== id);

        await Promise.all([
            Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated),
            getUserId().then(userId => {
                if (userId) return supabase.from('jobs').delete().eq('id', id);
            })
        ]);

        return updated;
    }
};
