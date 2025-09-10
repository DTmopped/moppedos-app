// src/components/orderguide/OrderGuideCategory.jsx
import React, { useState, useMemo } from 'react';
import { Plus, Clock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import OrderGuideItemTable from './OrderGuideItemTable.jsx';
import AddItemModal from './AddItemModal.jsx';
import ArchivedItemsPanel from './ArchivedItemsPanel.jsx';

const OrderGuideCategory = ({
  categoryTitle,
  items,
  getStatusClass,
  getStatusIcon,
  parBasedCategories,
  locationId,
  onRefresh,
}) => {
  const { isAdminMode } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              Add Item
            </button>

            <button
              onClick={() => setShowArchive(true)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-white flex items-center gap-1"
            >
              <Clock size={14} />
              Archived
            </button>
          </div>
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
        locationId={locationId}
        onRefresh={onRefresh}
      />

      {isAdminMode && (
        <>
          <AddItemModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            category={categoryTitle}
            onAdded={onRefresh}
          />

          <ArchivedItemsPanel
            isOpen={showArchive}
            onClose={() => setShowArchive(false)}
            category={categoryTitle}
            onRestoreSuccess={onRefresh}
          />
        </>
      )}
    </div>
  );
};

export default OrderGuideCategory;
