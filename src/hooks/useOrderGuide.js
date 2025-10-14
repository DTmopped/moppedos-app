import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * DEBUG VERSION - Order Guide Hook
 * 
 * This version will help us identify why 0 items are being returned
 * from the order_guide_items table that should have 113 items.
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

    console.log('🔍 DEBUG: Fetching Order Guide from order_guide_items');
    console.log('🔍 DEBUG: Using locationId:', locationId);
    console.log('🔍 DEBUG: LocationId type:', typeof locationId);

    setLoading(true);
    setError(null);

    try {
      // ✅ DEBUG: First, let's see what location_ids exist in the table
      console.log('🔍 DEBUG: Checking all location_ids in order_guide_items...');
      const { data: locationCheck, error: locationError } = await supabase
        .from('order_guide_items')
        .select('location_id')
        .limit(10);

      if (locationError) {
        console.error('❌ DEBUG: Error checking locations:', locationError);
      } else {
        console.log('🔍 DEBUG: Found location_ids in table:', locationCheck?.map(l => l.location_id));
      }

      // ✅ DEBUG: Check total count without filters
      const { count: totalCount, error: countError } = await supabase
        .from('order_guide_items')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ DEBUG: Error counting total items:', countError);
      } else {
        console.log('🔍 DEBUG: Total items in order_guide_items:', totalCount);
      }

      // ✅ DEBUG: Try query without is_active filter first
      console.log('🔍 DEBUG: Querying without is_active filter...');
      let debugQuery = supabase
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
          'location_id'
        ].join(','))
        .eq('location_id', locationId)
        // ✅ DEBUG: Remove is_active filter to see all items
        .limit(20); // Limit for debugging

      const { data: debugData, error: debugError } = await debugQuery;
      
      if (debugError) {
        console.error('❌ DEBUG: Query without is_active filter failed:', debugError);
      } else {
        console.log('🔍 DEBUG: Items found without is_active filter:', debugData?.length || 0);
        if (debugData && debugData.length > 0) {
          console.log('🔍 DEBUG: Sample item:', debugData[0]);
          console.log('🔍 DEBUG: is_active values:', debugData.map(item => item.is_active));
        }
      }

      // ✅ Now try the original query with is_active filter
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
        .eq('is_active', true)
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
      
      // ✅ DEBUG: If no items found, try alternative approaches
      if (!data || data.length === 0) {
        console.log('🔍 DEBUG: No items found with is_active=true, trying alternatives...');
        
        // Try without is_active filter
        const { data: altData, error: altError } = await supabase
          .from('order_guide_items')
          .select('id, item_name, category, is_active, location_id')
          .eq('location_id', locationId)
          .limit(10);
          
        if (altError) {
          console.error('❌ DEBUG: Alternative query failed:', altError);
        } else {
          console.log('🔍 DEBUG: Alternative query found:', altData?.length || 0, 'items');
          console.log('🔍 DEBUG: Sample alternative data:', altData?.[0]);
        }
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

      const actual = Number(row.actual ?? row.par_level ?? 0);
      const forecast = Number(row.forecast ?? row.par_level ?? 0);
      const variance = Number(row.variance ?? (actual - forecast).toFixed(1));

      grouped[categoryName].push({
        item_id: row.id ?? null,
        itemId: row.id ?? null,
        name: row.item_name || '',
        unit: row.unit ?? '',
        actual,
        forecast,
        variance,
        status: String(row.status || 'auto').toLowerCase(),
        on_hand: row.actual ?? row.par_level ?? null,
        par_level: row.par_level ?? null,
        order_quantity: variance > 0 ? 0 : Math.abs(variance),
        unit_cost: row.unit_cost ?? row.cost_per_unit ?? 0,
        total_cost: (row.unit_cost ?? row.cost_per_unit ?? 0) * actual,
        vendor_name: row.vendor ?? row.distributor ?? '',
        brand: row.brand ?? '',
        notes: row.description ?? '',
        sku: row.sku ?? '',
        last_ordered_at: null,
      });
    }

    return grouped;
  }, [rows]);

  return {
    isLoading,
    error,
    itemsByCategory,
    groupedData: itemsByCategory,
    refresh: fetchData,
  };
}

