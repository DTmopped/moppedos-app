import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useOrderGuide(locationId) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_order_guide')
        .select('*')
        .eq('location_id', locationId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (!cancelled) {
        if (error) console.error('fetch v_order_guide:', error.message);
        setRows(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [locationId]);

  // Group to match your current UI shape
  const grouped = useMemo(() => {
    const out = {};
    for (const r of rows) {
      const cat = r.category || 'Uncategorized';
      if (!out[cat]) out[cat] = [];
      out[cat].push({
        name: r.item_name,
        // map DB -> UI fields
        forecast: r.par_level ?? 0,                    // UI "Forecast" = PAR
        actual: r.on_hand ?? 0,                        // UI "Actual"   = On hand
        variance: ((r.on_hand ?? 0) - (r.par_level ?? 0)).toFixed(1),
        unit: r.unit,
        status: r.item_status || 'auto',
        _meta: {
          item_id: r.item_id,
          location_id: r.location_id,
          order_qty: r.order_quantity,
          inv_status: r.inventory_status,
        }
      });
    }
    return out;
  }, [rows]);

  return { grouped, loading, rows };
}
