import React from 'react';
import { useData } from '@/contexts/DataContext';

const OrderGuideItemTable = ({ items = [], getStatusClass = () => '', getStatusIcon = () => null }) => {
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
        ? { ...item, forecast: newForecast, variance: (newForecast || 0) - (item.actual || 0) }
        : item
    );

    setGuideData({ ...guideData, [category]: updatedCategory });
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
          ? { ...item, forecast: newForecast, variance: (newForecast || 0) - (item.actual || 0) }
          : item
      ),
    };

    const updatedGuide = {
      ...guideData,
      [category]: guideData[category].map(item =>
        item.name === itemToUpdate.name
          ? { ...item, forecast: newForecast, variance: (newForecast || 0) - (item.actual || 0) }
          : item
      ),
    };

    setManualAdditions(updatedManuals);
    setGuideData(updatedGuide);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100">
        <thead className="bg-gray-100 dark:bg-gray-800 text-left font-semibold">
          <tr>
            <th className="px-4 py-2">Item</th>
            <th className="px-4 py-2">Forecast</th>
            <th className="px-4 py-2">Actual</th>
            <th className="px-4 py-2">Variance</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Status</th>
            {isAdminMode && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isManual = item?.isManual;
            const isPar = item?.isPar;
            const statusClass = getStatusClass(item);
            const statusIcon = getStatusIcon(item);

            const category = Object.keys(guideData).find(cat =>
              guideData[cat]?.some(i => i.name === item.name)
            ) || '';

            const showInput = isPar || (isManual && category !== 'Meats' && category !== 'Sides');

            const rowClass = `h-[44px] align-middle ${
              isPar
                ? 'bg-yellow-50 dark:bg-yellow-900/10'
                : isManual
                ? 'bg-blue-50 dark:bg-blue-900/10'
                : 'bg-white dark:bg-gray-900'
            }`;

            return (
              <tr key={`${item.name}-${idx}`} className={`${rowClass} border-t border-gray-200 dark:border-gray-700`}>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">
                  {showInput ? (
                    <input
                      type="number"
                      value={item.forecast || ''}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-sm"
                      onChange={(e) =>
                        isManual
                          ? handleManualForecastChange(e, item)
                          : handleParForecastChange(e, item)
                      }
                    />
                  ) : (
                    <span>{item.forecast ?? 0}</span>
                  )}
                </td>
                <td className="px-4 py-2">{item.actual ?? 0}</td>
                <td className="px-4 py-2">{item.variance ?? 0}</td>
                <td className="px-4 py-2">{item.unit || ''}</td>
                <td className="px-4 py-2">
                  {isPar ? (
                    <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                      PAR Item
                    </span>
                  ) : (
                    statusIcon
                  )}
                </td>
                {isAdminMode && (
                  <td className="px-4 py-2">
                    {isManual ? (
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-xs italic text-gray-400">Auto</span>
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

