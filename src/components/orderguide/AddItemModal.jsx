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
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [archivedItemId, setArchivedItemId] = useState(null);

  const checkArchivedItem = async (name) => {
    const { data, error } = await supabase
      .from('order_guide_items')
      .select('id')
      .eq('name', name)
      .eq('category', category)
      .eq('archived', true)
      .maybeSingle();

    if (data?.id) {
      setArchivedItemId(data.id);
      setShowRestorePrompt(true);
    } else {
      setArchivedItemId(null);
      setShowRestorePrompt(false);
    }
  };

  const handleNameChange = async (e) => {
    const value = e.target.value;
    setItemName(value);
    if (value.trim().length > 1) {
      await checkArchivedItem(value.trim());
    } else {
      setShowRestorePrompt(false);
    }
  };

  const handleRestore = async () => {
    if (!archivedItemId) return;

    const { error } = await supabase
      .from('order_guide_items')
      .update({ archived: false })
      .eq('id', archivedItemId);

    if (error) {
      console.error('Failed to restore item:', error.message);
      return;
    }

    const restoredItem = {
      name: itemName,
      forecast: Number(forecast),
      actual: 0,
      variance: Number(forecast),
      unit,
      status: 'custom',
    };

    const updatedManuals = {
      ...manualAdditions,
      [category]: [...(manualAdditions[category] || []), restoredItem],
    };
    setManualAdditions(updatedManuals);

    const updatedGuide = {
      ...guideData,
      [category]: [...(guideData[category] || []), restoredItem],
    };
    setGuideData(updatedGuide);

    resetAndClose();
  };

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

    const { error } = await supabase.from('order_guide_items').insert([
      {
        category,
        ...newItem,
      },
    ]);
    if (error) {
      console.error('Error syncing new item to Supabase:', error.message);
    }

    resetAndClose();
  };

  const resetAndClose = () => {
    setItemName('');
    setForecast('');
    setUnit('');
    setShowRestorePrompt(false);
    setArchivedItemId(null);
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
              onChange={handleNameChange}
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

            {showRestorePrompt ? (
              <button
                onClick={handleRestore}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
              >
                Restore Archived Item
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Add Item
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddItemModal;
