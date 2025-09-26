import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mopped Test Site Configuration
const MOPPED_TEST_LOCATION_UUID = 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b';
const MOPPED_TEST_USER_UUID = '07ec9768-5c16-4167-8b9d-3538e6eaa10a';

// Get location ID from localStorage or use test site default
const storedLocationId = localStorage.getItem('location_id');
const CURRENT_LOCATION_ID = storedLocationId || MOPPED_TEST_LOCATION_UUID;

// Create Supabase client with dynamic x-location-id header
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { headers: { 'x-location-id': CURRENT_LOCATION_ID } }
});

// Multi-tenant helper functions
export const getCurrentLocationId = () => CURRENT_LOCATION_ID;
export const getMoppedTestLocationId = () => MOPPED_TEST_LOCATION_UUID;
export const isUsingTestSite = () => CURRENT_LOCATION_ID === MOPPED_TEST_LOCATION_UUID;

// Enhanced query helper for multi-tenant operations
export const createLocationQuery = (tableName) => {
  return supabase.from(tableName).select('*').eq('location_id', CURRENT_LOCATION_ID);
};

// Enhanced upsert helper for multi-tenant operations
export const createLocationUpsert = (tableName, data, conflictColumns = ['location_id']) => {
  const payload = { ...data, location_id: CURRENT_LOCATION_ID, updated_at: new Date().toISOString() };
  return supabase.from(tableName).upsert(payload, { onConflict: conflictColumns.join(',') }).select();
};

export const getConnectionInfo = () => ({
  supabaseUrl, hasAnonKey: !!supabaseAnonKey, currentLocationId: CURRENT_LOCATION_ID,
  isTestSite: isUsingTestSite(), testLocationId: MOPPED_TEST_LOCATION_UUID, testUserId: MOPPED_TEST_USER_UUID
});

export default supabase;
