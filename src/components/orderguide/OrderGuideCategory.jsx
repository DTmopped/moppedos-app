import React, { useState } from 'react';
import OrderGuideItemTable from './OrderGuideItemTable.jsx';
import AddItemForm from './AddItemForm.jsx';
import { PlusCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const OrderGuideCategory = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  const { isAdminMode } = useData();
  const [showAddForm, setShowAddForm] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];
  const safeGetStatusClass = typeof getStatusClass === 'function' ? getStatusClass : () => '';
  const safeGetStatusIcon = typeof getStatusIcon === 'function' ? getStatusIcon : () => null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{categoryTitle}</h3>
        {isAdminMode && (
          <button
            onClick={() => setShowAddForm(prev => !prev)}
            className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
          >
            <PlusCircle size={16} />
            {showAddForm ? 'Close Form' : 'Add Item'}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddItemForm category={categoryTitle} onClose={() => setShowAddForm(false)} />
        </div>
      )}

      <OrderGuideItemTable
        items={safeItems}
        getStatusClass={safeGetStatusClass}
        getStatusIcon={safeGetStatusIcon}
      />
    </div>
  );
};

export default OrderGuideCategory;
