// src/hooks/useOrderGuide.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Fetch order guide rows from view v_order_guide and group by category.
 *
 * @param {{ locationId: string | null, category?: string | null, includeInactive?: boolean }}
 */
export function useOrderGuide({ locationId, category = null, includeInactive = true } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    // Bail early if no location selected yet
    if (!locationId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Select only what we need; alias item_name -> name so UI always has a "name"
      let query = supabase
        .from('v_order_guide')
        .select(
          [
            'category',
            'location_id',
            'item_name:name',        // <-- alias here
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

      // When/if an "active" flag exists in the view, use includeInactive to filter here

      query = query.order('category', { ascending: true }).order('item_name', { ascending: true });

      const { data, error: qErr, status, statusText } = await query;

      if (qErr) {
        // Give a richer error to the UI
        const enriched = new Error(qErr.message || 'Failed to load order guide');
        enriched.details = qErr.details;
        enriched.hint = qErr.hint;
        enriched.status = status;
        enriched.statusText = statusText;
        throw enriched;
      }

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

  // Group into { [category]: [items] } and map to the UI shape
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    for (const r of rows) {
      const cat = r.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];

      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      grouped[cat].push({
        name: r.name || '', // thanks to alias this should be filled if item_name exists
        unit: r.unit ?? '',
        actual,
        forecast,
        variance,
        status: String(r.inventory_status || r.item_status || 'auto').toLowerCase(),
        // raw fields kept for future UI
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        order_quantity: r.order_quantity ?? null,
      });
    }
    return grouped;
  }, [rows]);

  // Backward-compatible return shape
  const loading = isLoading;
  const groupedData = itemsByCategory;

  return { loading, isLoading, error, groupedData, itemsByCategory, refresh: fetchData };
}
