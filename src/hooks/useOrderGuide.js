// src/hooks/useOrderGuide.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Fetch order guide rows from view v_order_guide and group by category
 * @param {{ locationId: string|null }} params
 * @returns {{ loading: boolean, error: any, groupedData: Record<string, any[]>, refresh: () => Promise<void> }}
 */
export function useOrderGuide({ locationId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchData = useCallback(async () => {
    if (!locationId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("v_order_guide")
        .select("*")
        .eq("location_id", locationId)
        .order("category", { ascending: true })
        .order("item_name", { ascending: true });

      if (qErr) throw qErr;
      setRows(data ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group into { [category]: [items] } and map to UI shape
  const groupedData = useMemo(() => {
    const grouped = {};
    for (const r of rows) {
      const cat = r.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];

      const actual   = Number(r.on_hand ?? 0);
      const forecast = Number(r.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      grouped[cat].push({
        name: r.item_name ?? r.name ?? "",
        unit: r.unit ?? "",
        actual,
        forecast,
        variance,
        status: String(r.inventory_status || r.item_status || r.status || "auto").toLowerCase(),
        // keep raw fields in case you want to show them later
        on_hand: r.on_hand ?? null,
        par_level: r.par_level ?? null,
        order_quantity: r.order_quantity ?? null,
      });
    }
    return grouped;
  }, [rows]);

  return { loading, error, groupedData, refresh: fetchData };
}
