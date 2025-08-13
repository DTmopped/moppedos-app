// src/components/orderguide/AddItemModal.jsx
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/supabaseClient';

const AddItemModal = ({ isOpen, onClose, category, onAdded }) => {
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const reset = () => { setItemName(''); setUnit(''); setBusy(false); };

  const handleAdd = async () => {
    if (!itemName || !unit) return;
    setBusy(true);
    try {
      // Insert into master list; status rows are auto-handled by view cross-join,
      // and you seeded defaults already.
      const { error } = await supabase.from('order_guide_items').insert([
        { category, item_name: itemName, unit }
      ]);
      if (error) throw error;
      onAdded?.();
      reset();
      onClose();
    } catch (e) {
      console.error('AddItemModal insert error:', e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => !busy && onClose()} className="relative z-50">
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
              disabled={busy}
            />
            <input
              type="text"
              placeholder="Unit (e.g., lbs, each)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={busy}
            />

            <button
              onClick={handleAdd}
              disabled={busy || !itemName || !unit}
              className={`w-full text-white py-2 rounded transition ${
                busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {busy ? 'Adding…' : 'Add Item'}
            </button>

            <button
              onClick={onClose}
              disabled={busy}
              className="w-full mt-2 py-2 rounded border"
            >
              Cancel
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddItemModal;
