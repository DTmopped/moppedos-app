import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';

const AddItemForm = ({ category, onClose }) => {
  const { addItem, isAdminMode } = useData();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [isPar, setIsPar] = useState(true);
  const [forecast, setForecast] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !unit || (isPar && forecast === '')) {
      alert('Please fill in all required fields.');
      return;
    }

    const newItem = {
      name,
      unit,
      isPar,
      forecast: isPar ? Number(forecast) : 0,
      actual: 0,
      variance: 0,
      isManual: true
    };

    addItem(category, newItem);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <div className="mb-2">
        <label className="block text-sm font-medium">Item Name</label>
        <input className="w-full border px-2 py-1 rounded" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Unit</label>
        <input className="w-full border px-2 py-1 rounded" value={unit} onChange={e => setUnit(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={isPar} onChange={() => setIsPar(!isPar)} />
          <span>PAR Item?</span>
        </label>
      </div>
      {isPar && (
        <div className="mb-2">
          <label className="block text-sm font-medium">PAR Forecast</label>
          <input
            type="number"
            className="w-full border px-2 py-1 rounded"
            value={forecast}
            onChange={e => setForecast(e.target.value)}
          />
        </div>
      )}
      <div className="flex justify-end mt-4 gap-2">
        <button type="button" onClick={onClose} className="text-gray-500 hover:underline">Cancel</button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Add Item</button>
      </div>
    </form>
  );
};

export default AddItemForm;
