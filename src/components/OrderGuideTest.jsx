import React, { useState, useEffect, useMemo } from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Plus, Minus, Search, Filter, Download } from 'lucide-react';
import { useFoodOrderGuide } from '../hooks/useOrderGuide';

const OrderGuideTest = () => {
  const locationId = 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Mopped Test Site
  const { 
    allItems, 
    itemsByCategory, 
    isLoading, 
    error, 
    summary, 
    updateInventoryCount,
    refresh 
  } = useFoodOrderGuide({ 
    locationId, 
    enableRealtime: true 
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyNeedsOrder, setShowOnlyNeedsOrder] = useState(false);

  // ADD THIS RIGHT HERE (after line 22):
useEffect(() => {
  document.title = 'Inventory Management - Mopped OS';
}, []);

  // Deduplicate items by item_id and item_name combination
  const deduplicatedItems = useMemo(() => {
    if (!allItems || allItems.length === 0) return [];
    
    const uniqueItems = new Map();
    
    allItems.forEach(item => {
      const key = `${item.item_id}-${item.item_name}`;
      
      // If we haven't seen this item, or if this one has a specific location_id (not null)
      if (!uniqueItems.has(key) || 
          (item.location_id === locationId && uniqueItems.get(key).location_id !== locationId)) {
        uniqueItems.set(key, item);
      }
    });
    
    return Array.from(uniqueItems.values());
  }, [allItems, locationId]);

  // Group deduplicated items by category
  const itemsByCleanCategory = useMemo(() => {
    const grouped = {};
    
    deduplicatedItems.forEach(item => {
      const category = item.category_name || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    // Sort items within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.item_name.localeCompare(b.item_name));
    });
    
    return grouped;
  }, [deduplicatedItems]);

  // Get category list with counts
  const categories = useMemo(() => {
    const cats = Object.keys(itemsByCleanCategory).sort();
    return [
      { 
        key: 'all', 
        label: 'All Items', 
        count: deduplicatedItems.length 
      },
      ...cats.map(cat => ({
        key: cat,
        label: cat,
        count: itemsByCleanCategory[cat]?.length || 0
      }))
    ];
  }, [itemsByCleanCategory, deduplicatedItems]);

  // Filter items based on selected category and search
  const filteredItems = useMemo(() => {
    let items = selectedCategory === 'all' 
      ? deduplicatedItems 
      : itemsByCleanCategory[selectedCategory] || [];

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply needs order filter
    if (showOnlyNeedsOrder) {
      items = items.filter(item => item.needsOrder || item.isOverstocked);
    }

    return items;
  }, [deduplicatedItems, itemsByCleanCategory, selectedCategory, searchTerm, showOnlyNeedsOrder]);

  const handleExportInventory = () => {
  // Create CSV content
  const headers = ['Item Name', 'Category', 'Current Stock', 'Target Level', 'Variance', 'Status', 'Brand'];
  const csvContent = [
    headers.join(','),
    ...filteredItems.map(item => [
      `"${item.item_name}"`,
      `"${item.category_name || 'Uncategorized'}"`,
      item.on_hand || 0,
      item.par_level || 0,
      (item.on_hand || 0) - (item.par_level || 0),
      getStatusText(item),
      `"${item.brand || ''}"`
    ].join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

  const handleQuantityChange = async (itemId, field, value) => {
    const numValue = parseInt(value) || 0;
    await updateInventoryCount(itemId, field, numValue);
  };

  const getStatusColor = (item) => {
    if (item.needsOrder) return 'text-red-600 bg-red-50 border-red-200';
    if (item.isOverstocked) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (item) => {
    if (item.needsOrder) return 'Needs Order';
    if (item.isOverstocked) return 'Overstocked';
    return 'Good';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 animate-pulse text-blue-600" />
          <span className="text-lg text-gray-600">Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Error Loading Inventory</span>
        </div>
        <p className="text-red-700">{error.message}</p>
        <button 
          onClick={refresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
     {/* Header */}
<div className="mb-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">📦 Inventory Management</h1>
      <p className="text-gray-600">Complete inventory tracking and management system</p>
    </div>
    <div className="flex items-center space-x-3">
      <button
        onClick={refresh}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Refresh
      </button>
      <button 
        onClick={handleExportInventory}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        <Download className="w-4 h-4 inline mr-1" />
        Export
      </button>
    </div>
  </div>
</div>


      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{deduplicatedItems.length}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Need Order</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-1">{summary.itemsNeedingOrder}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Overstocked</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mt-1">{summary.itemsOverstocked}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">On Target</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">{summary.itemsOnTarget}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyNeedsOrder}
                onChange={(e) => setShowOnlyNeedsOrder(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show only items needing attention</span>
            </label>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredItems.length} of {deduplicatedItems.length} items
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600">
              {searchTerm || showOnlyNeedsOrder 
                ? 'Try adjusting your search or filters.'
                : 'No inventory items available.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={`${item.item_id}-${item.item_name}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-sm text-gray-500">
                          {item.brand && `${item.brand} • `}
                          {item.unit}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category_name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.item_id, 'on_hand', Math.max(0, item.actual - 1))}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.actual || 0}
                          onChange={(e) => handleQuantityChange(item.item_id, 'on_hand', e.target.value)}
                          className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                          min="0"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.item_id, 'on_hand', (item.actual || 0) + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.forecast || 0}
                        onChange={(e) => handleQuantityChange(item.item_id, 'par_level', e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        item.variance > 0 ? 'text-green-600' : 
                        item.variance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item)}`}>
                        {getStatusText(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderGuideTest;

