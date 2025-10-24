import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  BarChart3
} from 'lucide-react';

const MoppedosSmartPrepGuide = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedVolume, setExpectedVolume] = useState({ lunch: 250, dinner: 300 });
  const [activeStation, setActiveStation] = useState('lunch');

  // Sample prep data structure based on the Excel layout
  const [prepData, setPrepData] = useState({
    lunch: {
      proteins: [
        { id: 1, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 2, item: 'pork ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 3, item: 'beef short ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 4, item: 'pork shoulder', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 5, item: 'brisket', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      sides: [
        { id: 6, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 7, item: 'mac & cheese', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 8, item: 'cole slaw', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      desserts: [
        { id: 11, item: 'banana pudding', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 12, item: 'hummingbird cake', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      misc: [
        { id: 14, item: 'buns', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false },
        { id: 15, item: 'texas toast', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false }
      ]
    },
    dinner: {
      proteins: [
        { id: 17, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 18, item: 'pork ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      sides: [
        { id: 22, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 23, item: 'mac & cheese', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      desserts: [
        { id: 27, item: 'banana pudding', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      misc: [
        { id: 30, item: 'buns', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false }
      ]
    },
    bulk: {
      proteins: [
        { id: 33, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Cold smoke for tomorrow', assigned: '', completed: false }
      ],
      sides: [
        { id: 38, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false }
      ],
      desserts: [
        { id: 43, item: 'banana pudding', onHand: 10, parLevel: 20, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false }
      ],
      misc: [
        { id: 46, item: 'buns', onHand: 25, parLevel: 30, prepAmount: 5, notes: 'Stock for tomorrow', assigned: '', completed: false }
      ]
    }
  });

  // Calculate completion percentages
  const getStationProgress = (stationData) => {
    const allItems = [...stationData.proteins, ...stationData.sides, ...stationData.desserts, ...stationData.misc];
    const completed = allItems.filter(item => item.completed).length;
    return Math.round((completed / allItems.length) * 100);
  };

  // Handle item completion toggle
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

  // Handle assignment changes
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

  const PrepItemRow = ({ item }) => {
    const getStatusColor = (item) => {
      if (item.completed) return 'bg-green-100 border-green-300';
      if (item.prepAmount > 0) return 'bg-yellow-50 border-yellow-300';
      return 'bg-white border-gray-200';
    };

    const getStatusIcon = (item) => {
      if (item.completed) return <CheckCircle className="h-4 w-4 text-green-600" />;
      if (item.prepAmount > 0) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      return null;
    };

    return (
      <div className={`p-3 rounded-lg border ${getStatusColor(item)} transition-all duration-200 mb-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItemCompletion(item.id)}
              className="h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 capitalize">{item.item}</span>
                {getStatusIcon(item)}
              </div>
              {item.notes && (
                <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">On Hand</div>
              <div className="font-medium">{item.onHand}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Par Level</div>
              <div className="font-medium">{item.parLevel}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Prep Amount</div>
              <div className={`font-bold ${item.prepAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {item.prepAmount}
              </div>
            </div>
            <div className="min-w-[120px]">
              <input
                type="text"
                placeholder="Assign to..."
                value={item.assigned}
                onChange={(e) => updateAssignment(item.id, e.target.value)}
                className="h-8 text-xs border border-gray-300 rounded px-2 w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PrepSection = ({ title, items, icon: Icon }) => (
    <div className="space-y-3 mb-6">
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
        <Icon className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {items.filter(item => item.completed).length}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <PrepItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );

  const StationCard = ({ stationKey, title, icon: Icon, isActive, onClick }) => {
    const progress = getStationProgress(prepData[stationKey]);
    
    return (
      <div 
        className={`p-4 bg-white rounded-lg shadow cursor-pointer transition-all duration-200 hover:shadow-md ${
          isActive ? 'ring-2 ring-blue-500 shadow-md' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <span className={`text-sm px-2 py-1 rounded ${progress === 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Prep Guide</h1>
                <p className="text-gray-600">Moppedos BBQ - Volume-driven prep management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Date</div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40 border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Lunch Covers</div>
                <input
                  type="number"
                  value={expectedVolume.lunch}
                  onChange={(e) => setExpectedVolume(prev => ({ ...prev, lunch: parseInt(e.target.value) }))}
                  className="w-24 text-center font-bold border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Dinner Covers</div>
                <input
                  type="number"
                  value={expectedVolume.dinner}
                  onChange={(e) => setExpectedVolume(prev => ({ ...prev, dinner: parseInt(e.target.value) }))}
                  className="w-24 text-center font-bold border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Station Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StationCard
            stationKey="lunch"
            title="Lunch Prep"
            icon={Clock}
            isActive={activeStation === 'lunch'}
            onClick={() => setActiveStation('lunch')}
          />
          <StationCard
            stationKey="dinner"
            title="Dinner Prep"
            icon={Users}
            isActive={activeStation === 'dinner'}
            onClick={() => setActiveStation('dinner')}
          />
          <StationCard
            stationKey="bulk"
            title="Bulk Prep"
            icon={TrendingUp}
            isActive={activeStation === 'bulk'}
            onClick={() => setActiveStation('bulk')}
          />
        </div>

        {/* Active Station Details */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold capitalize">
                {activeStation} Prep - {selectedDate}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Expected Volume: {activeStation === 'lunch' ? expectedVolume.lunch : activeStation === 'dinner' ? expectedVolume.dinner : `${expectedVolume.lunch + expectedVolume.dinner}`}
                </span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {getStationProgress(prepData[activeStation])}% Complete
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <PrepSection 
              title="Proteins" 
              items={prepData[activeStation].proteins} 
              icon={ChefHat}
            />
            <PrepSection 
              title="Sides" 
              items={prepData[activeStation].sides} 
              icon={BarChart3}
            />
            <PrepSection 
              title="Desserts" 
              items={prepData[activeStation].desserts} 
              icon={Calendar}
            />
            <PrepSection 
              title="Misc" 
              items={prepData[activeStation].misc} 
              icon={User}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoppedosSmartPrepGuide;
