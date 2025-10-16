import React from 'react';
import { useFoodOrderGuide } from '../hooks/useOrderGuide';

function OrderGuideTest() {
  const { 
    itemsByCategory, 
    allItems, 
    isLoading, 
    error, 
    summary,
    updateInventoryCount 
  } = useFoodOrderGuide({
    locationId: null,
    operatorId: null,
    enableRealtime: true
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Order Guide Test</h2>
        <div className="animate-pulse">Loading your 113 items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Order Guide Test</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="text-red-800 font-medium">Error:</div>
          <div className="text-red-600">{error.message}</div>
        </div>
      </div>
    );
  }

  const handleCountChange = (itemId, newCount) => {
    updateInventoryCount(itemId, 'on_hand', newCount);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Order Guide Test - SUCCESS! 🎉</h2>
      
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">{summary.totalItems}</div>
            <div className="text-sm text-blue-600">Total Items</div>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <div className="text-2xl font-bold text-red-600">{summary.itemsNeedingOrder}</div>
            <div className="text-sm text-red-600">Need Order</div>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <div className="text-2xl font-bold text-orange-600">{summary.itemsOverstocked}</div>
            <div className="text-sm text-orange-600">Overstocked</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-2xl font-bold text-green-600">{summary.itemsOnTarget}</div>
            <div className="text-sm text-green-600">On Target</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-medium">
              {category} ({items.length} items)
            </div>
            <div className="p-4">
              {items.slice(0, 3).map((item) => (
                <div key={item.item_id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-sm text-gray-600">
                      Unit: {item.unit} | Status: 
                      <span className={`ml-1 ${
                        item.statusColor === 'red' ? 'text-red-600' :
                        item.statusColor === 'orange' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {item.statusText}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCountChange(item.item_id, Math.max(0, item.actual - 1))}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{item.actual}</span>
                    <button
                      onClick={() => handleCountChange(item.item_id, item.actual + 1)}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-sm text-gray-500 mt-2">
                  ...and {items.length - 3} more items
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderGuideTest;
