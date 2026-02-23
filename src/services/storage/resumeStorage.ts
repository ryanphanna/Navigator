import { supabase } from '../supabase';
import { Vault, getUserId, areBlocksEqual } from './storageCore';
import { STORAGE_KEYS } from '../../constants';
import type { ResumeProfile } from '../../types';

export const ResumeStorage = {
    async getResumes(): Promise<ResumeProfile[]> {
        let profiles = await Vault.getSecure(STORAGE_KEYS.RESUMES) as ResumeProfile[];
        if (!profiles) {
            profiles = [{ id: 'primary', name: 'Primary Experience', blocks: [] }];
        }

        const userId = await getUserId();
        if (userId) {
            const { data } = await supabase
                .from('resumes')
                .select('content')
                .eq('user_id', userId)
                .maybeSingle();

            if (data?.content) {
                let cloudProfiles = data.content;
                if (typeof cloudProfiles === 'string') {
                    try {
                        cloudProfiles = JSON.parse(cloudProfiles);
                    } catch (e) {
                        console.error('Failed to parse resumes content string:', e);
                    }
                }

                if (Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
                    profiles = cloudProfiles;
                    await Vault.setSecure(STORAGE_KEYS.RESUMES, profiles);
                }
            }
        }
        return profiles;
    },

    async saveResumes(resumes: ResumeProfile[]) {
        await Vault.setSecure(STORAGE_KEYS.RESUMES, resumes);

        const userId = await getUserId();
        if (userId) {
            const { data, error: selectError } = await supabase.from('resumes').select('id').eq('user_id', userId).maybeSingle();
            if (selectError && selectError.code !== 'PGRST116') {
                console.error("Supabase select error in saveResumes:", selectError);
            }

            if (data) {
                const { error: updateError } = await supabase.from('resumes').update({ content: resumes, name: 'Default Profile' }).eq('id', data.id);
                if (updateError) console.error("Supabase update error:", updateError);
            } else {
                const { error: insertError } = await supabase.from('resumes').insert({ user_id: userId, name: 'Default Profile', content: resumes });
                if (insertError) console.error("Supabase insert error:", insertError);
            }
        }
    },

    async addResume(profile: ResumeProfile) {
        const existing: ResumeProfile[] = await Vault.getSecure(STORAGE_KEYS.RESUMES) || [];
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
            updated = [{ ...master, blocks: newBlocks }, ...existing.slice(1)];
        }

        await Vault.setSecure(STORAGE_KEYS.RESUMES, updated);
        const userId = await getUserId();
        if (userId) {
            const { data: existingRow, error: selectError } = await supabase.from('resumes').select('id').eq('user_id', userId).maybeSingle();
            if (selectError && selectError.code !== 'PGRST116') {
                console.error("Supabase select error in addResume:", selectError);
            }

            if (existingRow) {
                const { error: updateError } = await supabase.from('resumes').update({ content: updated }).eq('user_id', userId);
                if (updateError) console.error("Supabase update error:", updateError);
            } else {
                const { error: insertError } = await supabase.from('resumes').insert({ user_id: userId, name: 'Default Profile', content: updated });
                if (insertError) console.error("Supabase insert error:", insertError);
            }
        }
        return updated;
    }
};
