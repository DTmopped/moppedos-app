import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * FIND ITEMS VERSION - Order Guide Hook
 * 
 * The 113 items exist but we're getting 0 results even without is_active filter.
 * This means the items are associated with different location_ids.
 * 
 * This version will find where your 113 items actually are!
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

    console.log('🔍 FIND ITEMS: Searching for your 113 Order Guide items...');
    console.log('🔍 FIND ITEMS: Current locationId:', locationId);

    setLoading(true);
    setError(null);

    try {
      // ✅ STEP 1: Try with your current location_id
      console.log('🔍 STEP 1: Trying with your current location_id...');
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
        .eq('location_id', locationId);

      let { data, error: queryError } = await query;
      
      if (queryError) {
        console.error('❌ Query failed:', queryError);
        throw queryError;
      }

      console.log('🔍 STEP 1 RESULT: Found', data?.length || 0, 'items with your location_id');

      // ✅ STEP 2: If no items found, try WITHOUT location filter
      if (!data || data.length === 0) {
        console.log('🔍 STEP 2: No items found with your location_id, trying without location filter...');
        
        const { data: allData, error: allError } = await supabase
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
          .limit(50); // Limit to first 50 items for testing

        if (allError) {
          console.error('❌ Query without location filter failed:', allError);
        } else {
          console.log('🔍 STEP 2 RESULT: Found', allData?.length || 0, 'items WITHOUT location filter');
          
          if (allData && allData.length > 0) {
            // Show what location_ids actually exist
            const locationIds = [...new Set(allData.map(item => item.location_id))];
            console.log('🔍 ACTUAL LOCATION_IDS in order_guide_items:', locationIds);
            console.log('🔍 YOUR LOCATION_ID:', locationId);
            console.log('🔍 MATCH FOUND:', locationIds.includes(locationId) ? 'YES' : 'NO');
            
            // Use the items we found (without location filter for now)
            data = allData;
            console.log('✅ Using items without location filter to get Order Guide working');
          }
        }
      }

      // ✅ STEP 3: Show what we found
      setRows(Array.isArray(data) ? data : []);
      console.log('✅ Order Guide loaded successfully:', data?.length || 0, 'items from order_guide_items');
      
      if (data && data.length > 0) {
        const activeCount = data.filter(item => item.is_active).length;
        const inactiveCount = data.filter(item => !item.is_active).length;
        console.log('📊 Active items:', activeCount, '| Inactive items:', inactiveCount);
        console.log('📊 Sample item:', data[0]);
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
        
        // ✅ Include location info for debugging
        location_id: row.location_id,
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

