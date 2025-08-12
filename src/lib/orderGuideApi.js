import { supabase } from '@/supabaseClient';

// Requires the user to be signed in (so supabase.functions includes auth)
export async function updateParLevel({ item_id, location_id, par_level }) {
  const { data, error } = await supabase.functions.invoke('update-par-level', {
    method: 'POST',
    body: { item_id, location_id, par_level },
  });
  if (error) throw error;
  return data;
}

export async function updateOnHand({ item_id, location_id, on_hand }) {
  const { data, error } = await supabase.functions.invoke('update-on-hand', {
    method: 'POST',
    body: { item_id, location_id, on_hand },
  });
  if (error) throw error;
  return data;
}
