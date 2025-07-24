import React, { useState } from 'react';
import OrderGuideItemTable from './OrderGuideItemTable.jsx';
import AddItemModal from './AddItemModal.jsx';
import { Plus } from 'lucide-react';

const OrderGuideCategory = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  const [showModal, setShowModal] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];
  const safeGetStatusClass = typeof getStatusClass === 'function' ? getStatusClass : () => '';
  const safeGetStatusIcon = typeof getStatusIcon === 'function' ? getStatusIcon : () => null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{categoryTitle}</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      <OrderGuideItemTable
        items={safeItems}
        getStatusClass={safeGetStatusClass}
        getStatusIcon={safeGetStatusIcon}
      />

      <AddItemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        category={categoryTitle}
      />
    </div>
  );
};

export default OrderGuideCategory;
