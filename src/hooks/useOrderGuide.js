import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Fetch and group order guide rows from canonical view v_order_guide_current.
 * - Respects category_rank from the view for stable ordering
 * - Maps (on_hand -> actual) and (par_level -> forecast) for UI
 */
export function useOrderGuide({ locationId, category = null } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!locationId) {
      console.warn('⛔ No locationId provided to useOrderGuide');
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
     let query = supabase
  .from('v_order_guide_current')
  .select(`
    item_id,
    location_id,
    category_name as category,
    category_rank,
    item_name,
    unit,
    on_hand,
    par_level,
    order_quantity,
    unit_cost,
    total_cost,
    vendor_name,
    brand,
    notes,
    last_ordered_at
  `)
  .eq('location_id', locationId)
  .order('category_rank', { ascending: true })
  .order('item_name', { ascending: true });
      
      if (category) query = query.eq('category', category);

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [locationId, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const itemsByCategory = useMemo(() => {
    const grouped = {};
    console.log('🧾 Raw rows from Supabase:', rows);

    for (const r of rows) {
      const cat = r.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];

      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      grouped[cat].push({
        item_id: r.item_id ?? null,
        name: r.item_name || '',
        unit: r.unit ?? '',
        actual,
        forecast,
        variance,
        // ✅ Removed inventory_status and item_status (they don't exist in the view)
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        order_quantity: r.order_quantity ?? null,
        unit_cost: r.unit_cost ?? null,
        total_cost: r.total_cost ?? null,
        vendor_name: r.vendor_name ?? '',
        brand: r.brand ?? '',
        notes: r.notes ?? '',
        last_ordered_at: r.last_ordered_at ?? null,
      });
    }

    return grouped;
  }, [rows]);

  return {
    isLoading,
    error,
    itemsByCategory,
    groupedData: itemsByCategory,
    refresh: fetchData,
  };
}
