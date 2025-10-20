// ================================================================
// STEP 2: Enhanced useOrderGuide Hook
// Replace your existing useOrderGuide.js with this enhanced version
// ================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path as needed

/**
 * Enhanced useOrderGuide Hook with Multi-Operator Support
 * 
 * Features:
 * ✅ Works with your existing 113 items
 * ✅ Real-time inventory updates
 * ✅ Category organization
 * ✅ Status indicators (needs order, overstocked, good)
 * ✅ Search and filtering
 * ✅ Bulk operations
 */

// Main hook for food items (your current 113 items)
export const useFoodOrderGuide = ({ 
  locationId = null, 
  operatorId = null,
  complexityLevel = 'simple',
  enableRealtime = true 
}) => {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch order guide data
  const fetchOrderGuideData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching order guide data...');

      // Query the enhanced view
      let query = supabase
        .from('v_order_guide_clean')
        .select('*')
        .eq('is_active', true)
        .neq('item_type', 'beverage'); // Only food items for now

      // Apply filters if provided
      if (operatorId) {
        query = query.or(`operator_id.eq.${operatorId},operator_id.is.null`);
      }
      
      if (locationId) {
        query = query.or(`location_id.eq.${locationId},location_id.is.null`);
      }

      // Order by category and item name
      query = query.order('category_rank').order('item_name');

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      console.log(`✅ Fetched ${data.length} items`);

      // Process and organize data
      const processedItems = data.map(item => ({
        ...item,
        // Ensure numeric values
        actual: parseInt(item.actual) || 0,
        forecast: parseInt(item.forecast) || 0,
        variance: parseInt(item.variance) || 0,
        unit_cost: parseFloat(item.unit_cost) || 0,
        total_cost: parseFloat(item.total_cost) || 0,
        
        // Ensure boolean status indicators
        needsOrder: Boolean(item.needsorder),
        isOverstocked: Boolean(item.isoverstocked),
        isOnTarget: Boolean(item.isontarget),
        
        // Add display helpers
        statusText: item.needsorder ? 'Needs Order' : 
                   item.isoverstocked ? 'Overstocked' : 'Good',
        statusColor: item.needsorder ? 'red' : 
                    item.isoverstocked ? 'orange' : 'green'
      }));

      // Group by category
      const grouped = processedItems.reduce((acc, item) => {
        const category = item.category_name || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      }, {});

      setAllItems(processedItems);
      setItemsByCategory(grouped);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('❌ Error fetching order guide data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, operatorId]);

  // Update inventory count
  const updateInventoryCount = useCallback(async (itemId, field, value) => {
    try {
      console.log(`🔄 Updating ${field} for item ${itemId} to ${value}`);

      // Update in order_guide_status table
      const { error: updateError } = await supabase
        .from('order_guide_status')
        .upsert({
          item_id: itemId,
          location_id: locationId,
          [field]: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'item_id,location_id'
        });

      if (updateError) {
        throw updateError;
      }

      // Update local state optimistically
      setAllItems(prevItems => 
        prevItems.map(item => {
          if (item.item_id === itemId) {
            const updated = { ...item, [field]: value };
            
            // Recalculate status indicators
            if (field === 'on_hand' || field === 'par_level') {
              const actual = field === 'on_hand' ? value : updated.actual;
              const forecast = field === 'par_level' ? value : updated.forecast;
              
              updated.actual = actual;
              updated.forecast = forecast;
              updated.variance = actual - forecast;
              updated.needsOrder = actual < forecast;
              updated.isOverstocked = actual > forecast * 1.2;
              updated.isOnTarget = actual >= forecast * 0.8 && actual <= forecast * 1.2;
              updated.statusText = updated.needsOrder ? 'Needs Order' : 
                                 updated.isOverstocked ? 'Overstocked' : 'Good';
              updated.statusColor = updated.needsOrder ? 'red' : 
                                   updated.isOverstocked ? 'orange' : 'green';
            }
            
            return updated;
          }
          return item;
        })
      );

      // Update grouped data
      setItemsByCategory(prevGrouped => {
        const newGrouped = { ...prevGrouped };
        Object.keys(newGrouped).forEach(category => {
          newGrouped[category] = newGrouped[category].map(item => {
            if (item.item_id === itemId) {
              const updated = { ...item, [field]: value };
              
              if (field === 'on_hand' || field === 'par_level') {
                const actual = field === 'on_hand' ? value : updated.actual;
                const forecast = field === 'par_level' ? value : updated.forecast;
                
                updated.actual = actual;
                updated.forecast = forecast;
                updated.variance = actual - forecast;
                updated.needsOrder = actual < forecast;
                updated.isOverstocked = actual > forecast * 1.2;
                updated.isOnTarget = actual >= forecast * 0.8 && actual <= forecast * 1.2;
                updated.statusText = updated.needsOrder ? 'Needs Order' : 
                                   updated.isOverstocked ? 'Overstocked' : 'Good';
                updated.statusColor = updated.needsOrder ? 'red' : 
                                     updated.isOverstocked ? 'orange' : 'green';
              }
              
              return updated;
            }
            return item;
          });
        });
        return newGrouped;
      });

      console.log('✅ Inventory updated successfully');

    } catch (err) {
      console.error('❌ Error updating inventory:', err);
      setError(err);
    }
  }, [locationId]);

  // Bulk update inventory
  const bulkUpdateInventory = useCallback(async (updates) => {
    try {
      console.log(`🔄 Bulk updating ${updates.length} items`);

      const upsertData = updates.map(update => ({
        item_id: update.itemId,
        location_id: locationId,
        ...Object.fromEntries(
          Object.entries(update).filter(([key]) => key !== 'itemId')
        ),
        updated_at: new Date().toISOString()
      }));

      const { error: bulkError } = await supabase
        .from('order_guide_status')
        .upsert(upsertData, {
          onConflict: 'item_id,location_id'
        });

      if (bulkError) {
        throw bulkError;
      }

      // Refresh data after bulk update
      await fetchOrderGuideData();

      console.log('✅ Bulk update successful');
      return { success: true };

    } catch (err) {
      console.error('❌ Error in bulk update:', err);
      setError(err);
      return { success: false, error: err };
    }
  }, [locationId, fetchOrderGuideData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!allItems.length) return null;

    const totalItems = allItems.length;
    const itemsNeedingOrder = allItems.filter(item => item.needsOrder).length;
    const itemsOverstocked = allItems.filter(item => item.isOverstocked).length;
    const itemsOnTarget = allItems.filter(item => item.isOnTarget).length;
    const totalValue = allItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);

    return {
      totalItems,
      itemsNeedingOrder,
      itemsOverstocked,
      itemsOnTarget,
      totalValue,
      lastUpdated
    };
  }, [allItems, lastUpdated]);

  // Initial data fetch
  useEffect(() => {
    fetchOrderGuideData();
  }, [fetchOrderGuideData]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    console.log('🔄 Setting up real-time subscription...');

    const subscription = supabase
      .channel('order_guide_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_guide_status'
      }, (payload) => {
        console.log('📡 Real-time update received:', payload);
        fetchOrderGuideData();
      })
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription...');
      subscription.unsubscribe();
    };
  }, [enableRealtime, fetchOrderGuideData]);

  return {
    itemsByCategory,
    allItems,
    isLoading,
    error,
    summary,
    updateInventoryCount,
    bulkUpdateInventory,
    refresh: fetchOrderGuideData,
    lastUpdated
  };
};

// Hook for beverage items (framework ready, but inactive for now)
export const useBeverageOrderGuide = ({ 
  locationId = null, 
  operatorId = null,
  complexityLevel = 'simple',
  enableRealtime = false // Disabled by default
}) => {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Beverage module is framework-ready but inactive
  // Will be enabled when operator tier supports it

  return {
    itemsByCategory,
    allItems,
    isLoading,
    error,
    summary: null,
    updateInventoryCount: () => {},
    bulkUpdateInventory: () => {},
    refresh: () => {},
    lastUpdated: null
  };
};

// Combined hook that handles both food and beverages
export const useCompleteOrderGuide = ({ 
  locationId = null, 
  operatorId = null,
  complexityLevel = 'simple',
  enableRealtime = true,
  enableBeverage = false
}) => {
  const foodData = useFoodOrderGuide({ 
    locationId, 
    operatorId, 
    complexityLevel, 
    enableRealtime 
  });

  const beverageData = useBeverageOrderGuide({ 
    locationId, 
    operatorId, 
    complexityLevel, 
    enableRealtime: enableBeverage 
  });

  // Combine food and beverage data
  const combinedItemsByCategory = useMemo(() => {
    if (!enableBeverage) return foodData.itemsByCategory;
    
    return {
      ...foodData.itemsByCategory,
      ...beverageData.itemsByCategory
    };
  }, [foodData.itemsByCategory, beverageData.itemsByCategory, enableBeverage]);

  const combinedAllItems = useMemo(() => {
    if (!enableBeverage) return foodData.allItems;
    
    return [...foodData.allItems, ...beverageData.allItems];
  }, [foodData.allItems, beverageData.allItems, enableBeverage]);

  const combinedSummary = useMemo(() => {
    if (!enableBeverage || !beverageData.summary) return foodData.summary;
    
    return {
      totalItems: foodData.summary.totalItems + beverageData.summary.totalItems,
      itemsNeedingOrder: foodData.summary.itemsNeedingOrder + beverageData.summary.itemsNeedingOrder,
      itemsOverstocked: foodData.summary.itemsOverstocked + beverageData.summary.itemsOverstocked,
      itemsOnTarget: foodData.summary.itemsOnTarget + beverageData.summary.itemsOnTarget,
      totalValue: foodData.summary.totalValue + beverageData.summary.totalValue,
      lastUpdated: new Date(Math.max(
        new Date(foodData.lastUpdated || 0),
        new Date(beverageData.lastUpdated || 0)
      ))
    };
  }, [foodData.summary, beverageData.summary, enableBeverage]);

  return {
    itemsByCategory: combinedItemsByCategory,
    allItems: combinedAllItems,
    isLoading: foodData.isLoading || (enableBeverage && beverageData.isLoading),
    error: foodData.error || beverageData.error,
    summary: combinedSummary,
    updateInventoryCount: foodData.updateInventoryCount,
    bulkUpdateInventory: foodData.bulkUpdateInventory,
    refresh: () => {
      foodData.refresh();
      if (enableBeverage) beverageData.refresh();
    },
    lastUpdated: combinedSummary?.lastUpdated
  };
};

