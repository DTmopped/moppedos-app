import React from 'react';
import OrderGuideItemTable from './OrderGuideItemTable';

const OrderGuideCategory = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{categoryTitle}</h3>
      <OrderGuideItemTable
        items={items}
        getStatusClass={getStatusClass}
        getStatusIcon={getStatusIcon}
      />
    </div>
  );
};

export default OrderGuideCategory;
