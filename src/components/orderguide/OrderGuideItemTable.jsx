import React from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, HelpCircle } from 'lucide-react';

const OrderGuideItemTable = ({ items = [], categoryTitle }) => {
  const {
    manualAdditions,
    setManualAdditions,
    isAdminMode,
    setGuideData,
    guideData
  } = useData();

  const filteredItems = items.filter(item => item.name !== categoryTitle);

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
    const isManual = Object.keys(manualAdditions).some(cat =>
      manualAdditions[cat]?.some(item => item.name === itemToUpdate.name)
    );

    const source = isManual ? manualAdditions : guideData;
    const setSource = isManual ? setManualAdditions : setGuideData;

    const category = Object.keys(source).find(cat =>
      source[cat]?.some(item => item.name === itemToUpdate.name)
    );
    if (!category) return;

    const updatedItems = source[category].map(item =>
      item.name === itemToUpdate.name
        ? { ...item, forecast: newForecast, variance: (newForecast || 0) - (item.actual || 0) }
        : item
    );

    setSource({ ...source, [category]: updatedItems });

    if (isManual) {
      const updatedGuide = {
        ...guideData,
        [category]: guideData[category].map(item =>
          item.name === itemToUpdate.name
            ? { ...item, forecast: newForecast, variance: (newForecast || 0) - (item.actual || 0) }
            : item
        ),
      };
      setGuideData(updatedGuide);
    }
  };

  const handleNameChange = async (newName, itemToUpdate) => {
    const category = Object.keys(guideData).find(cat =>
      guideData[cat]?.some(item => item.name === itemToUpdate.name)
    );
    if (!category) return;

    const updatedGuideItems = guideData[category].map(item =>
      item.name === itemToUpdate.name ? { ...item, name: newName } : item
    );
    setGuideData({ ...guideData, [category]: updatedGuideItems });

    if (manualAdditions[category]) {
      const updatedManuals = manualAdditions[category].map(item =>
        item.name === itemToUpdate.name ? { ...item, name: newName } : item
      );
      setManualAdditions({ ...manualAdditions, [category]: updatedManuals });

      // ✅ Sync to Supabase
      const { error } = await supabase
        .from('manual_additions')
        .update({ name: newName })
        .eq('name', itemToUpdate.name)
        .eq('category', category);

      if (error) {
        console.error('Error updating name in Supabase:', error);
      }
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
            {isAdminMode && <th className="text-left px-4 py-2 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, index) => {
            const name = item.name || 'Unnamed Item';
            const status = item.status?.trim().toLowerCase() || 'unknown';
            const isParItem = status === 'par item';
            const isCustom = status === 'custom';

            return (
              <tr key={index} className="border-b dark:border-gray-700">
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap bg-yellow-50">
                  {isAdminMode ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value, item)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <>
                      {name}
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
                    </>
                  )}
                </td>

                <td className="px-4 py-2 bg-yellow-50">
                  <input
                    type="number"
                    className={`w-20 rounded border border-gray-300 px-2 py-1 text-right ${
                      (!isAdminMode || (isParItem && !isAdminMode)) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={item.forecast}
                    onChange={(e) => handleForecastChange(e, item)}
                    readOnly={!isAdminMode || (isParItem && !isAdminMode)}
                  />
                </td>

                <td className="px-3 py-2 bg-yellow-50">{item.actual}</td>
                <td className="px-3 py-2 bg-yellow-50">{item.variance}</td>
                <td className="px-3 py-2 bg-yellow-50">{item.unit}</td>

                <td className="px-3 py-2 bg-yellow-50">
                  {isParItem && (
                    <span className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      <AlertTriangle className="w-3 h-3 mr-1 text-yellow-600" />
                      PAR Item
                    </span>
                  )}
                  {isCustom && (
                    <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                      <HelpCircle className="w-3 h-3 mr-1 text-blue-600" />
                      Custom
                    </span>
                  )}
                </td>

                {isAdminMode && (
                  <td className="px-3 py-2 bg-yellow-50">
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

