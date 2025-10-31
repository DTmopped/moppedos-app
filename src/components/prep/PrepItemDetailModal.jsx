import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertCircle,
  ChefHat
} from 'lucide-react';

const PrepItemDetailModal = ({ task, isOpen, onClose }) => {
  if (!task) return null;

  // Extract data
  const itemName = task.menu_items?.name || task.menu_item_name || 'Unknown Item';
  const category = task.menu_items?.category_normalized || task.category || '';
  const stationName = task.prep_stations?.name || task.station_name || 'Unknown';
  const quantity = task.quantity || 0;
  const unit = task.unit || task.menu_items?.base_unit || 'lbs';
  const smartFactor = task.smart_factor || 1.0;
  const confidence = task.confidence_level || 0;
  const cost = task.estimated_cost || 0;

  // Calculate base quantity (before smart factor)
  const baseQuantity = smartFactor > 0 ? (quantity / smartFactor).toFixed(1) : quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-blue-600" />
            {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-600">Quantity</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {quantity} {unit}
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-purple-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-gray-600">Smart Factor</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {smartFactor.toFixed(2)}x
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-gray-600">Est. Cost</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${cost.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Item Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Item Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Category</p>
                <Badge variant="outline">{category || 'Not specified'}</Badge>
              </div>
              <div>
                <p className="text-gray-500">Prep Station</p>
                <Badge variant="outline">{stationName}</Badge>
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

          {/* Smart Factor Explanation */}
          {smartFactor !== 1.0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Smart Calculation Applied
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    The base quantity of <strong>{baseQuantity} {unit}</strong> has been adjusted by{' '}
                    <strong>{smartFactor.toFixed(2)}x</strong> to <strong>{quantity} {unit}</strong> based on:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• Historical demand patterns for this day of week</li>
                    <li>• Expected guest count ({task.expected_guests || 'N/A'})</li>
                    <li>• Item popularity and service trends</li>
                    {confidence > 0 && (
                      <li>• Confidence level: {(confidence * 100).toFixed(0)}%</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Prep Instructions (if available) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Prep Instructions
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Standard prep procedures for <strong>{itemName}</strong>:
              </p>
              <ol className="mt-3 space-y-2 text-sm text-gray-700">
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
            <div className="space-y-3">
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
            <button
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrepItemDetailModal;
