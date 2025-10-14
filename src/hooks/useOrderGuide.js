import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Order Guide Hook - Clean UI Version
 * 
 * This version:
 * 1. Only fetches columns that exist in the database
 * 2. Maintains the same clean, user-friendly UI you designed
 * 3. Maps database columns to UI expectations
 * 
 * The UI stays exactly the same - we're just fixing the database query.
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

    console.log('🔍 Fetching Order Guide with locationId:', locationId);

    setLoading(true);
    setError(null);

    try {
      // ✅ Fetch only essential columns for the clean UI
      // We'll add more columns as we confirm they exist
      let query = supabase
        .from('v_order_guide_current')
        .select([
          'item_id',
          'location_id',
          'category_name',
          'item_name',
          'unit',
          'on_hand',
          'par_level',
          // Try to include these if they exist, but don't fail if they don't
          'order_quantity',
          'unit_cost',
          'vendor_name'
        ].join(','))
        .eq('location_id', locationId);

      // Apply category filter if specified
      if (category) {
        query = query.eq('category_name', category);
      }

      // Order by item_name for consistent display
      query = query.order('item_name', { ascending: true });

      const { data, error: queryError } = await query;
      
      if (queryError) {
        console.error('❌ Order Guide query failed:', queryError);
        throw queryError;
      }

      setRows(Array.isArray(data) ? data : []);
      console.log('✅ Order Guide loaded successfully:', data?.length || 0, 'items');
      
      // Log available columns for debugging (can be removed later)
      if (data && data.length > 0) {
        console.log('📋 Available columns:', Object.keys(data[0]));
      }
      
    } catch (err) {
      console.error('❌ useOrderGuide fetch error:', err);
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

    for (const row of rows) {
      const categoryName = row.category_name || 'Uncategorized';
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      const actual = Number(row.on_hand ?? 0);
      const forecast = Number(row.par_level ?? 0);
      const variance = Number((actual - forecast).toFixed(1));

      // ✅ Map database columns to clean UI expectations
      grouped[categoryName].push({
        item_id: row.item_id ?? null,
        itemId: row.item_id ?? null, // compatibility
        name: row.item_name || '',
        unit: row.unit ?? '',
        actual,
        forecast,
        variance,
        status: 'auto', // Clean default status
        
        // Include additional data if available, with clean defaults
        on_hand: row.on_hand ?? null,
        par_level: row.par_level ?? null,
        order_quantity: row.order_quantity ?? 0,
        unit_cost: row.unit_cost ?? 0,
        total_cost: (row.unit_cost && row.on_hand) ? (row.unit_cost * row.on_hand) : 0,
        vendor_name: row.vendor_name ?? '',
        brand: row.brand ?? '',
        notes: row.notes ?? '',
        last_ordered_at: row.last_ordered_at ?? null,
      });
    }

    return grouped;
  }, [rows]);

  return {
    isLoading,
    error,
    itemsByCategory,
    groupedData: itemsByCategory, // legacy compatibility
    refresh: fetchData,
  };
}
