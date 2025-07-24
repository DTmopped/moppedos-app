import React from 'react';
import OrderGuideItemTable from './OrderGuideItemTable.jsx';

const OrderGuideCategory = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  const safeItems = Array.isArray(items) ? items : [];
  const safeGetStatusClass = typeof getStatusClass === 'function' ? getStatusClass : () => '';
  const safeGetStatusIcon = typeof getStatusIcon === 'function' ? getStatusIcon : () => null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">{categoryTitle}</h3>
      <OrderGuideItemTable
        items={safeItems}
        getStatusClass={safeGetStatusClass}
        getStatusIcon={safeGetStatusIcon}
      />
    </div>
  );
};

export default OrderGuideCategory;
