import React from 'react';
import OrderGuideItemTable from './OrderGuideItemTable';

const OrderGuideCategory = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  // 🧪 Debug log to confirm function props
  console.log(`🧪 [OrderGuideCategory] Props for ${categoryTitle}:`, {
    getStatusClass,
    getStatusIcon
  });

  // ✅ Safe fallback guards
  const safeGetStatusClass = typeof getStatusClass === 'function'
    ? getStatusClass
    : () => '';

  const safeGetStatusIcon = typeof getStatusIcon === 'function'
    ? getStatusIcon
    : () => null;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{categoryTitle}</h3>
      <OrderGuideItemTable
        items={Array.isArray(items) ? items : []}
        getStatusClass={safeGetStatusClass}
        getStatusIcon={safeGetStatusIcon}
      />
    </div>
  );
};

export default OrderGuideCategory;
