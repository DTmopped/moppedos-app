import React, { useState, useMemo } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle, ShoppingCart, Clock, 
  DollarSign, Package, RefreshCw, Edit3, Download, Eye, Truck, 
  Calendar, BarChart3, AlertCircle, Target
} from 'lucide-react';
import { useAIOrderGuide } from '../../hooks/useOrderGuide';

const SmartOrderDashboard = () => {
  const locationId = 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Mopped Test Site
  const { 
    aiSuggestions, 
    isLoading, 
    error, 
    summary,
    approveOrder,
    exportOrdersByVendor,
    refresh
  } = useAIOrderGuide({ locationId });

  const [selectedPriority, setSelectedPriority] = useState('all');
  const [approvedItems, setApprovedItems] = useState(new Set());
  const [activeTab, setActiveTab] = useState('suggestions');

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

  // Calculate estimated FVA impact
  const fvaImpact = useMemo(() => {
    if (!aiSuggestions) return { totalCost: 0, foodCostIncrease: 0, warning: false };
    
    const totalCost = aiSuggestions.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    
    // Rough FVA calculation - this should be refined with actual sales data
    const estimatedMonthlySales = 50000;
    const currentFoodCost = 28;
    const targetFoodCost = 30;
    
    const foodCostIncrease = (totalCost / estimatedMonthlySales) * 100;
    const projectedFoodCost = currentFoodCost + foodCostIncrease;
    
    return {
      totalCost,
      foodCostIncrease,
      projectedFoodCost,
      warning: projectedFoodCost > targetFoodCost,
      withinTarget: projectedFoodCost <= targetFoodCost
    };
  }, [aiSuggestions]);

  const handleApproveOrder = async (itemId) => {
  try {
    const result = await approveOrder(itemId);
    if (result.success) {
     // TEST COMMENT - update UI state

      setApprovedItems(prev => new Set([...prev, itemId]));
    }
  } catch (err) {
    console.error('Error approving order:', err);
  }
};


  const handleExportOrders = async () => {
    if (!exportOrdersByVendor) {
      alert('Export functionality not available. Please ensure all components are properly connected.');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 animate-pulse text-blue-600" />
          <span className="text-lg text-gray-600">AI analyzing inventory patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Smart Dashboard Error</span>
        </div>
        <p className="text-red-700">{error.message || error}</p>
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
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">TEST - Smart Order Dashboard</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportOrders}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Orders</span>
            </button>
            <button
              onClick={refresh}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600">AI-powered ordering recommendations with cost tracking</p>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">AI Suggestions</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{aiSuggestions?.length || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Est. Order Value</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">${fvaImpact.totalCost.toFixed(0)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Urgent Items</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mt-1">{priorityCounts.urgent}</p>
          </div>
          <div className={`rounded-lg p-4 ${fvaImpact.warning ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex items-center space-x-2">
              <Target className={`w-5 h-5 ${fvaImpact.warning ? 'text-red-600' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${fvaImpact.warning ? 'text-red-600' : 'text-green-600'}`}>
                Food Cost Impact
              </span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${fvaImpact.warning ? 'text-red-900' : 'text-green-900'}`}>
              {fvaImpact.projectedFoodCost?.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Export Orders Section */}
      <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
          <p className="text-sm text-gray-600">Export approved orders for vendor processing</p>
        </div>
        <button
          onClick={exportOrdersByVendor}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders</span>
        </button>
      </div>

      {/* FVA Warning */}
      {fvaImpact.warning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">FVA Cost Warning</span>
          </div>
          <p className="text-red-700">
            Current order suggestions will increase food cost to {fvaImpact.projectedFoodCost?.toFixed(1)}%, 
            which may exceed your target. Review high-cost items before approving.
          </p>
        </div>
      )}

      {/* Priority Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
                    {{
          { key: 'all', label: 'All Suggestions', count: aiSuggestions?.length || 0 },
          { key: 'approved', label: 'Approved Orders', count: approvedItems.size }
        }}.map((tab) => (

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

        {/* Main Content Tabs - Suggestions vs Approved Orders */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'suggestions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Suggestions
            </button>
            
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'approved' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved Orders
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
{selectedPriority !== 'approved' ? (
  <div className="p-6">
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
              <p className="text-gray-500">
                {selectedPriority === 'all' 
                  ? 'All inventory levels are within acceptable ranges.'
                  : `No ${selectedPriority} priority items need reordering.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((item) => (
                <div key={item.item_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.item_name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                          {getPriorityIcon(item.priority)}
                          <span className="ml-1 capitalize">{item.priority}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Current:</span> {item.current_stock} {item.unit}
                        </div>
                        <div>
                          <span className="font-medium">Par Level:</span> {item.par_level} {item.unit}
                        </div>
                        <div>
                          <span className="font-medium">Recommended:</span> {item.recommended_quantity} {item.unit}
                        </div>
                        <div>
                          <span className="font-medium">Est. Cost:</span> ${item.estimated_cost?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Vendor:</span> {item.vendor_name}
                        <span className="ml-4"><span className="font-medium">Usage:</span> {item.usage_trend}</span>
                      </div>

                      <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                        <span className="font-medium">AI Reasoning:</span> {item.ai_reasoning}
                      </p>
                    </div>

                    <div className="ml-6">
                      <button
                        onClick={() => handleApproveOrder(item.item_id)}
                        disabled={approvedItems.has(item.item_id)}
                        className={`px-6 py-2 rounded-md font-medium transition-colors ${
                          approvedItems.has(item.item_id)
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {approvedItems.has(item.item_id) ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Approved</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <ShoppingCart className="w-4 h-4" />
                            <span>Approve Order</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    /* Approved Orders Section */
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-green-700">Approved Orders</h3>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">🎉 Your approved orders will appear here!</p>
        <p className="text-sm text-green-600 mt-2">Orders you approve will be shown grouped by vendor for easy management.</p>
      </div>
    </div>
  )}
  </div>
);
};

export default SmartOrderDashboard;
