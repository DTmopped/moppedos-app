import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Fetches items for the order guide from the DB view (v_order_guide)
 * and groups them by category for the UI.
 *
 * @param {string} locationId - UUID from `locations` table.
 */
export function useOrderGuide(locationId) {
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
      // Pull from your view with all the useful computed fields
      const { data, error: qErr } = await supabase
        .from("v_order_guide")
        .select("*")
        .eq("location_id", locationId)
        .order("category", { ascending: true })
        .order("item_name", { ascending: true });

      if (qErr) throw qErr;
      setRows(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group into the shape your UI expects: { [category]: [items...] }
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    for (const r of rows) {
      const cat = r.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      // Normalize row to existing UI item shape
      grouped[cat].push({
        name: r.item_name ?? r.name ?? "",
        forecast: Number(r.forecast ?? 0),
        actual: Number(r.actual ?? 0),
        variance: Number(r.variance ?? 0),
        unit: r.unit ?? "",
        status: r.item_status ?? r.status ?? "auto",
        // include on_hand / par_level / order_quantity if you want to show them later
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        order_quantity: r.order_quantity ?? null,
      });
    }
    return grouped;
  }, [rows]);

  return { isLoading, error, itemsByCategory, refresh: fetchData };
}
