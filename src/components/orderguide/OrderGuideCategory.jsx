import React from 'react';
import OrderGuideItemTable from "./OrderGuideItemTable";

const OrderGuideCategory = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  const safeItems = Array.isArray(items) ? items : [];

  console.log("📦 [OrderGuideCategory] Rendering:", categoryTitle);
  console.log("📦 Items:", safeItems);
  console.log("📦 getStatusClass:", typeof getStatusClass);
  console.log("📦 getStatusIcon:", typeof getStatusIcon);

  const safeGetStatusClass = typeof getStatusClass === 'function' ? getStatusClass : () => '';
  const safeGetStatusIcon = typeof getStatusIcon === 'function' ? getStatusIcon : () => null;

  return (
    <div className="mb-6">
      <OrderGuideItemTable
        items={safeItems}
        getStatusClass={safeGetStatusClass}
        getStatusIcon={safeGetStatusIcon}
      />
    </div>
  );
};

export default OrderGuideCategory;
