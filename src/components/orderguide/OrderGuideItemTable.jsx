import React from 'react';

const OrderGuideItemTable = ({ items, getStatusClass, getStatusIcon }) => {
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
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const statusClass =
              typeof getStatusClass === 'function' ? getStatusClass(item) : '';
            const statusIcon =
              typeof getStatusIcon === 'function' ? getStatusIcon(item) : null;

            return (
              <tr
                key={item.name + idx}
                className={`border-t border-gray-200 dark:border-gray-700 ${statusClass}`}
              >
                <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                <td className="px-4 py-2 text-sm">{item.forecast}</td>
                <td className="px-4 py-2 text-sm">{item.actual}</td>
                <td className="px-4 py-2 text-sm">{item.variance}</td>
                <td className="px-4 py-2 text-sm">{item.unit}</td>
                <td className="px-4 py-2 text-sm">{statusIcon}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;
