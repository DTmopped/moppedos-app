import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabaseClient';

const AddItemModal = ({ isOpen, onClose, category }) => {
  const {
    manualAdditions,
    setManualAdditions,
    guideData,
    setGuideData,
  } = useData();

  const [itemName, setItemName] = useState('');
  const [forecast, setForecast] = useState('');
  const [unit, setUnit] = useState('');

  const handleAdd = async () => {
    if (!itemName || !forecast || !unit) return;

    const newItem = {
      name: itemName,
      forecast: Number(forecast),
      actual: 0,
      variance: Number(forecast),
      unit,
      status: 'custom',
    };

    // 1. Local state update
    const updatedManuals = {
      ...manualAdditions,
      [category]: [...(manualAdditions[category] || []), newItem],
    };
    setManualAdditions(updatedManuals);

    const updatedGuide = {
      ...guideData,
      [category]: [...(guideData[category] || []), newItem],
    };
    setGuideData(updatedGuide);

    // 2. Supabase sync
    const { error } = await supabase.from('order_guide_items').insert([
      {
        category,
        ...newItem,
      },
    ]);
    if (error) {
      console.error('Error syncing new item to Supabase:', error.message);
    }

    // 3. Reset and close
    setItemName('');
    setForecast('');
    setUnit('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-4">
            Add Item to {category}
          </Dialog.Title>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Forecast amount"
              value={forecast}
              onChange={(e) => setForecast(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Unit (e.g., lbs, each)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Add Item
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddItemModal;
