import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useSmartPrepGuide } from '../hooks/useSmartPrepGuide';

const MoppedosSmartPrepGuide = () => {
  const { user, location } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedVolume, setExpectedVolume] = useState({ lunch: 250, dinner: 300 });
  const [activeStation, setActiveStation] = useState('lunch');

  // Use the existing prep guide hook
  const {
    prepData,
    setPrepData,
    loading,
    error,
    savePrepData,
    loadPrepData
  } = useSmartPrepGuide();

  // Moppedos-specific prep template
  const moppedosPrepTemplate = {
    lunch: {
      proteins: [
        { item: 'half chicken', category: 'proteins', unit: 'lb', usageRate: 0.04 },
        { item: 'pork ribs', category: 'proteins', unit: 'lb', usageRate: 0.06 },
        { item: 'beef short ribs', category: 'proteins', unit: 'lb', usageRate: 0.05 },
        { item: 'pork shoulder', category: 'proteins', unit: 'lb', usageRate: 0.05 },
        { item: 'brisket', category: 'proteins', unit: 'lb', usageRate: 0.07 }
      ],
      sides: [
        { item: 'collard greens', category: 'sides', unit: 'lb', usageRate: 0.02 },
        { item: 'mac & cheese', category: 'sides', unit: 'lb', usageRate: 0.03 },
        { item: 'cole slaw', category: 'sides', unit: 'lb', usageRate: 0.02 },
        { item: 'baked beans', category: 'sides', unit: 'lb', usageRate: 0.02 },
        { item: 'corn casserole', category: 'sides', unit: 'lb', usageRate: 0.02 }
      ],
      desserts: [
        { item: 'banana pudding', category: 'desserts', unit: 'each', usageRate: 0.1 },
        { item: 'hummingbird cake', category: 'desserts', unit: 'each', usageRate: 0.08 },
        { item: 'key lime pie', category: 'desserts', unit: 'each', usageRate: 0.06 }
      ],
      misc: [
        { item: 'buns', category: 'misc', unit: 'pack', usageRate: 0.02 },
        { item: 'texas toast', category: 'misc', unit: 'pack', usageRate: 0.02 },
        { item: 'honey butter', category: 'misc', unit: 'lb', usageRate: 0.01 }
      ]
    },
    dinner: {
      proteins: [
        { item: 'half chicken', category: 'proteins', unit: 'lb', usageRate: 0.05 },
        { item: 'pork ribs', category: 'proteins', unit: 'lb', usageRate: 0.08 },
        { item: 'beef short ribs', category: 'proteins', unit: 'lb', usageRate: 0.06 },
        { item: 'pork shoulder', category: 'proteins', unit: 'lb', usageRate: 0.06 },
        { item: 'brisket', category: 'proteins', unit: 'lb', usageRate: 0.09 }
      ],
      sides: [
        { item: 'collard greens', category: 'sides', unit: 'lb', usageRate: 0.03 },
        { item: 'mac & cheese', category: 'sides', unit: 'lb', usageRate: 0.04 },
        { item: 'cole slaw', category: 'sides', unit: 'lb', usageRate: 0.03 },
        { item: 'baked beans', category: 'sides', unit: 'lb', usageRate: 0.03 },
        { item: 'corn casserole', category: 'sides', unit: 'lb', usageRate: 0.03 }
      ],
      desserts: [
        { item: 'banana pudding', category: 'desserts', unit: 'each', usageRate: 0.12 },
        { item: 'hummingbird cake', category: 'desserts', unit: 'each', usageRate: 0.10 },
        { item: 'key lime pie', category: 'desserts', unit: 'each', usageRate: 0.08 }
      ],
      misc: [
        { item: 'buns', category: 'misc', unit: 'pack', usageRate: 0.03 },
        { item: 'texas toast', category: 'misc', unit: 'pack', usageRate: 0.03 },
        { item: 'honey butter', category: 'misc', unit: 'lb', usageRate: 0.015 }
      ]
    },
    bulk: {
      proteins: [
        { item: 'half chicken (cold smoke)', category: 'proteins', unit: 'lb', usageRate: 0.1, notes: 'Cold smoke for tomorrow' },
        { item: 'pork ribs (cold smoke)', category: 'proteins', unit: 'lb', usageRate: 0.15, notes: 'Cold smoke for tomorrow' },
        { item: 'beef short ribs (cold smoke)', category: 'proteins', unit: 'lb', usageRate: 0.12, notes: 'Cold smoke for tomorrow' },
        { item: 'pork shoulder (cold smoke)', category: 'proteins', unit: 'lb', usageRate: 0.12, notes: 'Cold smoke for tomorrow' },
        { item: 'brisket (cold smoke)', category: 'proteins', unit: 'lb', usageRate: 0.18, notes: 'Cold smoke for tomorrow' }
      ],
      sides: [
        { item: 'collard greens (prep)', category: 'sides', unit: 'lb', usageRate: 0.05, notes: 'Prep for tomorrow' },
        { item: 'mac & cheese (prep)', category: 'sides', unit: 'lb', usageRate: 0.07, notes: 'Prep for tomorrow' },
        { item: 'cole slaw (prep)', category: 'sides', unit: 'lb', usageRate: 0.05, notes: 'Prep for tomorrow' }
      ],
      desserts: [
        { item: 'banana pudding (prep)', category: 'desserts', unit: 'each', usageRate: 0.2, notes: 'Prep for tomorrow' },
        { item: 'hummingbird cake (prep)', category: 'desserts', unit: 'each', usageRate: 0.15, notes: 'Prep for tomorrow' }
      ],
      misc: [
        { item: 'buns (stock)', category: 'misc', unit: 'pack', usageRate: 0.05, notes: 'Stock for tomorrow' },
        { item: 'honey butter (prep)', category: 'misc', unit: 'lb', usageRate: 0.03, notes: 'Stock for tomorrow' }
      ]
    }
  };

  // Calculate prep amounts based on volume and usage rates
  const calculatePrepAmount = (item, volume, parLevel = 15, onHand = 5) => {
    const requiredForService = Math.ceil(volume * item.usageRate);
    const totalNeeded = Math.max(parLevel, requiredForService);
    const prepNeeded = Math.max(0, totalNeeded - onHand);
    return prepNeeded;
  };

  // Generate prep data with calculations
  const generatePrepData = () => {
    const currentVolume = activeStation === 'lunch' ? expectedVolume.lunch : 
                         activeStation === 'dinner' ? expectedVolume.dinner : 
                         expectedVolume.lunch + expectedVolume.dinner;

    const stationData = moppedosPrepTemplate[activeStation];
    const generatedData = {};

    Object.keys(stationData).forEach(category => {
      generatedData[category] = stationData[category].map((item, index) => ({
        id: `${activeStation}-${category}-${index}`,
        item: item.item,
        category: item.category,
        unit: item.unit,
        onHand: 5, // Default - should come from inventory
        parLevel: 15, // Default - should be configurable
        prepAmount: calculatePrepAmount(item, currentVolume),
        notes: item.notes || '',
        assigned: '',
        completed: false,
        usageRate: item.usageRate
      }));
    });

    return generatedData;
  };

  // Load data when component mounts or station changes
  useEffect(() => {
    if (user && location) {
      loadPrepData(selectedDate, user.id, location.id);
    }
  }, [selectedDate, user, location, loadPrepData]);

  // Handle item completion toggle
  const toggleItemCompletion = (itemId) => {
    const updatedData = { ...prepData };
    Object.keys(updatedData).forEach(station => {
      if (updatedData[station] && typeof updatedData[station] === 'object') {
        Object.keys(updatedData[station]).forEach(category => {
          if (Array.isArray(updatedData[station][category])) {
            updatedData[station][category] = updatedData[station][category].map(item => 
              item.id === itemId ? { ...item, completed: !item.completed } : item
            );
          }
        });
      }
    });
    setPrepData(updatedData);
  };

  // Handle assignment changes
  const updateAssignment = (itemId, assigned) => {
    const updatedData = { ...prepData };
    Object.keys(updatedData).forEach(station => {
      if (updatedData[station] && typeof updatedData[station] === 'object') {
        Object.keys(updatedData[station]).forEach(category => {
          if (Array.isArray(updatedData[station][category])) {
            updatedData[station][category] = updatedData[station][category].map(item => 
              item.id === itemId ? { ...item, assigned } : item
            );
          }
        });
      }
    });
    setPrepData(updatedData);
  };

  // Get current station data or generate if not exists
  const getCurrentStationData = () => {
    if (prepData && prepData[activeStation]) {
      return prepData[activeStation];
    }
    return generatePrepData();
  };

  const currentStationData = getCurrentStationData();

  // Calculate completion percentage
  const getStationProgress = (stationData) => {
    if (!stationData) return 0;
    const allItems = [];
    Object.keys(stationData).forEach(category => {
      if (Array.isArray(stationData[category])) {
        allItems.push(...stationData[category]);
      }
    });
    if (allItems.length === 0) return 0;
    const completed = allItems.filter(item => item.completed).length;
    return Math.round((completed / allItems.length) * 100);
  };

  const PrepItem = ({ item }) => (
    <div className={`p-4 mb-3 rounded border ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => toggleItemCompletion(item.id)}
            className="w-4 h-4"
          />
          <div>
            <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {item.item}
            </span>
            {item.notes && (
              <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">On Hand</div>
            <div className="font-medium">{item.onHand} {item.unit}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Par</div>
            <div className="font-medium">{item.parLevel} {item.unit}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Prep</div>
            <div className="font-bold text-orange-600">{item.prepAmount} {item.unit}</div>
          </div>
          <input
            type="text"
            placeholder="Assign to..."
            value={item.assigned}
            onChange={(e) => updateAssignment(item.id, e.target.value)}
            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );

  const PrepSection = ({ title, items }) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
          {title} ({items.filter(item => item.completed).length}/{items.length} complete)
        </h3>
        {items.map(item => (
          <PrepItem key={item.id} item={item} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prep data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading prep data: {error}</p>
          <button 
            onClick={() => loadPrepData(selectedDate, user?.id, location?.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔥 Moppedos Smart Prep Guide</h1>
              <p className="text-gray-600">Volume-driven prep management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-500">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Lunch Covers</label>
                <input
                  type="number"
                  value={expectedVolume.lunch}
                  onChange={(e) => setExpectedVolume(prev => ({ ...prev, lunch: parseInt(e.target.value) }))}
                  className="w-20 text-center font-bold border border-gray-300 rounded px-3 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">Dinner Covers</label>
                <input
                  type="number"
                  value={expectedVolume.dinner}
                  onChange={(e) => setExpectedVolume(prev => ({ ...prev, dinner: parseInt(e.target.value) }))}
                  className="w-20 text-center font-bold border border-gray-300 rounded px-3 py-1"
                />
              </div>
              <button
                onClick={() => savePrepData(prepData, selectedDate, user?.id, location?.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            {['lunch', 'dinner', 'bulk'].map(station => (
              <button
                key={station}
                onClick={() => setActiveStation(station)}
                className={`px-6 py-3 font-medium capitalize ${
                  activeStation === station 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {station} Prep ({getStationProgress(prepData?.[station] || generatePrepData())}%)
              </button>
            ))}
          </div>
        </div>

        {/* Active Station Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
            {activeStation} Prep - {selectedDate}
          </h2>
          
          {Object.keys(currentStationData).map(category => (
            <PrepSection 
              key={category}
              title={category.charAt(0).toUpperCase() + category.slice(1)}
              items={currentStationData[category]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoppedosSmartPrepGuide;
