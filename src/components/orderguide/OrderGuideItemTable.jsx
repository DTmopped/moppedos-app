import React from 'react';
import { useData } from '@/contexts/DataContext';

const OrderGuideItemTable = ({ items = [], getStatusClass = () => '', getStatusIcon = () => null }) => {
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
      [category]: manualAdditions[category].filter(item => item.name !== itemToRemove.name)
    };

    const updatedGuide = {
      ...guideData,
      [category]: guideData[category].filter(item => item.name !== itemToRemove.name)
    };

    setManualAdditions(updatedManuals);
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
            {isAdminMode && <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isManual = item?.isManual;
            const isPar = item?.isPar;
            const statusClass = getStatusClass(item);
            const statusIcon = getStatusIcon(item);

            return (
              <tr
                key={`${item.name}-${idx}`}
                className={`border-t ${statusClass} ${isPar ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
              >
                {/* ITEM NAME */}
                <td className="px-4 py-2 text-sm">{item.name}</td>

                {/* FORECAST (editable if PAR + AdminMode) */}
                <td className="px-4 py-2 text-sm">
                  {isPar && isAdminMode ? (
                    <input
                      type="number"
                      className="w-24 px-2 py-1 border rounded text-sm bg-white"
                      value={item.forecast}
                      onChange={(e) => {
                        const newForecast = parseFloat(e.target.value) || 0;
                        const category = Object.keys(guideData).find(cat =>
                          guideData[cat]?.some(i => i.name === item.name)
                        );
                        if (!category) return;

                        const updatedItems = guideData[category].map(i =>
                          i.name === item.name
                            ? { ...i, forecast: newForecast, variance: (i.actual - newForecast).toFixed(1) }
                            : i
                        );

                        const updatedGuide = { ...guideData, [category]: updatedItems };
                        setGuideData(updatedGuide);
                      }}
                    />
                  ) : (
                    item.forecast
                  )}
                </td>

                {/* ACTUAL */}
                <td className="px-4 py-2 text-sm">{item.actual}</td>

                {/* VARIANCE */}
                <td className="px-4 py-2 text-sm">{item.variance}</td>

                {/* UNIT */}
                <td className="px-4 py-2 text-sm">{item.unit}</td>

                {/* STATUS */}
                <td className="px-4 py-2 text-sm">
                  {isPar ? (
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      PAR Item
                    </span>
                  ) : (
                    statusIcon
                  )}
                </td>

                {/* ACTIONS */}
                {isAdminMode && (
                  <td className="px-4 py-2 text-sm">
                    {isManual ? (
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-red-600 hover:underline"
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
