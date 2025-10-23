import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ShoppingCart, 
  Clock, 
  DollarSign, 
  Package, 
  RefreshCw, 
  Download,
  FileText,
  Calendar,
  Truck,
  Star,
  Lightbulb
} from 'lucide-react';
import { useAIOrderGuide } from '../../hooks/useOrderGuide';

const AIOrderDashboard = () => {
  const locationId = 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Mopped Test Site
  const { 
    aiSuggestions, 
    approvedOrders,
    isLoading, 
    error, 
    summary,
    hasAISuggestions,
    hasApprovedOrders,
    approveOrder,
    exportOrdersByVendor,
    refresh,
    fetchApprovedOrders
  } = useAIOrderGuide({ locationId });

  const [selectedPriority, setSelectedPriority] = useState('all');
  const [approvedItems, setApprovedItems] = useState(new Set());

  // Filter suggestions by priority
  const filteredSuggestions = useMemo(() => {
    if (!aiSuggestions) return [];
    
    if (selectedPriority === 'all') {
      return aiSuggestions;
    }
    
    return aiSuggestions.filter(item => item.priority === selectedPriority);
  }, [aiSuggestions, selectedPriority]);

  // Priority counts for tabs
  const priorityCounts = useMemo(() => {
    if (!aiSuggestions) return { urgent: 0, high: 0, normal: 0 };
    
    return aiSuggestions.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, { urgent: 0, high: 0, normal: 0 });
  }, [aiSuggestions]);

  // Group approved orders by vendor
  const ordersByVendor = useMemo(() => {
    if (!approvedOrders) return {};
    
    return approvedOrders.reduce((acc, order) => {
      const vendor = order.vendor_name;
      if (!acc[vendor]) {
        acc[vendor] = [];
      }
      acc[vendor].push(order);
      return acc;
    }, {});
  }, [approvedOrders]);

  const handleApproveOrder = async (itemId) => {
    const result = await approveOrder(itemId);
    if (result.success) {
      setApprovedItems(prev => new Set([...prev, itemId]));
      // Refresh approved orders to show the new order
      await fetchApprovedOrders();
    } else {
      alert('Error approving order: ' + result.error);
    }
  };

  const handleExportOrders = async () => {
    if (!hasApprovedOrders) {
      alert('No approved orders to export. Create some approved orders first by approving smart suggestions.');
      return;
    }
    
    await exportOrdersByVendor();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'normal': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'submitted': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'sent': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-6 h-6 animate-pulse text-blue-600" />
          <span className="text-lg text-gray-600">Analyzing inventory patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Smart Order Guide Error</span>
        </div>
        <p className="text-red-700">{error.message}</p>
        <button 
          onClick={refresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Smart Order Guide</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refresh}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            {/* ALWAYS SHOW EXPORT BUTTON - but disable when no orders */}
            <button
              onClick={handleExportOrders}
              disabled={!hasApprovedOrders}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                hasApprovedOrders
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={hasApprovedOrders ? 'Export approved orders to CSV files' : 'No approved orders to export'}
            >
              <Download className="w-4 h-4" />
              <span>Export Orders</span>
              {hasApprovedOrders && (
                <span className="bg-green-700 text-white text-xs px-2 py-1 rounded-full">
                  {approvedOrders?.length || 0}
                </span>
              )}
            </button>
          </div>
        </div>
        <p className="text-gray-600">Logic-based ordering recommendations based on usage patterns and stock levels</p>
        <p className="text-sm text-gray-500 mt-1">
          Suggestions: {aiSuggestions?.length || 0} | Approved Orders: {approvedOrders?.length || 0}
        </p>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Smart Suggestions</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{summary.totalSuggestions}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Approved Orders</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{approvedOrders?.length || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Urgent Items</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">{priorityCounts.urgent}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Potential Savings</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">${summary.potentialSavings || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED CONTENT - NO SEPARATE TABS */}
      
      {/* Smart Suggestions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <span>Smart Suggestions</span>
          </h2>
        </div>

        {/* Priority Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Suggestions', count: aiSuggestions?.length || 0 },
                { key: 'urgent', label: 'Urgent', count: priorityCounts.urgent },
                { key: 'high', label: 'High Priority', count: priorityCounts.high },
                { key: 'normal', label: 'Normal', count: priorityCounts.normal }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPriority(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedPriority === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Smart Suggestions List */}
        <div className="space-y-4 mb-8">
          {filteredSuggestions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Smart Suggestions</h3>
              <p className="text-gray-600">
                {selectedPriority === 'all' 
                  ? 'All inventory levels appear optimal based on current usage patterns.'
                  : `No ${selectedPriority} priority items found.`
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Items will appear here when stock levels fall below recommended thresholds.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> To test the system, lower some inventory counts in your Inventory Management, 
                  then return here to see smart suggestions appear.
                </p>
              </div>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <div key={suggestion.item_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                        {getPriorityIcon(suggestion.priority)}
                        <span className="capitalize">{suggestion.priority}</span>
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{suggestion.item_name}</h3>
                      <span className="text-sm text-gray-500">({suggestion.unit})</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Stock</p>
                        <p className="text-lg font-medium text-gray-700">{suggestion.current_stock}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Par Level</p>
                        <p className="text-lg font-medium text-gray-700">{suggestion.par_level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Recommended Order</p>
                        <p className="text-lg font-medium text-blue-600">{suggestion.recommended_quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estimated Cost</p>
                        <p className="text-lg font-medium text-green-600">${suggestion.estimated_cost?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Logic Analysis:</p>
                      <p className="text-sm text-gray-600">{suggestion.ai_reasoning}</p>
                    </div>

                    {suggestion.vendor_optimization && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-blue-700 mb-1">Vendor Optimization:</p>
                        <p className="text-sm text-blue-600">{suggestion.vendor_optimization}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Category: {suggestion.category_name}</span>
                      <span>Vendor: {suggestion.vendor_name}</span>
                      {suggestion.usage_trend && <span>Trend: {suggestion.usage_trend}</span>}
                      {suggestion.days_until_stockout < 999 && (
                        <span className="text-orange-600 font-medium">
                          Stockout in {suggestion.days_until_stockout} days
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleApproveOrder(suggestion.item_id)}
                      disabled={approvedItems.has(suggestion.item_id)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        approvedItems.has(suggestion.item_id)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {approvedItems.has(suggestion.item_id) ? (
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <ShoppingCart className="w-4 h-4" />
                          <span>Approve Order</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approved Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span>Approved Orders</span>
          </h2>
          {hasApprovedOrders && (
            <button
              onClick={handleExportOrders}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export All Orders</span>
            </button>
          )}
        </div>

        {!hasApprovedOrders ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Orders</h3>
            <p className="text-gray-600">
              Approved orders will appear here after you approve smart suggestions.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Use the "Approve Order" button on suggestions above to create orders.
            </p>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                💡 <strong>Tip:</strong> The Export button above is always visible but will be disabled until you have approved orders.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Vendor Orders */}
            {Object.entries(ordersByVendor).map(([vendorName, orders]) => (
              <div key={vendorName} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Truck className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{vendorName}</h3>
                      <span className="text-sm text-gray-500">
                        ({orders.length} order{orders.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {orders.map(order => (
                        <span key={order.id} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {orders.map((order) => (
                    <div key={order.id} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-600">Order Date</p>
                            <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="font-medium">{order.total_items || order.order_lines?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Estimated Total</p>
                            <p className="font-medium text-green-600">${order.estimated_total?.toFixed(2) || '0.00'}</p>
                          </div>
                          {order.food_cost_impact && (
                            <div>
                              <p className="text-sm text-gray-600">Food Cost Impact</p>
                              <p className="font-medium text-orange-600">+{order.food_cost_impact.toFixed(2)}%</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Lines */}
                      {order.order_lines && order.order_lines.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items:</h4>
                          <div className="space-y-2">
                            {order.order_lines
                              .filter(line => line.status !== 'cancelled')
                              .sort((a, b) => {
                                const priorityOrder = { urgent: 3, high: 2, normal: 1 };
                                const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
                                if (priorityDiff !== 0) return priorityDiff;
                                return a.item_name.localeCompare(b.item_name);
                              })
                              .map((line) => (
                                <div key={line.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                  <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(line.priority)}`}>
                                      {getPriorityIcon(line.priority)}
                                      <span className="capitalize">{line.priority}</span>
                                    </span>
                                    <span className="font-medium">{line.item_name}</span>
                                    {line.brand && <span className="text-sm text-gray-500">({line.brand})</span>}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <span>Qty: {line.approved_qty || line.requested_qty}</span>
                                    <span>{line.unit}</span>
                                    <span className="text-green-600 font-medium">
                                      ${line.estimated_line_total?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 mb-1">Order Notes:</p>
                          <p className="text-sm text-blue-600">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Smart Order Guide System</span>
        </div>
        <p className="text-blue-700 mt-1">
          This logic-based system analyzes your inventory data, usage patterns, and stock levels to provide 
          smart ordering recommendations. Approved orders are organized by vendor for easy export and processing.
        </p>
      </div>
    </div>
  );
};

export default AIOrderDashboard;
