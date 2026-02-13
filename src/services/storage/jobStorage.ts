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
                    analysis: row.analysis
                }));

                jobs = cloudJobs.map(cloudJob => {
                    const localMatch = localJobs.find(l => l.id === cloudJob.id);
                    let needsRepair = false;
                    let finalJob = cloudJob;

                    if (!cloudJob.analysis && localMatch?.analysis) {
                        finalJob = { ...finalJob, analysis: localMatch.analysis, status: localMatch.status };
                        needsRepair = true;
                    }

                    if ((!cloudJob.description || cloudJob.description.length < 50) && localMatch?.description && localMatch.description.length > 50) {
                        finalJob = { ...finalJob, description: localMatch.description };
                        needsRepair = true;
                    }

                    if (needsRepair) {
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
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = [job, ...localJobs];
        await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated);

        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('jobs').insert({
                user_id: userId,
                id: job.id,
                job_title: job.analysis?.distilledJob?.roleTitle || job.position || 'Untitled Role',
                company: job.analysis?.distilledJob?.companyName || job.company || 'Unknown Company',
                description: job.description,
                analysis: job.analysis,
                status: (job.status === 'analyzing' || job.status === 'error') ? 'saved' : job.status,
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
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = localJobs.map(j => j.id === updatedJob.id ? updatedJob : j);
        await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated);

        const userId = await getUserId();
        if (userId) {
            const { error } = await supabase.from('jobs').update({
                job_title: updatedJob.analysis?.distilledJob?.roleTitle || updatedJob.position,
                company: updatedJob.analysis?.distilledJob?.companyName || updatedJob.company,
                description: updatedJob.description,
                status: (updatedJob.status === 'analyzing' || updatedJob.status === 'error') ? 'saved' : updatedJob.status,
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
        const localJobs: SavedJob[] = await Vault.getSecure(STORAGE_KEYS.JOBS_HISTORY) || [];
        const updated = localJobs.filter(j => j.id !== id);
        await Vault.setSecure(STORAGE_KEYS.JOBS_HISTORY, updated);

        const userId = await getUserId();
        if (userId) {
            await supabase.from('jobs').delete().eq('id', id);
        }
        return updated;
    }
};
