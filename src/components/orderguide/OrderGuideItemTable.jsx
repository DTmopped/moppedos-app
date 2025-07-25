import React from 'react';
import { useData } from '@/contexts/DataContext';
import { AlertTriangle, HelpCircle } from 'lucide-react';

const OrderGuideItemTable = ({
  items = [],
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

  const handleForecastChange = (e, itemToUpdate, isManual) => {
    const newForecast = Number(e.target.value);
    const sourceData = isManual ? manualAdditions : guideData;
    const updateFunc = isManual ? setManualAdditions : setGuideData;

    const category = Object.keys(sourceData).find(cat =>
      sourceData[cat]?.some(item => item.name === itemToUpdate.name)
    );
    if (!category) return;

    const updated = {
      ...sourceData,
      [category]: sourceData[category].map(item =>
        item.name === itemToUpdate.name
          ? {
              ...item,
              forecast: newForecast,
              variance: (newForecast || 0) - (item.actual || 0),
            }
          : item
      ),
    };

    updateFunc(updated);

    // Also update guideData so it stays synced
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
            const isParItem = item.status === 'PAR Item';
            const isCustom = item.status === 'Custom';
            const isManual = !!manualAdditions && Object.values(manualAdditions).some(cat =>
              cat.some(manualItem => manualItem.name === item.name)
            );

            return (
              <tr
                key={index}
                className={`border-t text-sm text-gray-800 h-[48px] ${isAdminMode ? 'bg-yellow-50' : ''}`}
              >
                <td className="px-3 py-2 font-semibold text-gray-900">{item.name}</td>

                <td className="px-3 py-2">
                  {isAdminMode && isParItem ? (
                    <input
                      type="number"
                      value={item.forecast}
                      onChange={(e) => handleForecastChange(e, item, isManual)}
                      className="w-full px-2 py-1 text-sm border rounded bg-white text-gray-900"
                    />
                  ) : (
                    <span>{item.forecast}</span>
                  )}
                </td>

                <td className="px-3 py-2">{item.actual}</td>
                <td className="px-3 py-2">{item.variance}</td>
                <td className="px-3 py-2">{item.unit}</td>

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

                {isAdminMode && (
                  <td className="px-3 py-2 text-right">
                    {isCustom ? (
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Auto</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;

