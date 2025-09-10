import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get location ID from localStorage (or fallback default for now)
const storedLocationId = localStorage.getItem('location_id');
const DEFAULT_LOCATION_ID = '00000000-0000-0000-0000-000000000001';
const CURRENT_LOCATION_ID = storedLocationId || DEFAULT_LOCATION_ID;

// Sanity check
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase ENV missing', { supabaseUrl, anonPresent: !!supabaseAnonKey });
}

// Create Supabase client with dynamic x-location-id header
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-location-id': CURRENT_LOCATION_ID,
    },
  },
});
