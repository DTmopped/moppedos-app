import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabaseClient'; // ✅ make sure this path is correct

const AddItemForm = ({ category, onClose }) => {
  const { guideData, setGuideData, manualAdditions, setManualAdditions } = useData();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [isPar, setIsPar] = useState(false);
  const [forecast, setForecast] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
  if (!name || !unit || (isPar && forecast === '')) return;

  const itemUUID = crypto.randomUUID(); // You must generate a UUID here if it's a new manual item
  const forecastValue = isPar ? parseFloat(forecast) : 0;

  const { data, error } = await supabase.rpc('insert_order_guide_status', {
    loc_id: currentLocationId,   // This must be passed into your form via props or from context
    item_id: itemUUID,
    forecast: forecastValue,
    actual: 0,
    unit
  });

  if (error) {
    console.error('Insert failed:', error.message);
    return;
  }

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
