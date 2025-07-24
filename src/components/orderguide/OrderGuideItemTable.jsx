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
      <table className="min-w-full border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {['Item', 'Forecast', 'Actual', 'Variance', 'Unit', 'Status']
              .map((header) => (
                <th key={header} className="text-left px-4 py-2 text-sm font-semibold">{header}</th>
              ))}
            {isAdminMode && <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isManual = item?.isManual;
            const isPar = item?.isPar;

            const category = Object.keys(guideData).find(cat =>
              guideData[cat]?.some(i => i.name === item.name)
            ) || '';

            const showInput = isPar || (isManual && category !== 'Meats' && category !== 'Sides');

            const rowColor =
              isPar || isManual
                ? 'bg-yellow-50 text-amber-950'
                : 'bg-orange-50 text-orange-900';

            return (
              <tr key={`${item.name}-${idx}`} className={`border-t text-sm h-[40px] ${rowColor}`}>
                <td className="px-4 py-2 align-middle">{item.name}</td>
                <td className="px-4 py-2 align-middle">
                  {showInput ? (
                    <input
                      type="number"
                      value={item.forecast || ''}
                      className="w-20 px-2 py-1 border rounded text-sm bg-gray-50 dark:bg-gray-800"
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
                <td className="px-4 py-2 align-middle">{item.actual ?? 0}</td>
                <td className="px-4 py-2 align-middle">{item.variance ?? 0}</td>
                <td className="px-4 py-2 align-middle">{item.unit || ''}</td>
                <td className="px-4 py-2 align-middle">
                  {isPar ? (
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      PAR Item
                    </span>
                  ) : (
                    getStatusIcon(item)
                  )}
                </td>
                {isAdminMode && (
                  <td className="px-4 py-2 align-middle">
                    {isManual ? (
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-red-600 hover:underline text-sm"
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

