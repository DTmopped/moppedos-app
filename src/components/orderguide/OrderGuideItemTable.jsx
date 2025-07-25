import React from 'react';
import { useData } from '@/contexts/DataContext';

const OrderGuideItemTable = ({
  items = [],
  getStatusClass = () => '',
  getStatusIcon = () => null
}) => {
  const {
    manualAdditions,
    setManualAdditions,
    isAdminMode,
    setGuideData,
    guideData,
  } = useData();

  const handleRemove = (itemToRemove) => {
    const category = Object.keys(manualAdditions).find(cat =>
      manualAdditions[cat]?.some(item => item.name === itemToRemove.name)
    );
    if (!category) return;

    const updatedManuals = {
      ...manualAdditions,
      [category]: manualAdditions[category].filter(item => item.name !== itemToRemove.name),
    };

    const updatedGuide = {
      ...guideData,
      [category]: guideData[category].filter(item => item.name !== itemToRemove.name),
    };

    setManualAdditions(updatedManuals);
    setGuideData(updatedGuide);
  };

  const handleParForecastChange = (e, itemToUpdate) => {
    const newForecast = Number(e.target.value);
    const category = Object.keys(guideData).find(cat =>
      guideData[cat]?.some(item => item.name === itemToUpdate.name)
    );
    if (!category) return;

    const updatedCategory = guideData[category].map(item =>
      item.name === itemToUpdate.name
        ? {
            ...item,
            forecast: newForecast,
            variance: (newForecast || 0) - (item.actual || 0),
          }
        : item
    );

    setGuideData({
      ...guideData,
      [category]: updatedCategory,
    });
  };

  const handleManualForecastChange = (e, itemToUpdate) => {
    const newForecast = Number(e.target.value);
    const category = Object.keys(manualAdditions).find(cat =>
      manualAdditions[cat]?.some(item => item.name === itemToUpdate.name)
    );
    if (!category) return;

    const updatedManuals = {
      ...manualAdditions,
      [category]: manualAdditions[category].map(item =>
        item.name === itemToUpdate.name
          ? {
              ...item,
              forecast: newForecast,
              variance: (newForecast || 0) - (item.actual || 0),
            }
          : item
      ),
    };

    setManualAdditions(updatedManuals);

    const updatedGuide = {
      ...guideData,
      [category]: guideData[category].map(item =>
        item.name === itemToUpdate.name
          ? {
              ...item,
              forecast: newForecast,
              variance: (newForecast || 0) - (item.actual || 0),
            }
          : item
      ),
    };

    setGuideData(updatedGuide);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 text-sm font-semibold">Item</th>
            <th className="text-left px-4 py-2 text-sm font-semibold">Forecast</th>
            <th className="text-left px-4 py-2 text-sm font-semibold">Actual</th>
            <th className="text-left px-4 py-2 text-sm font-semibold">Variance</th>
            <th className="text-left px-4 py-2 text-sm font-semibold">Unit</th>
            <th className="text-left px-4 py-2 text-sm font-semibold">Status</th>
            {isAdminMode && (
              <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
            )}
          </tr>
        </thead>
       <tbody>
  {items.map((item, index) => {
    const isAdmin = adminMode;
    const isParItem = item.status === 'PAR Item';
    const isCustom = item.status === 'Custom';

    return (
      <tr
        key={index}
        className={`${
          isAdmin ? 'bg-yellow-50' : ''
        } border-t text-sm text-gray-800 h-[48px]`}
      >
        {/* Item Name */}
        <td className="px-3 py-2 font-semibold text-gray-900">{item.name}</td>

        {/* Forecast (editable if admin + par item) */}
        <td className="px-3 py-2">
          {isAdmin && isParItem ? (
            <input
              type="number"
              value={item.forecast}
              onChange={(e) => handleManualChange(e, category, index)}
              className="w-full px-2 py-1 text-sm border rounded bg-white text-gray-900"
            />
          ) : (
            <span>{item.forecast}</span>
          )}
        </td>

        {/* Actual */}
        <td className="px-3 py-2">{item.actual}</td>

        {/* Variance */}
        <td className="px-3 py-2">{item.variance}</td>

        {/* Unit */}
        <td className="px-3 py-2">{item.unit}</td>

        {/* Status */}
        <td className="px-3 py-2">
          {isParItem ? (
            <span className="inline-block px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-200 rounded">
              PAR Item
            </span>
          ) : isCustom ? (
            <HelpCircle size={16} className="text-gray-500 inline" />
          ) : (
            <AlertTriangle size={16} className="text-yellow-500 inline" />
          )}
        </td>

        {/* Actions */}
        <td className="px-3 py-2 text-right">
          {isAdmin && isCustom ? (
            <button
              onClick={() => handleRemoveItem(category, index)}
              className="text-red-600 hover:underline text-sm"
            >
              Delete
            </button>
          ) : (
            <span className="text-gray-400 text-xs italic">Auto</span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;

