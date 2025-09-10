import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabaseClient'; // ✅ make sure this path is correct

const AddItemForm = ({ category, onClose, currentLocationId }) => {
  const { guideData, setGuideData, manualAdditions, setManualAdditions } = useData();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [isPar, setIsPar] = useState(false);
  const [forecast, setForecast] = useState('');
  const [loading, setLoading] = useState(false);

const handleAdd = async () => {
  if (!name || !unit || (isPar && forecast === '')) return;

  setLoading(true);
  const forecastValue = isPar ? parseInt(forecast, 10) : 0;

  // Step 1: Check if item already exists
  const { data: existingItem, error: fetchError } = await supabase
    .from('order_guide_items')
    .select('item_id')
    .eq('item_name', name)
    .eq('category', category)
    .eq('location_id', currentLocationId)
    .maybeSingle(); // ← avoid hard crash if no match

  if (fetchError) {
    console.error('Error checking for existing item:', fetchError.message);
    setLoading(false);
    return;
  }

  // Step 2: Reuse item_id or generate new one
  const itemUUID = existingItem?.item_id || crypto.randomUUID();

  // Step 3: Upsert via RPC
  const { data, error } = await supabase.rpc('insert_order_guide_status', {
    actual: 0,
    forecast: forecastValue,
    item_id: itemUUID,
    unit,
    location_id: currentLocationId,
    item_name: name
  });

  setLoading(false);

  if (error) {
    console.error('Insert/upsert failed:', error.message);
    return;
  }

  // Step 4: Update state
  const newItem = {
    ...data,
    name,
    isPar,
    isManual: true,
    status: isPar ? 'par item' : 'custom'
  };

  const updatedGuideData = {
    ...guideData,
    [category]: [...(guideData[category] || []), newItem]
  };

  const updatedManuals = {
    ...manualAdditions,
    [category]: [...(manualAdditions[category] || []), newItem]
  };

  setGuideData(updatedGuideData);
  setManualAdditions(updatedManuals);
  onClose();
};
  return (
    <div className="border p-4 rounded-md shadow bg-white dark:bg-gray-900">
      <h4 className="font-semibold text-base mb-2">{category}</h4>
      <div className="grid grid-cols-1 gap-3">
        <input
          type="text"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Unit (e.g., lbs, case)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border p-2 rounded"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPar}
            onChange={() => setIsPar(!isPar)}
          />
          PAR Item?
        </label>
        {isPar && (
          <input
            type="number"
            placeholder="PAR Forecast"
            value={forecast}
            onChange={(e) => setForecast(e.target.value)}
            className="border p-2 rounded"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddItemForm;
