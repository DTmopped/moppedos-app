import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// sanity checks in case envs are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase ENV missing', { supabaseUrl, anonPresent: !!supabaseAnonKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
// ⛔️ No custom fetch. ⛔️ No corsproxy. Just the client.
