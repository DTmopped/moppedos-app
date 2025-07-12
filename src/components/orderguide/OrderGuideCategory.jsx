import React from 'react';

const OrderGuideCategoryComponent = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <table className="min-w-full text-sm text-left table-auto">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 font-medium text-muted-foreground">Item</th>
            <th className="px-4 py-2 font-medium text-muted-foreground text-right">Forecast</th>
            <th className="px-4 py-2 font-medium text-muted-foreground text-right">Unit</th>
            <th className="px-4 py-2 font-medium text-muted-foreground text-right">Actual</th>
            <th className="px-4 py-2 font-medium text-muted-foreground text-right">Variance</th>
            <th className="px-4 py-2 font-medium text-muted-foreground text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
              <td className="px-4 py-2 text-right">{item.forecast}</td>
              <td className="px-4 py-2 text-right">{item.unit}</td>
              <td className="px-4 py-2 text-right">{item.actual}</td>
              <td className="px-4 py-2 text-right">{item.variance}</td>
              <td className="px-4 py-2 text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item)}`}>
                  {getStatusIcon(item)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderGuideCategoryComponent;
