import React, { useState } from 'react';
import OrderGuideCategoryComponent from './OrderGuideCategory';
import { PlusCircle } from 'lucide-react'; // or any icon

const initialData = {
  Meats: [
    ['Brisket', 100, 'lbs', 90, -10],
    ['Pork Shoulder', 80, 'lbs', 85, +5],
  ],
  Sides: [
    ['Coleslaw', 40, 'lbs', 35, -5],
    ['Mac & Cheese', 50, 'lbs', 48, -2],
  ],
};

const OrderGuide = () => {
  const [orderGuideData, setOrderGuideData] = useState(initialData);

  const addItemToCategory = (category) => {
    const name = prompt("Enter item name:");
    const forecast = parseFloat(prompt("Enter forecasted amount:"));
    const unit = prompt("Enter unit (e.g. lbs, each):");

    if (!name || isNaN(forecast) || !unit) return;

    const newItem = [name, forecast, unit, 0, -forecast]; // default actual = 0
    setOrderGuideData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newItem],
    }));
  };

  const getStatusClass = (forecast, actual) => {
    const variance = actual - forecast;
    if (variance > 5) return 'bg-green-200';
    if (variance < -5) return 'bg-red-200';
    return 'bg-yellow-100';
  };

  const getStatusIcon = (forecast, actual) => {
    const variance = actual - forecast;
    if (variance > 5) return '⬆️';
    if (variance < -5) return '⬇️';
    return '➖';
  };

  return (
    <div className="space-y-6">
      {Object.entries(orderGuideData).map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{category}</h2>
            <button
              onClick={() => addItemToCategory(category)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <PlusCircle size={16} />
              Add Item
            </button>
          </div>
          <OrderGuideCategoryComponent
            categoryTitle={category}
            items={items}
            getStatusClass={getStatusClass}
            getStatusIcon={getStatusIcon}
          />
        </div>
      ))}
    </div>
  );
};

export default OrderGuide;
