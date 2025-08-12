// src/hooks/useOrderGuide.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from '@/supabaseClient';

/**
 * Fetch order guide rows from view v_order_guide and group by category.
 *
 * @param {{ locationId: string | null, category?: string | null, includeInactive?: boolean }}
 *        locationId  - UUID from `locations` (required to fetch)
 *        category    - optional category filter (e.g., "BBQ")
 *        includeInactive - future flag for inactive items (not used yet)
 *
 * @returns {{
 *   isLoading: boolean,
 *   error: any,
 *   itemsByCategory: Record<string, any[]>,
 *   refresh: () => Promise<void>
 * }}
 */
export function useOrderGuide({ locationId, category = null, includeInactive = true } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    // If no location chosen yet, return empty quickly (prevents errors)
    if (!locationId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("v_order_guide")
        .select("*")
        .eq("location_id", locationId);

      if (category) query = query.eq("category", category);

      // When you add an "active" flag to the view, you can use includeInactive here.

      query = query.order("category", { ascending: true }).order("item_name", { ascending: true });

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;

      setRows(data ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [locationId, category, includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group into { [category]: [items] } and map to UI shape expected by the table/printable
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    for (const r of rows) {
      const cat = r.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];

      const actual = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      grouped[cat].push({
        name: r.item_name ?? r.name ?? "",
        unit: r.unit ?? "",
        actual,
        forecast,
        variance,
        status: String(r.inventory_status || r.item_status || r.status || "auto").toLowerCase(),
        // raw fields kept for later UI enhancements
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        order_quantity: r.order_quantity ?? null,
      });
    }
    return grouped;
  }, [rows]);

  return { isLoading, error, itemsByCategory, refresh: fetchData };
}
