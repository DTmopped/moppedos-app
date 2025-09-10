// src/components/orderguide/AddItemModal.jsx

import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/supabaseClient';
import { useData } from '@/contexts/DataContext'; // ✅ uses shared context

const AddItemModal = ({ isOpen, onClose, category }) => {
  const {
    locationId,
    setGuideData,
    setManualAdditions,
    guideData,
    manualAdditions
  } = useData();

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
    if (!itemName || !unit) return;
    setBusy(true);

    try {
      // STEP 1: Add to master item list
      const { data: insertedItems, error: insertError } = await supabase
        .from('order_guide_items')
        .insert([{ category, item_name: itemName, unit }])
        .select();

      if (insertError) throw insertError;

      const itemId = insertedItems?.[0]?.id;
      if (!itemId) throw new Error('Item insert succeeded but no ID returned');

      // STEP 2: Insert status row via RPC
      const { error: rpcError } = await supabase.rpc('insert_order_guide_status', {
        loc_id: locationId,
        item_id: itemId,
        forecast: Number(forecast) || 0,
        actual: Number(actual) || 0,
        unit,
      });

      if (rpcError) throw rpcError;

      // STEP 3: Build new item object
      const newItem = {
        item_id: itemId,
        name: itemName,
        unit,
        forecast: Number(forecast) || 0,
        actual: Number(actual) || 0,
        variance: Number(((actual || 0) - (forecast || 0)).toFixed(1)),
        status: 'manual',
        isManual: true,
      };

      // STEP 4: Optimistically update local context
      setManualAdditions(prev => ({
        ...prev,
        [category]: [...(prev?.[category] || []), newItem],
      }));

      setGuideData(prev => ({
        ...prev,
        [category]: [...(prev?.[category] || []), newItem],
      }));

      // STEP 5: Cleanup
      reset();
      onClose();
    } catch (e) {
      console.error('AddItemModal error:', e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => !busy && onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-4">Add Item to {category}</Dialog.Title>

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
              placeholder="Unit (e.g., lbs, case)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={busy}
            />
            <input
              type="number"
              placeholder="Forecast (PAR)"
              value={forecast}
              onChange={(e) => setForecast(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={busy}
            />
            <input
              type="number"
              placeholder="Actual (On Hand)"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
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
