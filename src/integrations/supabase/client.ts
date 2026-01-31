import { createClient } from '@supabase/supabase-js';

// Support both Vite (VITE_) and Next.js (NEXT_PUBLIC_) style env vars
const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://cwzdqduyotcbwujmrohz.supabase.co';

const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    'sb_publishable_l2dqR-V5py1BmaOiivWAeA_pWtgIadq';

// Validate and clean URLs (handle cases where they might be 'undefined' as string)
const cleanUrl = supabaseUrl && supabaseUrl !== 'undefined' ? supabaseUrl : '';
const cleanKey = supabaseAnonKey && supabaseAnonKey !== 'undefined' ? supabaseAnonKey : '';

if (!cleanUrl || !cleanKey) {
    console.error('Supabase configuration error: URL or Anon focal key is missing.');
}

export const supabase = createClient(cleanUrl, cleanKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

