import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * IMMEDIATE FIX - Order Guide Hook
 * 
 * Based on debug results:
 * - 113 items exist in order_guide_items
 * - All items are marked is_active=false (that's why we got 0 results)
 * - Removing is_active filter will restore all 113 items
 * 
 * This gets your Order Guide working immediately!
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
      // ✅ IMMEDIATE FIX: Remove is_active filter to get all 113 items
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
        // ✅ REMOVED: .eq('is_active', true) - This was blocking all items
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
      
      // Log is_active status for cleanup planning
      if (data && data.length > 0) {
        const activeCount = data.filter(item => item.is_active).length;
        const inactiveCount = data.filter(item => !item.is_active).length;
        console.log('📊 Active items:', activeCount, '| Inactive items:', inactiveCount);
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
        
        // ✅ Include is_active for future cleanup reference
        is_active: row.is_active,
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

