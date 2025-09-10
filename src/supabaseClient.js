import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Optional: pull location from a global config, env, or hardcode for now
const CURRENT_LOCATION_ID = '00000000-0000-0000-0000-000000000001'; // <-- replace with real UUID

// sanity checks in case envs are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase ENV missing', { supabaseUrl, anonPresent: !!supabaseAnonKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-location-id': CURRENT_LOCATION_ID, // 💡 Set this dynamically later
    },
  },
});
