import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rejhbsmfcueudfbhadgh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlamhic21mY3VldWRmYmhhZGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NjA3NzYsImV4cCI6MjA2NDUzNjc3Nn0.6S8CqB_4JBcg8hW0L1iGAi1P2_46k6CTyeCgfwjX8Z4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);