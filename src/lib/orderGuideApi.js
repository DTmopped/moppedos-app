// src/lib/orderGuideApi.js
import { supabase } from '@/supabaseClient';

/**
 * We always include the anon key so the Edge Function endpoint
 * accepts the request even if there's no signed-in user.
 * (If a user is signed in, Supabase will also send their auth token.)
 */
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const edgeHeaders = anonKey ? { Authorization: `Bearer ${anonKey}` } : undefined;

/**
 * Update PAR (forecast) for one item at one location.
 * @param {{ item_id: string, location_id: string, par_level: number }} params
 * @returns {Promise<any>}
 */
export async function updateParLevel({ item_id, location_id, par_level }) {
  const { data, error } = await supabase.functions.invoke('update-par-level', {
    body: { item_id, location_id, par_level },
    headers: edgeHeaders,
  });
  if (error) throw error;
  return data;
}

/**
 * Update On Hand (actual) for one item at one location.
 * @param {{ item_id: string, location_id: string, on_hand: number }} params
 * @returns {Promise<any>}
 */
export async function updateOnHand({ item_id, location_id, on_hand }) {
  const { data, error } = await supabase.functions.invoke('update-on-hand', {
    body: { item_id, location_id, on_hand },
    headers: edgeHeaders,
  });
  if (error) throw error;
  return data;
}

/**
 * Create/upsert items and link them to locations via the Edge Function.
 * @param {Array<{ itemName: string, categoryId: number, unit: string, locationIds: string[] }>} items
 * @returns {Promise<{ ok: boolean, results: Array<any> }>}
 */
export async function submitOrderGuideItems(items) {
  const { data, error } = await supabase.functions.invoke('fix-order-guide', {
    body: { items },
    headers: edgeHeaders,
  });
  if (error) throw error;
  return data; // { ok: true, results: [...] }
}
