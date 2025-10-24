import React, { useState } from 'react';

const MoppedosSmartPrepGuide = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedVolume, setExpectedVolume] = useState({ lunch: 250, dinner: 300 });
  const [activeStation, setActiveStation] = useState('lunch');

  // Sample prep data
  const [prepData, setPrepData] = useState({
    lunch: {
      proteins: [
        { id: 1, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false },
        { id: 2, item: 'pork ribs', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false },
        { id: 3, item: 'brisket', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false }
      ],
      sides: [
        { id: 6, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false },
        { id: 7, item: 'mac & cheese', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false }
      ]
    },
    dinner: {
      proteins: [
        { id: 17, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false },
        { id: 18, item: 'pork ribs', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false }
      ],
      sides: [
        { id: 22, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false }
      ]
    },
    bulk: {
      proteins: [
        { id: 33, item: 'half chicken (cold smoke)', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false }
      ],
      sides: [
        { id: 38, item: 'collard greens (prep)', onHand: 5, parLevel: 15, prepAmount: 10, assigned: '', completed: false }
      ]
    }
  });

  const toggleItemCompletion = (itemId) => {
    setPrepData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(station => {
        Object.keys(newData[station]).forEach(category => {
          newData[station][category] = newData[station][category].map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
        });
      });
      return newData;
    });
  };

  const updateAssignment = (itemId, assigned) => {
    setPrepData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(station => {
        Object.keys(newData[station]).forEach(category => {
          newData[station][category] = newData[station][category].map(item => 
            item.id === itemId ? { ...item, assigned } : item
          );
        });
      });
      return newData;
    });
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
          <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {item.item}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">On Hand</div>
            <div className="font-medium">{item.onHand}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Par</div>
            <div className="font-medium">{item.parLevel}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Prep</div>
            <div className="font-bold text-orange-600">{item.prepAmount}</div>
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

  const PrepSection = ({ title, items }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title} ({items.filter(item => item.completed).length}/{items.length} complete)
      </h3>
      {items.map(item => (
        <PrepItem key={item.id} item={item} />
      ))}
    </div>
  );

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
                {station} Prep
              </button>
            ))}
          </div>
        </div>

        {/* Active Station Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
            {activeStation} Prep - {selectedDate}
          </h2>
          
          {Object.keys(prepData[activeStation]).map(category => (
            <PrepSection 
              key={category}
              title={category.charAt(0).toUpperCase() + category.slice(1)}
              items={prepData[activeStation][category]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoppedosSmartPrepGuide;
