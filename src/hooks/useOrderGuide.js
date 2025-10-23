// ================================================================
// COMPLETE useOrderGuide Hook with Approved Orders Functionality
// This includes all the missing pieces for the Smart Order Guide system
// ================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path as needed
import VendorExportService from '../lib/VendorExportService';


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
 * ✅ APPROVED ORDERS FUNCTIONALITY - COMPLETE
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
  const [approvedOrders, setApprovedOrders] = useState([]);


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

  // FETCH APPROVED ORDERS - Get orders from database
  const fetchApprovedOrders = useCallback(async () => {
    if (!locationId) return;

    try {
      console.log('🔍 Fetching approved orders for location:', locationId);
      
      const { data, error } = await supabase
        .from('order_headers')
        .select(`
          id, vendor_name, status, total_items, estimated_total, 
          food_cost_impact, created_at, approved_at,
          order_lines (
            id, item_name, brand, unit, case_size, 
            requested_qty, approved_qty, estimated_unit_cost,
            estimated_line_total, priority, ai_reasoning, status
          )
        `)
        .eq('location_id', locationId)
        .in('status', ['draft', 'approved', 'submitted'])
        .order('vendor_name');

      if (error) {
        console.error('❌ Error fetching approved orders:', error);
        setApprovedOrders([]);
        return;
      }

      console.log('✅ Approved orders loaded:', data?.length || 0);
      setApprovedOrders(data || []);
    } catch (err) {
      console.error('❌ Unexpected error fetching approved orders:', err);
      setApprovedOrders([]);
    }
  }, [locationId]);

  // Check if there are any approved orders
  const hasApprovedOrders = approvedOrders.length > 0;

  // Initial data fetch
  useEffect(() => {
    fetchOrderGuideData();
    fetchApprovedOrders(); // ← ADD THIS LINE TO LOAD APPROVED ORDERS ON MOUNT
  }, [fetchOrderGuideData, fetchApprovedOrders]);

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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_headers'
      }, (payload) => {
        console.log('📡 Order update received:', payload);
        fetchApprovedOrders(); // ← REFRESH APPROVED ORDERS ON CHANGES
      })
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription...');
      subscription.unsubscribe();
    };
  }, [enableRealtime, fetchOrderGuideData, fetchApprovedOrders]);

  return {
    itemsByCategory,
    allItems,
    isLoading,
    error,
    summary,
    approvedOrders,        // ← ADD THIS
    hasApprovedOrders,     // ← ADD THIS
    updateInventoryCount,
    bulkUpdateInventory,
    refresh: fetchOrderGuideData,
    fetchApprovedOrders,   // ← ADD THIS
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

  // Placeholder implementation - ready for future expansion
  const fetchBeverageData = useCallback(async () => {
    console.log('🍺 Beverage order guide ready for implementation');
    // Future: Query beverage items from v_order_guide_clean where item_type = 'beverage'
  }, [locationId, operatorId]);

  return {
    itemsByCategory,
    allItems,
    isLoading,
    error,
    refresh: fetchBeverageData,
    summary: null
  };
};

// Main composite hook that provides AI suggestions and order management
export const useAIOrderGuide = ({ locationId = null }) => {
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch AI suggestions based on current inventory levels
  const fetchAISuggestions = useCallback(async () => {
    if (!locationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🤖 Generating AI suggestions for location:', locationId);

      // Get current inventory data from the clean view
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('v_order_guide_clean')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .neq('item_type', 'beverage');

      if (inventoryError) {
        throw inventoryError;
      }

      console.log(`📊 Processing ${inventoryData.length} items for AI analysis`);

      if (inventoryData && inventoryData.length > 0) {
        // Generate smart suggestions based on actual data
        const smartSuggestions = inventoryData
          .filter(item => {
            const actual = parseInt(item.actual) || 0;
            const forecast = parseInt(item.forecast) || 0;
            const variance = actual - forecast;
            
            // Only suggest items that need ordering (actual < forecast)
            return variance < 0 && forecast > 0;
          })
          .map(item => {
            const actual = parseInt(item.actual) || 0;
            const forecast = parseInt(item.forecast) || 0;
            const variance = actual - forecast;
            const unitCost = parseFloat(item.unit_cost) || 0;
            
            // Calculate recommended quantity (bring up to par level)
            const recommendedQuantity = Math.abs(variance);
            
            // Determine priority based on how far below par we are
            let priority = 'normal';
            const shortagePercentage = Math.abs(variance) / forecast;
            
            if (shortagePercentage > 0.5) {
              priority = 'urgent';
            } else if (shortagePercentage > 0.25) {
              priority = 'high';
            }
            
            // Calculate days until stockout (rough estimate)
            const avgDailyUsage = forecast / 7; // Assume weekly par level
            const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(actual / avgDailyUsage) : 99;
            
            // Generate AI reasoning
            let reasoning = `Current stock (${actual}) is ${Math.abs(variance)} units below par level (${forecast}). `;
            
            if (priority === 'urgent') {
              reasoning += `URGENT: Stock is ${Math.round(shortagePercentage * 100)}% below target. `;
            } else if (priority === 'high') {
              reasoning += `HIGH PRIORITY: Stock is ${Math.round(shortagePercentage * 100)}% below target. `;
            }
            
            if (daysUntilStockout < 7) {
              reasoning += `Estimated stockout in ${daysUntilStockout} days. `;
            }
            
            reasoning += `Recommended to order ${recommendedQuantity} units to reach par level.`;
            
            // Vendor optimization suggestion
            let vendorOptimization = null;
            if (unitCost > 5) { // For higher-cost items
              vendorOptimization = `Consider bulk pricing or alternative vendors for cost savings on this ${unitCost.toFixed(2)} per unit item.`;
            }

            return {
              item_id: item.item_id,
              item_name: item.item_name,
              category_name: item.category_name || 'General',
              unit: item.unit || 'each',
              current_stock: item.actual || 0,
              par_level: item.forecast || 0,
              recommended_quantity: recommendedQuantity,
              estimated_cost: (item.unit_cost || 0) * recommendedQuantity,
              vendor_name: item.vendor || item.brand || 'Standard Vendor',
              priority: priority,
              days_until_stockout: daysUntilStockout,
              usage_trend: variance > 2 ? 'increasing' : variance < -2 ? 'decreasing' : 'stable',
              vendor_optimization: vendorOptimization,
              potential_savings: vendorOptimization ? Math.round(item.unit_cost * 0.1 * recommendedQuantity) : 0,
              ai_reasoning: reasoning.trim()
            };
          });

        setAiSuggestions(smartSuggestions);
        setError(null);
        setLastUpdated(new Date());
      }

      setIsLoading(false);
    } catch (err) {
      console.error('❌ Unexpected error in useAIOrderGuide:', err);
      setError(err);
      setAiSuggestions([]);
      setIsLoading(false);
    }
  }, [locationId]);

  // FETCH APPROVED ORDERS - Get orders from database
  const fetchApprovedOrders = useCallback(async () => {
    if (!locationId) return;

    try {
      console.log('🔍 Fetching approved orders for location:', locationId);
      
      const { data, error } = await supabase
        .from('order_headers')
        .select(`
          id, vendor_name, status, total_items, estimated_total, 
          food_cost_impact, created_at, approved_at,
          order_lines (
            id, item_name, brand, unit, case_size, 
            requested_qty, approved_qty, estimated_unit_cost,
            estimated_line_total, priority, ai_reasoning, status
          )
        `)
        .eq('location_id', locationId)
        .in('status', ['draft', 'approved', 'submitted'])
        .order('vendor_name');

      if (error) {
        console.error('❌ Error fetching approved orders:', error);
        setApprovedOrders([]);
        return;
      }

      console.log('✅ Approved orders loaded:', data?.length || 0);
      setApprovedOrders(data || []);
    } catch (err) {
      console.error('❌ Unexpected error fetching approved orders:', err);
      setApprovedOrders([]);
    }
  }, [locationId]);

  // Check if there are any approved orders
  const hasApprovedOrders = approvedOrders.length > 0;

  useEffect(() => {
    fetchAISuggestions();
    fetchApprovedOrders(); // ← LOAD APPROVED ORDERS ON MOUNT
  }, [fetchAISuggestions, fetchApprovedOrders]);

   // NEW APPROVE ORDER FUNCTION - Creates real orders in the new workflow system
  const approveOrder = useCallback(async (itemId) => {
    if (!locationId || !itemId) {
      console.error('❌ Missing locationId or itemId for order approval');
      return { success: false, error: 'Missing required parameters' };
    }

    try {
      console.log(`✅ Approving order for item ${itemId}`);

      // Find the suggestion to get the recommended quantity and details
      const suggestion = aiSuggestions.find(s => s.item_id === itemId);
      if (!suggestion) {
        return { success: false, error: 'Suggestion not found' };
      }

      const vendorName = suggestion.vendor_name || 'Standard Vendor';

      // 1. Find or create draft order for this vendor
      let { data: existingOrder, error: findError } = await supabase
        .from('order_headers')
        .select('id, total_items, estimated_total')
        .eq('location_id', locationId)
        .eq('vendor_name', vendorName)
        .eq('status', 'draft')
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error finding existing order:', findError);
        return { success: false, error: findError.message };
      }

      let orderId;

      if (!existingOrder) {
        // Create new draft order
        const { data: newOrder, error: createError } = await supabase
          .from('order_headers')
          .insert({
            location_id: locationId,
            vendor_name: vendorName,
            status: 'draft',
            budget_period: 'weekly',
            notes: 'AI-generated order from Smart Dashboard'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating order:', createError);
          return { success: false, error: createError.message };
        }

        orderId = newOrder.id;

        // Record the order source
        await supabase
          .from('order_sources')
          .insert({
            order_id: orderId,
            source_type: 'ai_suggestion',
            source_data: {
              ai_reasoning: suggestion.ai_reasoning,
              priority: suggestion.priority,
              confidence: 0.85,
              original_suggestion: suggestion
            }
          });

      } else {
        orderId = existingOrder.id;
      }

      // 2. Check if this item is already in the order
      const { data: existingLine, error: lineCheckError } = await supabase
        .from('order_lines')
        .select('id, requested_qty')
        .eq('order_id', orderId)
        .eq('item_id', itemId)
        .single();

      if (lineCheckError && lineCheckError.code !== 'PGRST116') {
        console.error('❌ Error checking existing line:', lineCheckError);
        return { success: false, error: lineCheckError.message };
      }

      if (existingLine) {
        // Update existing line with new quantity
        const { error: updateLineError } = await supabase
          .from('order_lines')
          .update({
            requested_qty: suggestion.recommended_quantity,
            approved_qty: suggestion.recommended_quantity,
            estimated_unit_cost: suggestion.estimated_cost / suggestion.recommended_quantity,
            estimated_line_total: suggestion.estimated_cost,
            priority: suggestion.priority,
            ai_reasoning: suggestion.ai_reasoning,
            status: 'approved'
          })
          .eq('id', existingLine.id);

        if (updateLineError) {
          console.error('❌ Error updating order line:', updateLineError);
          return { success: false, error: updateLineError.message };
        }

      } else {
        // Add new line to order
        const { error: insertLineError } = await supabase
          .from('order_lines')
          .insert({
            order_id: orderId,
            item_id: itemId,
            item_name: suggestion.item_name,
            brand: suggestion.vendor_name || '',
            unit: suggestion.unit || 'each',
            case_size: 1,
            requested_qty: suggestion.recommended_quantity,
            approved_qty: suggestion.recommended_quantity,
            estimated_unit_cost: suggestion.estimated_cost / suggestion.recommended_quantity,
            estimated_line_total: suggestion.estimated_cost,
            priority: suggestion.priority,
            ai_reasoning: suggestion.ai_reasoning,
            status: 'approved'
          });

        if (insertLineError) {
          console.error('❌ Error inserting order line:', insertLineError);
          return { success: false, error: insertLineError.message };
        }
      }

      // 3. Refresh approved orders to show the new order
      await fetchApprovedOrders();

      console.log('✅ Order approved successfully');
      return { 
        success: true, 
        orderId: orderId,
        message: `Added ${suggestion.item_name} to ${vendorName} order`
      };

    } catch (err) {
      console.error('❌ Unexpected error approving order:', err);
      return { success: false, error: err.message };
    }
  }, [locationId, aiSuggestions, fetchApprovedOrders]);


  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!aiSuggestions || aiSuggestions.length === 0) {
      return {
        totalSuggestions: 0,
        potentialSavings: 0,
        vendorOptimizations: 0,
        urgentItems: 0
      };
    }

    const stats = {
      totalSuggestions: aiSuggestions.length,
      potentialSavings: 0,
      vendorOptimizations: 0,
      urgentItems: 0
    };

    aiSuggestions.forEach(suggestion => {
      if (suggestion.priority === 'urgent') stats.urgentItems++;
      if (suggestion.vendor_optimization) stats.vendorOptimizations++;
      if (suggestion.potential_savings) stats.potentialSavings += suggestion.potential_savings;
    });

    return stats;
  }, [aiSuggestions]);

  // EXPORT ORDERS BY VENDOR - New functionality
  const exportOrdersByVendor = useCallback(async () => {
    try {
      console.log('🚀 Starting vendor export...');
      
      const exportService = new VendorExportService(supabase);
      const result = await exportService.exportOrdersByVendor(locationId);
      
      if (result.success) {
        const message = `Successfully exported ${result.exportedCount} vendor orders:\n\n` +
          result.results
            .filter(r => r.success)
            .map(r => `✅ ${r.vendor}: ${r.lineCount} items`)
            .join('\n');
        
        alert(message);
      } else {
        throw new Error('Export failed');
      }
      
    } catch (err) {
      console.error('❌ Error in exportOrdersByVendor:', err);
      alert('Error exporting orders: ' + err.message);
    }
  }, [locationId]);

  return {
    // Smart Data
    aiSuggestions,
    approvedOrders,        // ← ADD THIS
    isLoading,
    error,
    summary,
    
    // Smart Actions
    refresh: fetchAISuggestions,
    approveOrder,
    exportOrdersByVendor,
    fetchApprovedOrders,   // ← ADD THIS
    
    // Status
    hasAISuggestions: aiSuggestions.length > 0,
    hasApprovedOrders,     // ← ADD THIS
    isEmpty: aiSuggestions.length === 0 && !isLoading && !error,
    
    // Metadata
    lastUpdated
  };
};

// Default export for the main AI-powered order guide
export default useAIOrderGuide;

