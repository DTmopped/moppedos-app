import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing env vars (helps catch Vercel/Netlify misconfig)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key is missing.');
  console.error('supabaseUrl:', supabaseUrl);
  console.error('supabaseAnonKey present:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
