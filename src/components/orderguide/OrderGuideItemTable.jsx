import React from 'react';
import { useData } from '@/contexts/DataContext';
import { AlertTriangle, HelpCircle } from 'lucide-react';

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
    guideData
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

  const handleForecastChange = (e, itemToUpdate) => {
    const newForecast = Number(e.target.value);

    const source = manualAdditions && Object.keys(manualAdditions).some(cat =>
      manualAdditions[cat]?.some(item => item.name === itemToUpdate.name)
    ) ? manualAdditions : guideData;

    const setSource = source === manualAdditions ? setManualAdditions : setGuideData;

    const category = Object.keys(source).find(cat =>
      source[cat]?.some(item => item.name === itemToUpdate.name)
    );
    if (!category) return;

    const updatedItems = source[category].map(item =>
      item.name === itemToUpdate.name
        ? {
            ...item,
            forecast: newForecast,
            variance: (newForecast || 0) - (item.actual || 0),
          }
        : item
    );

    setSource({
      ...source,
      [category]: updatedItems
    });

    if (source === manualAdditions) {
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
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Item</th>
            <th className="text-left px-4 py-2 font-semibold">Forecast</th>
            <th className="text-left px-4 py-2 font-semibold">Actual</th>
            <th className="text-left px-4 py-2 font-semibold">Variance</th>
            <th className="text-left px-4 py-2 font-semibold">Unit</th>
            <th className="text-left px-4 py-2 font-semibold">Status</th>
            {isAdminMode && (
              <th className="text-left px-4 py-2 font-semibold">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isParItem = item.status?.toLowerCase() === 'par item';
            const isCustom = item.status?.toLowerCase() === 'custom';

            return (
              <tr key={index} className="border-t h-[48px] bg-yellow-50">
                {/* Item */}
                <td className="px-3 py-2 font-semibold text-gray-900">{item.name}</td>

                {/* Forecast */}
                <td className="px-3 py-2">
                  {isAdminMode && isParItem ? (
                    <input
                      type="number"
                      value={item.forecast}
                      onChange={(e) => handleForecastChange(e, item)}
                      className="w-full px-2 py-1 border rounded text-gray-900 text-sm bg-white"
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
                {isAdminMode && (
                  <td className="px-3 py-2">
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

