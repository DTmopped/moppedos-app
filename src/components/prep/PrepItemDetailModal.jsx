import React from 'react';

const PrepItemDetailModal = ({ task, prepSchedule, onClose }) => {
  if (!task) return null;

  // Extract data using CORRECT field names
  const itemName = task.menu_items?.name || 'Unknown Item';
  const category = task.menu_items?.category_normalized || '';
  const stationName = task.prep_stations?.name || 'Unknown';
  const quantity = task.prep_quantity || 0;
  const unit = task.prep_unit || task.menu_items?.base_unit || 'lb';
  const smartFactor = prepSchedule?.adjustment_factor || 1.0;
  const cost = task.estimated_cost || 0;
  const notes = task.notes || '';

  // Calculate base quantity (before smart factor)
  const baseQuantity = smartFactor > 0 ? (quantity / smartFactor).toFixed(1) : quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{itemName}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Quantity</p>
              <p className="text-2xl font-bold text-blue-600">
                {quantity} {unit}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Smart Factor</p>
              <p className="text-2xl font-bold text-purple-600">
                {smartFactor.toFixed(2)}x
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Est. Cost</p>
              <p className="text-2xl font-bold text-green-600">
                ${cost.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-lg">Item Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-semibold">{category || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500">Prep Station</p>
                <p className="font-semibold">{stationName}</p>
              </div>
              <div>
                <p className="text-gray-500">Base Quantity</p>
                <p className="font-semibold">{baseQuantity} {unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Adjusted Quantity</p>
                <p className="font-semibold text-blue-600">{quantity} {unit}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Notes</h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">{notes}</p>
              </div>
            </div>
          )}

          {/* Smart Factor Explanation */}
          {smartFactor !== 1.0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">
                Smart Calculation Applied
              </h4>
              <p className="text-sm text-blue-800 mb-2">
                The base quantity of <strong>{baseQuantity} {unit}</strong> has been adjusted by{' '}
                <strong>{smartFactor.toFixed(2)}x</strong> to <strong>{quantity} {unit}</strong> based on:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Historical demand patterns for this day of week</li>
                <li>• Expected guest count ({prepSchedule?.expected_guests || 'N/A'})</li>
                <li>• Item popularity and service trends</li>
              </ul>
            </div>
          )}

          {/* Prep Instructions */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-lg">Prep Instructions</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                Standard prep procedures for <strong>{itemName}</strong>:
              </p>
              <ol className="space-y-2 text-sm text-gray-700">
                {category.toLowerCase().includes('protein') ? (
                  <>
                    <li>1. Remove from refrigeration 30 minutes before prep</li>
                    <li>2. Season according to house recipe</li>
                    <li>3. Preheat smoker to target temperature</li>
                    <li>4. Monitor internal temperature throughout cook</li>
                    <li>5. Rest before service</li>
                  </>
                ) : category.toLowerCase().includes('side') ? (
                  <>
                    <li>1. Gather all ingredients and equipment</li>
                    <li>2. Follow recipe card for measurements</li>
                    <li>3. Prepare in appropriate batch size</li>
                    <li>4. Store at proper temperature until service</li>
                  </>
                ) : category.toLowerCase().includes('dessert') ? (
                  <>
                    <li>1. Prepare according to recipe specifications</li>
                    <li>2. Portion into service containers</li>
                    <li>3. Label with prep date and time</li>
                    <li>4. Refrigerate until service</li>
                  </>
                ) : (
                  <li>Follow standard prep procedures for this item type</li>
                )}
              </ol>
            </div>
          </div>

          {/* Cost Breakdown */}
          {cost > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-lg">Cost Breakdown</h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Total Cost:</span>
                    <span className="font-semibold text-green-700">${cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per {unit}:</span>
                    <span className="font-semibold text-green-700">
                      ${quantity > 0 ? (cost / quantity).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Actual costs may vary based on current ingredient prices
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrepItemDetailModal;
