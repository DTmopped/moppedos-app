import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient'; // ✅ make sure this path is correct

const AddItemForm = ({ category, onClose }) => {
  const { guideData, setGuideData, manualAdditions, setManualAdditions } = useData();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [isPar, setIsPar] = useState(false);
  const [forecast, setForecast] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !unit || (isPar && forecast === '')) return;

    const newItem = {
      item_name: name,
      unit,
      category,
      status: isPar ? 'par item' : 'custom',
      forecast: isPar ? parseFloat(forecast) : 0,
      actual: 0,
      variance: isPar ? -parseFloat(forecast) : 0,
      is_manual: true,
    };

    setLoading(true);
    const { error } = await supabase.from('order_guide_items').insert([newItem]);
    setLoading(false);

    if (error) {
      console.error('❌ Failed to insert item into Supabase:', error.message);
      alert('Error adding item: ' + error.message);
      return;
    }

    // ✅ Update local UI state
    const updatedGuideData = {
      ...guideData,
      [category]: [...(guideData[category] || []), newItem],
    };

    const updatedManuals = {
      ...manualAdditions,
      [category]: [...(manualAdditions[category] || []), newItem],
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
