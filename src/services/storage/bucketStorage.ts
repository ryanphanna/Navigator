import { supabase } from '../supabase';

export interface CanonicalRole {
    id: string; // The canonical title (e.g. 'Software Engineer')
    guidelines?: {
        promptAdvice?: string[];
        tailoringFocus?: string[];
        coverLetterStrategy?: string;
    };
    created_at?: string;
}

export const BucketStorage = {
    async getBucket(title: string): Promise<CanonicalRole | null> {
        const { data, error } = await supabase
            .from('canonical_roles')
            .select('*')
            .eq('id', title)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching bucket:', error);
            return null;
        }

        return data;
    },

    async ensureBucket(title: string): Promise<void> {
        // Just insert if not exists, do nothing if it does
        const { error } = await supabase
            .from('canonical_roles')
            .upsert({ id: title }, { onConflict: 'id' });

        if (error) {
            console.error('Error ensuring bucket:', error);
        }
    },

    async searchBuckets(query: string): Promise<CanonicalRole[]> {
        const { data, error } = await supabase
            .from('canonical_roles')
            .select('*')
            .ilike('id', `%${query}%`)
            .limit(10);

        if (error) {
            console.error('Error searching buckets:', error);
            return [];
        }

        return data || [];
    }
};
