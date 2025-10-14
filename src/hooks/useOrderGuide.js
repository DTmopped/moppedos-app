import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * COMPLETE FIX - Order Guide Hook
 * 
 * This version queries order_guide_items directly (113 items) instead of 
 * the incomplete v_order_guide_current view (5 items).
 * 
 * This will restore ALL your v1 Order Guide items!
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

    console.log('🔍 Fetching Order Guide from order_guide_items with locationId:', locationId);

    setLoading(true);
    setError(null);

    try {
      // ✅ COMPLETE FIX: Query order_guide_items directly (has all 113 items)
      let query = supabase
        .from('order_guide_items')
        .select([
          'id',
          'item_name',
          'category',
          'unit',
          'par_level',
          'actual',
          'forecast',
          'variance',
          'unit_cost',
          'cost_per_unit',
          'vendor',
          'brand',
          'distributor',
          'category_rank',
          'status',
          'description',
          'sku',
          'location_id',
          'is_active'
        ].join(','))
        .eq('location_id', locationId)
        .eq('is_active', true) // Only active items
        .order('category_rank', { ascending: true })
        .order('item_name', { ascending: true });

      // Apply category filter if specified
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error: queryError } = await query;
      
      if (queryError) {
        console.error('❌ Order Guide query failed:', queryError);
        throw queryError;
      }

      setRows(Array.isArray(data) ? data : []);
      console.log('✅ Order Guide loaded successfully:', data?.length || 0, 'items from order_guide_items');
      
      // Log available columns for debugging
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
      // ✅ Use 'category' field from order_guide_items
      const categoryName = row.category || 'Uncategorized';
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      // ✅ Map order_guide_items columns to UI expectations
      const actual = Number(row.actual ?? row.par_level ?? 0);
      const forecast = Number(row.forecast ?? row.par_level ?? 0);
      const variance = Number(row.variance ?? (actual - forecast).toFixed(1));

      grouped[categoryName].push({
        item_id: row.id ?? null,
        itemId: row.id ?? null, // compatibility
        name: row.item_name || '',
        unit: row.unit ?? '',
        actual,
        forecast,
        variance,
        status: String(row.status || 'auto').toLowerCase(),
        
        // ✅ Include rich data from order_guide_items
        on_hand: row.actual ?? row.par_level ?? null,
        par_level: row.par_level ?? null,
        order_quantity: variance > 0 ? 0 : Math.abs(variance), // Calculate order quantity
        unit_cost: row.unit_cost ?? row.cost_per_unit ?? 0,
        total_cost: (row.unit_cost ?? row.cost_per_unit ?? 0) * actual,
        vendor_name: row.vendor ?? row.distributor ?? '',
        brand: row.brand ?? '',
        notes: row.description ?? '',
        sku: row.sku ?? '',
        last_ordered_at: null, // Not available in order_guide_items
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

