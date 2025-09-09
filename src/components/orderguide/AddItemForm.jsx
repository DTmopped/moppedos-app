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

  // 🔍 Step 1: Look up category_id from category name
  const { data: categoryData, error: categoryError } = await supabase
    .from('order_guide_categories')
    .select('id')
    .eq('name', category)
    .single();

  if (categoryError || !categoryData) {
    console.error('❌ Failed to find category ID:', categoryError);
    alert(`Error: Could not find category "${category}" in database.`);
    return;
  }

  const category_id = categoryData.id;

  // ✅ Step 2: Insert into order_guide_items
  const { error: insertError } = await supabase.from('order_guide_items').insert({
    name,
    unit,
    category_id,
    is_par: isPar,
    is_manual: true,
    forecast: isPar ? parseFloat(forecast) : 0,
    actual: 0,
    variance: isPar ? -parseFloat(forecast) : 0,
    status: isPar ? 'par item' : 'custom',
  });

  if (insertError) {
    console.error('❌ Failed to insert item:', insertError);
    alert(`Error: Could not add item. ${insertError.message}`);
    return;
  }

  // ✅ Step 3: Update local state
  const newItem = {
    name,
    unit,
    isPar,
    status: isPar ? 'par item' : 'custom',
    isManual: true,
    forecast: isPar ? parseFloat(forecast) : 0,
    actual: 0,
    variance: isPar ? -parseFloat(forecast) : 0,
  };

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
