import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
        { id: 8, item: 'cole slaw', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 9, item: 'baked beans', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 10, item: 'corn casserole', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      desserts: [
        { id: 11, item: 'banana pudding', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 12, item: 'hummingbird cake', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 13, item: 'key lime pie', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      misc: [
        { id: 14, item: 'buns', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false },
        { id: 15, item: 'texas toast', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false },
        { id: 16, item: 'honey butter', onHand: 10, parLevel: 15, prepAmount: 5, notes: '', assigned: '', completed: false }
      ]
    },
    dinner: {
      proteins: [
        { id: 17, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 18, item: 'pork ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 19, item: 'beef short ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 20, item: 'pork shoulder', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 21, item: 'brisket', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      sides: [
        { id: 22, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 23, item: 'mac & cheese', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 24, item: 'cole slaw', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 25, item: 'baked beans', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 26, item: 'corn casserole', onHand: 5, parLevel: 15, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      desserts: [
        { id: 27, item: 'banana pudding', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 28, item: 'hummingbird cake', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false },
        { id: 29, item: 'key lime pie', onHand: 10, parLevel: 20, prepAmount: 10, notes: '', assigned: '', completed: false }
      ],
      misc: [
        { id: 30, item: 'buns', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false },
        { id: 31, item: 'texas toast', onHand: 25, parLevel: 30, prepAmount: 5, notes: '', assigned: '', completed: false },
        { id: 32, item: 'honey butter', onHand: 10, parLevel: 15, prepAmount: 5, notes: '', assigned: '', completed: false }
      ]
    },
    bulk: {
      proteins: [
        { id: 33, item: 'half chicken', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Cold smoke for tomorrow', assigned: '', completed: false },
        { id: 34, item: 'pork ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Cold smoke for tomorrow', assigned: '', completed: false },
        { id: 35, item: 'beef short ribs', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Cold smoke for tomorrow', assigned: '', completed: false },
        { id: 36, item: 'pork shoulder', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Cold smoke for tomorrow', assigned: '', completed: false },
        { id: 37, item: 'brisket', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Cold smoke for tomorrow', assigned: '', completed: false }
      ],
      sides: [
        { id: 38, item: 'collard greens', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false },
        { id: 39, item: 'mac & cheese', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false },
        { id: 40, item: 'cole slaw', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false },
        { id: 41, item: 'baked beans', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false },
        { id: 42, item: 'corn casserole', onHand: 5, parLevel: 15, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false }
      ],
      desserts: [
        { id: 43, item: 'banana pudding', onHand: 10, parLevel: 20, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false },
        { id: 44, item: 'hummingbird cake', onHand: 10, parLevel: 20, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false },
        { id: 45, item: 'key lime pie', onHand: 10, parLevel: 20, prepAmount: 10, notes: 'Prep for tomorrow', assigned: '', completed: false }
      ],
      misc: [
        { id: 46, item: 'buns', onHand: 25, parLevel: 30, prepAmount: 5, notes: 'Stock for tomorrow', assigned: '', completed: false },
        { id: 47, item: 'texas toast', onHand: 25, parLevel: 30, prepAmount: 5, notes: 'Stock for tomorrow', assigned: '', completed: false },
        { id: 48, item: 'honey butter', onHand: 10, parLevel: 15, prepAmount: 5, notes: 'Stock for tomorrow', assigned: '', completed: false }
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

  const PrepItemRow = ({ item, category }) => {
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
      <div className={`p-3 rounded-lg border ${getStatusColor(item)} transition-all duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItemCompletion(item.id)}
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
              <Input
                placeholder="Assign to..."
                value={item.assigned}
                onChange={(e) => updateAssignment(item.id, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PrepSection = ({ title, items, icon: Icon }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
        <Icon className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge variant="outline" className="ml-auto">
          {items.filter(item => item.completed).length}/{items.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <PrepItemRow key={item.id} item={item} category={title.toLowerCase()} />
        ))}
      </div>
    </div>
  );

  const StationCard = ({ stationKey, title, icon: Icon, isActive, onClick }) => {
    const progress = getStationProgress(prepData[stationKey]);
    
    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isActive ? 'ring-2 ring-blue-500 shadow-md' : ''
        }`}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {progress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
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
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Lunch Covers</div>
                <Input
                  type="number"
                  value={expectedVolume.lunch}
                  onChange={(e) => setExpectedVolume(prev => ({ ...prev, lunch: parseInt(e.target.value) }))}
                  className="w-24 text-center font-bold"
                />
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Dinner Covers</div>
                <Input
                  type="number"
                  value={expectedVolume.dinner}
                  onChange={(e) => setExpectedVolume(prev => ({ ...prev, dinner: parseInt(e.target.value) }))}
                  className="w-24 text-center font-bold"
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
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl capitalize">
                {activeStation} Prep - {selectedDate}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  Expected Volume: {activeStation === 'lunch' ? expectedVolume.lunch : activeStation === 'dinner' ? expectedVolume.dinner : `${expectedVolume.lunch + expectedVolume.dinner}`}
                </Badge>
                <Badge>
                  {getStationProgress(prepData[activeStation])}% Complete
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <PrepSection 
              title="Proteins" 
              items={prepData[activeStation].proteins} 
              icon={ChefHat}
            />
            <Separator />
            <PrepSection 
              title="Sides" 
              items={prepData[activeStation].sides} 
              icon={BarChart3}
            />
            <Separator />
            <PrepSection 
              title="Desserts" 
              items={prepData[activeStation].desserts} 
              icon={Calendar}
            />
            <Separator />
            <PrepSection 
              title="Misc" 
              items={prepData[activeStation].misc} 
              icon={User}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoppedosSmartPrepGuide;
