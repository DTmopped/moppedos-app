// src/components/orderguide/AddItemModal.jsx
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/supabaseClient';
import { useData } from '@/contexts/DataContext';

const AddItemModal = ({ isOpen, onClose, category, onAdded }) => {
  const { locationId } = useData(); // 🔑 Pull current location UUID
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('');
  const [forecast, setForecast] = useState('');
  const [actual, setActual] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setItemName('');
    setUnit('');
    setForecast('');
    setActual('');
    setBusy(false);
  };

  const handleAdd = async () => {
    if (!itemName || !unit || !forecast || !actual || !locationId) return;
    setBusy(true);

    try {
      // 1. Insert item into order_guide_items table
      const { data: insertResult, error: insertError } = await supabase
        .from('order_guide_items')
        .insert([{ category, item_name: itemName, unit }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      const itemId = insertResult?.id;
      if (!itemId) throw new Error('Failed to retrieve inserted item ID.');

      // 2. Insert related row into order_guide_status via RPC
      const { error: statusError } = await supabase.rpc('insert_order_guide_status', {
        loc_id: locationId,
        item_id: itemId,
        forecast: Number(forecast),
        actual: Number(actual),
        unit
      });

      if (statusError) throw statusError;

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
              placeholder="Unit (e.g., lb, each)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={busy}
            />

            <input
              type="number"
              placeholder="Forecast amount"
              value={forecast}
              onChange={(e) => setForecast(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={busy}
            />

            <input
              type="number"
              placeholder="Actual amount"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={busy}
            />

            <button
              onClick={handleAdd}
              disabled={busy || !itemName || !unit || !forecast || !actual}
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
