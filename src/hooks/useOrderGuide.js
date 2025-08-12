import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

export function useOrderGuide({ locationId, category = null, includeInactive = true } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!locationId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('v_order_guide')
        .select(
          [
            'item_id',              // <-- add this
            'category',
            'location_id',
            'item_name',            // keep original name, we’ll map below
            'unit',
            'on_hand',
            'par_level',
            'order_quantity',
            'inventory_status',
            'item_status',
          ].join(',')
        )
        .eq('location_id', locationId);

      if (category) query = query.eq('category', category);

      query = query
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [locationId, category, includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const itemsByCategory = useMemo(() => {
    const grouped = {};
    for (const r of rows) {
      const cat = r.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];

      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      grouped[cat].push({
        item_id: r.item_id,                          // <-- keep id
        name: r.item_name || '',
        unit: r.unit ?? '',
        actual,
        forecast,
        variance,
        status: String(r.inventory_status || r.item_status || 'auto').toLowerCase(),
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        order_quantity: r.order_quantity ?? null,
      });
    }
    return grouped;
  }, [rows]);

  return {
    loading: isLoading,
    isLoading,
    error,
    groupedData: itemsByCategory,
    itemsByCategory,
    refresh: fetchData,
  };
}
