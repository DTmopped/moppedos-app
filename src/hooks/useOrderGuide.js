// src/hooks/useOrderGuide.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Fetch order guide rows from v_order_guide for a location
 * and group them by category, including cost calculations.
 */
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
        .select([
          'item_id',
          'category',
          'category_rank',
          'location_id',
          'item_name',
          'unit',
          'cost_per_unit',
          'on_hand',
          'par_level',
          'order_quantity',
          'est_total',
          'inventory_status',
          'item_status',
        ].join(','))
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
  }, [locationId, category, includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group into { [category]: [items...] } and compute totals
  const { itemsByCategory, grandTotal } = useMemo(() => {
    const grouped = {};
    let total = 0;

    for (const r of rows) {
      const cat = r.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];

      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));
      const orderQty = Number(r.order_quantity ?? 0);
      const unitCost = Number(r.cost_per_unit ?? 0);
      const estTotal = Number(r.est_total ?? (orderQty * unitCost));

      total += estTotal;

      grouped[cat].push({
        // IDs
        item_id: r.item_id ?? null,
        itemId: r.item_id ?? null,

        // Display fields
        name: r.item_name || '',
        unit: r.unit ?? '',

        // Numbers used by the UI
        actual,
        forecast,
        variance,
        order_quantity: orderQty,

        // Costs
        cost_per_unit: unitCost,
        est_total: estTotal,

        // Status (prefer inventory_status)
        status: String(r.inventory_status || r.item_status || 'auto').toLowerCase(),

        // Raw fields
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        category_rank: r.category_rank ?? 99,
      });
    }

    return { itemsByCategory: grouped, grandTotal: Number(total.toFixed(2)) };
  }, [rows]);

  return {
    isLoading,
    error,
    groupedData: itemsByCategory, // back-compat
    itemsByCategory,
    grandTotal,
    refresh: fetchData,
  };
}
