import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials. Cloud features will be disabled.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};
