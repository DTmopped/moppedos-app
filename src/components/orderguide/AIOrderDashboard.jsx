import React, { useState, useEffect, useMemo } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, ShoppingCart, Clock, DollarSign, Package } from 'lucide-react';
import { useAIOrderGuide } from '../../hooks/useOrderGuide';

const AIOrderDashboard = () => {
  const locationId = 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Mopped Test Site
  const { 
    aiSuggestions, 
    isLoading, 
    error, 
    summary,
    approveOrder,
    refresh
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

  const handleApproveOrder = async (itemId) => {
    const result = await approveOrder(itemId);
    if (result.success) {
      setApprovedItems(prev => new Set([...prev, itemId]));
    }
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
          <span className="font-semibold">Smart Analysis Error</span>
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
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">🧠 Smart Order Dashboard</h1>
        </div>
        <p className="text-gray-600">Intelligent ordering recommendations based on usage patterns and vendor optimization</p>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total Suggestions</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{summary.totalSuggestions}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Potential Savings</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">${summary.potentialSavings?.toFixed(0) || '0'}</p>
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
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Vendor Optimization</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">{summary.vendorOptimizations || 0}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* AI Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Suggestions</h3>
            <p className="text-gray-600">
              {selectedPriority === 'all' 
                ? 'All inventory levels appear optimal based on current usage patterns.'
                : `No ${selectedPriority} priority items found.`
              }
            </p>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-lg font-medium text-gray-900">{suggestion.current_stock}</p>
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
                    <p className="text-sm font-medium text-gray-700 mb-1">AI Reasoning:</p>
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

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={refresh}
          className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Refresh AI Analysis
        </button>
      </div>
    </div>
  );
};

export default AIOrderDashboard;
