// src/hooks/useOrderGuide.js
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';

const DEBUG = false;

export function useOrderGuide({ locationId, category = null } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!locationId) {
      setRows([]);
      setLoading(false);
      return;
    }

    // cancel any in-flight request
    abortRef.current?.abort?.();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('v_order_guide')
        .select(
          [
            'item_id',
            'category',
            'location_id',
            'name:item_name',   // alias so we can use r.name directly
            'unit',
            'on_hand',
            'par_level',
            'order_quantity',
            'inventory_status',
            'item_status',
          ].join(',')
        )
        .eq('location_id', locationId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (category) query = query.eq('category', category);

      const { data, error: qErr } = await query;
      if (ac.signal.aborted) return; // component unmounted or refetch started

      if (qErr) throw qErr;

      const safe = Array.isArray(data) ? data : [];
      if (DEBUG) console.debug('OrderGuide rows:', safe.length, safe);
      setRows(safe);
    } catch (err) {
      if (DEBUG) console.error('OrderGuide fetch error:', err);
      // ignore abort errors
      if (err?.name !== 'AbortError') setError(err);
    } finally {
      if (!abortRef.current?.signal?.aborted) setLoading(false);
    }
  }, [locationId, category]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort?.();
  }, [fetchData]);

  const flatItems = useMemo(() => {
    return rows.map((r) => {
      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));
      return {
        // IDs (both styles for compatibility)
        item_id: r.item_id ?? null,
        itemId: r.item_id ?? null,

        // display
        name: r.name || '',
        unit: r.unit ?? '',
        category: r.category || 'Uncategorized',

        // numbers
        actual,
        forecast,
        variance,
        order_quantity: r.order_quantity ?? null,

        // status
        status: String(r.inventory_status || r.item_status || 'auto').toLowerCase(),

        // raw
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        location_id: r.location_id ?? null,
      };
    });
  }, [rows]);

  const itemsByCategory = useMemo(() => {
    const grouped = {};
    for (const item of flatItems) {
      const cat = item.category || 'Uncategorized';
      (grouped[cat] ||= []).push(item);
    }
    return grouped;
  }, [flatItems]);

  return {
    isLoading,
    error,
    // old and new keys so existing components keep working
    groupedData: itemsByCategory,
    itemsByCategory,
    itemsFlat: flatItems,
    refresh: fetchData,
  };
}
