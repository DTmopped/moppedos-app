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
  const status = item.status?.trim() || 'Unknown';
  const isParItem = status.toLowerCase() === 'par item';
  const isCustom = status.toLowerCase() === 'custom';

  console.log(`${item.item} | status: ${status} | AdminMode: ${adminMode}`);

  return (
    <tr key={index} className="border-b">
      {/* ITEM NAME */}
      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
        {item.item}
        {isParItem && (
          <span className="ml-2 inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
            PAR Item
          </span>
        )}
        {isCustom && (
          <span className="ml-2 inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
            Custom
          </span>
        )}
      </td>

      {/* FORECAST FIELD (editable if PAR or admin) */}
      <td className="px-4 py-2">
        {(isParItem || adminMode) ? (
          <input
            type="number"
            className="w-20 rounded border border-gray-300 px-2 py-1 text-right"
            value={item.forecast}
            onChange={(e) =>
              handleItemChange(sectionName, index, 'forecast', Number(e.target.value))
            }
          />
        ) : (
          <span>{item.forecast}</span>
        )}
      </td>

      {/* ... other table cells (Actual, Variance, etc.) */}

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

