import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Fetch and group order guide rows from view v_order_guide.
 * - Uses category_name from the joined categories table
 * - Respects category_rank for ordering
 * - Maps (on_hand -> actual) and (par_level -> forecast) for UI
 * - Includes cost, vendor, and admin fields
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

    console.log('🧪 Fetching with locationId:', locationId);
    console.log('📏 Length:', locationId.length);
    console.log('🔤 Valid UUID regex:',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(locationId)
    );

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('v1_order_guide')
        .select([
          'item_id',
          'location_id',
          'category_name',         // ✅ NEW: Use joined category name
          'category_rank',
          'item_name',
          'unit',
          'on_hand',
          'par_level',
          'order_quantity',
          'inventory_status',
          'item_status',
          'unit_cost',
          'total_cost',
          'vendor_name',
          'brand',
          'notes',
          'last_ordered_at',
        ].join(','))
        .eq('location_id', locationId)
        .order('category_rank', { ascending: true })
        .order('item_name', { ascending: true });

      // ✅ OPTIONAL: You can re-enable filtering by category_name if needed
      // if (category) query = query.eq('category_name', category);

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
      const cat = r.category_name || 'Uncategorized'; // ✅ FIXED: use category_name
      if (!grouped[cat]) grouped[cat] = [];

      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      grouped[cat].push({
        item_id: r.item_id ?? null,
        itemId: r.item_id ?? null,
        name: r.item_name || '',
        unit: r.unit ?? '',
        actual,
        forecast,
        variance,
        status: String(r.inventory_status || r.item_status || 'auto').toLowerCase(),
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
    groupedData: itemsByCategory, // legacy alias
    refresh: fetchData,
  };
}
