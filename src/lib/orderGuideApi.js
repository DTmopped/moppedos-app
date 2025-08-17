// src/lib/orderGuideApi.js
import { supabase } from '@/supabaseClient';

/**
 * Optional: include anon key so Edge Functions accept requests
 * even if no user is signed in. (If a user IS signed in, the
 * client will also send their auth token automatically.)
 */
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const edgeHeaders = anonKey ? { Authorization: `Bearer ${anonKey}` } : undefined;

/**
 * Update PAR (forecast) for one item at one location.
 * @param {{ item_id: string, location_id: string, par_level: number }} params
 */
export async function updateParLevel({ item_id, location_id, par_level }) {
  const { data, error } = await supabase.functions.invoke('update-par-level', {
    method: 'POST',
    body: { item_id, location_id, par_level: Number(par_level) },
    headers: edgeHeaders,
  });
  if (error) throw error;
  return data;
}

/**
 * Update On Hand (actual) for one item at one location.
 * @param {{ item_id: string, location_id: string, on_hand: number }} params
 */
export async function updateOnHand({ item_id, location_id, on_hand }) {
  const { data, error } = await supabase.functions.invoke('update-on-hand', {
    method: 'POST',
    body: { item_id, location_id, on_hand: Number(on_hand) },
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
    method: 'POST',
    body: { items },
    headers: edgeHeaders,
  });
  if (error) throw error;
  return data; // { ok: true, results: [...] }
}