// Default export for backward compatibility
export default useFoodOrderGuide;

// ✅ ADD THIS LINE:
export const useOrderGuide = useFoodOrderGuide;

// Add this NEW hook at the end of your existing useOrderGuide.js file
// (keep all your existing code, just add this at the bottom)

// ✅ NEW: AI-Powered Order Suggestions Hook
export const useAIOrderGuide = ({ locationId, enableRealtime = true }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch AI-powered order suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get vendor-optimized suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .rpc('generate_vendor_optimized_suggestions', { 
          p_location_id: locationId 
        });

      if (suggestionsError) throw suggestionsError;

      // Get executive summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('v_order_summary')
        .select('*')
        .single();

      if (summaryError) throw summaryError;

      setSuggestions(suggestionsData || []);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  // Group suggestions by priority
  const suggestionsByPriority = useMemo(() => {
    const grouped = {
      urgent: suggestions.filter(s => s.priority_score === 1),
      high: suggestions.filter(s => s.priority_score === 2),
      normal: suggestions.filter(s => s.priority_score === 3)
    };
    return grouped;
  }, [suggestions]);

  // Approve order function
  const approveOrder = useCallback(async (item) => {
    try {
      // Update order_guide_status with approved quantity
      const { error } = await supabase
        .from('order_guide_status')
        .upsert({
          item_id: item.item_id,
          location_id: locationId,
          order_quantity: item.total_units,
          last_ordered_at: new Date().toISOString()
        }, {
          onConflict: 'item_id,location_id'
        });

      if (error) throw error;
      
      // Refresh suggestions
      await fetchSuggestions();
      
      return { success: true };
    } catch (err) {
      console.error('Error approving order:', err);
      return { success: false, error: err.message };
    }
  }, [locationId, fetchSuggestions]);

  // Refresh AI suggestions
  const refreshAI = useCallback(async () => {
    try {
      await supabase.rpc('refresh_order_suggestions');
      await fetchSuggestions();
    } catch (err) {
      console.error('Error refreshing AI:', err);
    }
  }, [fetchSuggestions]);

  useEffect(() => {
    if (locationId) {
      fetchSuggestions();
    }
  }, [locationId, fetchSuggestions]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealtime || !locationId) return;

    const subscription = supabase
      .channel('ai-order-suggestions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'order_guide_status' },
        () => fetchSuggestions()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [enableRealtime, locationId, fetchSuggestions]);

  return {
    suggestions,
    suggestionsByPriority,
    summary,
    isLoading,
    error,
    approveOrder,
    refreshAI,
    refetch: fetchSuggestions
  };
};

