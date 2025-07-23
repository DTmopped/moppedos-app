import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Trash2 } from 'lucide-react';

const OrderGuideItemTable = ({ items = [], getStatusClass = () => '', getStatusIcon = () => null }) => {
  const { manualAdditions, setManualAdditions, isAdminMode } = useData();

  const handleRemove = (itemToRemove) => {
    const category = Object.keys(manualAdditions).find(cat =>
      manualAdditions[cat]?.some(item => item.name === itemToRemove.name)
    );

    if (!category) return;

    const updatedItems = manualAdditions[category].filter(item => item.name !== itemToRemove.name);
    const updatedManualAdditions = { ...manualAdditions, [category]: updatedItems };
    setManualAdditions(updatedManualAdditions);
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
            const statusClass = getStatusClass(item);
            const statusIcon = getStatusIcon(item);

            return (
              <tr key={`${item.name}-${idx}`} className={`border-t ${statusClass}`}>
                <td className="px-4 py-2 text-sm">{item.name}</td>
                <td className="px-4 py-2 text-sm">{item.forecast}</td>
                <td className="px-4 py-2 text-sm">{item.actual}</td>
                <td className="px-4 py-2 text-sm">{item.variance}</td>
                <td className="px-4 py-2 text-sm">{item.unit}</td>
                <td className="px-4 py-2 text-sm">{statusIcon}</td>
                {isAdminMode && (
                  <td className="px-4 py-2">
                    {isManual ? (
                      <button onClick={() => handleRemove(item)}>
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
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
