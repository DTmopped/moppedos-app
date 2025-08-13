// src/hooks/useOrderGuide.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Fetch and group order guide rows from view v_order_guide.
 * - Forces a friendly category order (see categoryOrder below)
 * - Hides placeholder "TBD" items by default (configurable)
 */
export function useOrderGuide({
  locationId,
  category = null,
  includeInactive = true,     // reserved for later
  hideTBD = true,             // ⬅️ default: hide placeholders
} = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Desired top-to-bottom order on the page
  const categoryOrder = useMemo(
    () => ([
      'Meats',
      'Sides',
      'Bread',
      'Dessert',
      'Condiments',
      'PaperGoods',        // keep internal key as used in DB
      'CleaningSupplies',
    ]),
    []
  );

  const orderIndex = useMemo(() => {
    const m = new Map();
    categoryOrder.forEach((c, i) => m.set(c, i));
    return m;
  }, [categoryOrder]);

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
          'location_id',
          'item_name',
          'unit',
          'on_hand',
          'par_level',
          'order_quantity',
          'inventory_status',
          'item_status',
        ].join(','))
        .eq('location_id', locationId);

      if (category) query = query.eq('category', category);

      // Pull raw sorted by category + name for stable diffs
      query = query.order('category', { ascending: true })
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

  /**
   * Group into { [category]: [items...] } with:
   * - TBD rows filtered (unless hideTBD=false)
   * - Categories re-ordered by categoryOrder
   */
  const itemsByCategory = useMemo(() => {
    // 1) optional filter out TBD placeholders
    const cleaned = hideTBD
      ? rows.filter(r => (r.item_name || '').trim().toLowerCase() !== 'tbd')
      : rows;

    // 2) group
    const tmp = new Map(); // Map to preserve later sorting
    for (const r of cleaned) {
      const cat = r.category || 'Uncategorized';
      if (!tmp.has(cat)) tmp.set(cat, []);
      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));
      tmp.get(cat).push({
        item_id: r.item_id ?? null,
        itemId: r.item_id ?? null, // compatibility
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

    // 3) sort categories by our preferred order, then item name
    const sortedCats = [...tmp.keys()].sort((a, b) => {
      const ia = orderIndex.has(a) ? orderIndex.get(a) : 99;
      const ib = orderIndex.has(b) ? orderIndex.get(b) : 99;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });

    const out = {};
    for (const cat of sortedCats) {
      const arr = tmp.get(cat) || [];
      arr.sort((x, y) => x.name.localeCompare(y.name));
      out[cat] = arr;
    }
    return out;
  }, [rows, hideTBD, orderIndex]);

  return {
    isLoading,
    error,
    groupedData: itemsByCategory, // legacy name some components expect
    itemsByCategory,
    refresh: fetchData,
  };
}
