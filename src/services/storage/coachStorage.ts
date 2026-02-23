import { supabase } from '../supabase';
import { Vault, getUserId } from './storageCore';
import { STORAGE_KEYS } from '../../constants';
import type { RoleModelProfile, TargetJob } from '../../types';

export const CoachStorage = {
    async getRoleModels(): Promise<RoleModelProfile[]> {
        let roleModels: RoleModelProfile[] = await Vault.getSecure(STORAGE_KEYS.ROLE_MODELS) || [];
        const userId = await getUserId();
        if (userId) {
            const { data, error } = await supabase
                .from('role_models')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const cloudModels: RoleModelProfile[] = data.map(row => ({ ...row.content, id: row.id }));

                // Non-destructive merge: cloud IDs always win, but keep local-only models that haven't synced yet
                const cloudIds = new Set(cloudModels.map(m => m.id));
                const unsyncedModels = roleModels.filter(m => !cloudIds.has(m.id));

                roleModels = [...cloudModels, ...unsyncedModels];
                await Vault.setSecure(STORAGE_KEYS.ROLE_MODELS, roleModels);
            }
        }
        return roleModels;
    },

    async addRoleModel(roleModel: RoleModelProfile) {
        const existing: RoleModelProfile[] = await Vault.getSecure(STORAGE_KEYS.ROLE_MODELS) || [];
        const updated = [roleModel, ...existing];
        await Vault.setSecure(STORAGE_KEYS.ROLE_MODELS, updated);

        const userId = await getUserId();
        if (userId) {
            await supabase.from('role_models').insert({
                id: roleModel.id,
                user_id: userId,
                name: roleModel.name,
                content: roleModel
            });
        }
        return updated;
    },

    async deleteRoleModel(id: string) {
        const existing: RoleModelProfile[] = await Vault.getSecure(STORAGE_KEYS.ROLE_MODELS) || [];
        const updated = existing.filter(rm => rm.id !== id);
        await Vault.setSecure(STORAGE_KEYS.ROLE_MODELS, updated);

        const userId = await getUserId();
        if (userId) {
            await supabase.from('role_models').delete().eq('id', id);
        }
        return updated;
    },

    async getTargetJobs(): Promise<TargetJob[]> {
        let targetJobs: TargetJob[] = await Vault.getSecure(STORAGE_KEYS.TARGET_JOBS) || [];
        const userId = await getUserId();
        if (userId) {
            const { data, error } = await supabase
                .from('target_jobs')
                .select('*')
                .eq('user_id', userId)
                .order('date_added', { ascending: false });

            if (!error && data) {
                const cloudTargets: TargetJob[] = data.map(row => ({
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

                // Non-destructive merge
                const cloudIds = new Set(cloudTargets.map(t => t.id));
                const unsyncedTargets = targetJobs.filter(t => !cloudIds.has(t.id));

                targetJobs = [...cloudTargets, ...unsyncedTargets].sort((a, b) => b.dateAdded - a.dateAdded);
                await Vault.setSecure(STORAGE_KEYS.TARGET_JOBS, targetJobs);
            }
        }
        return targetJobs;
    },

    async saveTargetJob(targetJob: TargetJob) {
        const existing: TargetJob[] = await Vault.getSecure(STORAGE_KEYS.TARGET_JOBS) || [];
        const index = existing.findIndex(tj => tj.id === targetJob.id);
        let updated: TargetJob[];

        if (index !== -1) {
            updated = [...existing];
            updated[index] = targetJob;
        } else {
            updated = [targetJob, ...existing];
        }
        await Vault.setSecure(STORAGE_KEYS.TARGET_JOBS, updated);

        const userId = await getUserId();
        if (userId) {
            await supabase.from('target_jobs').upsert({
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
        }
        return updated;
    },

    async deleteTargetJob(id: string) {
        const existing: TargetJob[] = await Vault.getSecure(STORAGE_KEYS.TARGET_JOBS) || [];
        const updated = existing.filter(tj => tj.id !== id);
        await Vault.setSecure(STORAGE_KEYS.TARGET_JOBS, updated);

        const userId = await getUserId();
        if (userId) {
            await supabase.from('target_jobs').delete().eq('id', id);
        }
        return updated;
    }
};
