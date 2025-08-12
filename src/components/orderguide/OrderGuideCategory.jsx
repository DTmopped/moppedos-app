import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import OrderGuideItemTable from './OrderGuideItemTable.jsx';
// (Optional) If you use your AddItemModal, keep this import and button. Otherwise you can remove it.
// import AddItemModal from './AddItemModal.jsx';

const OrderGuideCategory = ({
  categoryTitle,
  items,
  getStatusClass,
  getStatusIcon,
  parBasedCategories,
  locationId,         // ⬅️ NEW from parent
  onRefresh,          // ⬅️ NEW from parent
}) => {
  const { isAdminMode } = useData();
  const [showModal, setShowModal] = useState(false);

  const safeItems = useMemo(() => Array.isArray(items) ? items : [], [items]);
  const safeGetStatusClass = useMemo(
    () => (typeof getStatusClass === 'function' ? getStatusClass : () => ''),
    [getStatusClass]
  );
  const safeGetStatusIcon = useMemo(
    () => (typeof getStatusIcon === 'function' ? getStatusIcon : () => null),
    [getStatusIcon]
  );

  const isParCategory = useMemo(
    () => Array.isArray(parBasedCategories) && parBasedCategories.includes(categoryTitle),
    [parBasedCategories, categoryTitle]
  );

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{categoryTitle}</h3>

        {isAdminMode && (
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus size={14} />
            Add Item
          </button>
        )}
      </div>

      {!isAdminMode && isParCategory && (
        <div className="text-sm text-gray-500 italic mb-2">
          Admin Mode required to edit PAR items.
        </div>
      )}

      <OrderGuideItemTable
        categoryTitle={categoryTitle}
        items={safeItems}
        getStatusClass={safeGetStatusClass}
        getStatusIcon={safeGetStatusIcon}
        isParCategory={isParCategory}
        // NEW: thread-through props for edge updates
        locationId={locationId}
        onRefresh={onRefresh}
      />

      {/* Optional AddItemModal */}
      {/* {isAdminMode && (
        <AddItemModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          category={categoryTitle}
        />
      )} */}
    </div>
  );
};

export default OrderGuideCategory;
