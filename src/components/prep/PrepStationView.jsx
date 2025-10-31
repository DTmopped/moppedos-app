import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Beef, 
  Salad, 
  Cake,
  Package,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import PrepItemDetailModal from './PrepItemDetailModal';

const STATION_ICONS = {
  'Smoker': Beef,
  'Hot Sides': Package,
  'Cold Prep': Salad,
  'Dessert': Cake,
  'Proteins': Beef,
  'Sides': Salad,
  'Desserts': Cake,
  'Misc': Package
};

const STATION_COLORS = {
  'Smoker': 'border-red-200 bg-red-50',
  'Hot Sides': 'border-orange-200 bg-orange-50',
  'Cold Prep': 'border-green-200 bg-green-50',
  'Dessert': 'border-pink-200 bg-pink-50',
  'Proteins': 'border-red-200 bg-red-50',
  'Sides': 'border-green-200 bg-green-50',
  'Desserts': 'border-pink-200 bg-pink-50',
  'Misc': 'border-gray-200 bg-gray-50'
};

const PrepStationView = ({ prepTasks, selectedStation, setSelectedStation }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  if (!prepTasks || prepTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No prep tasks available for this date.</p>
      </div>
    );
  }

  // Group tasks by station
  const tasksByStation = prepTasks.reduce((acc, task) => {
    const stationName = task.prep_stations?.name || task.station_name || 'Misc';
    if (!acc[stationName]) acc[stationName] = [];
    acc[stationName].push(task);
    return acc;
  }, {});

  const stations = Object.keys(tasksByStation);
  const filteredStations = selectedStation === 'all' 
    ? stations 
    : stations.filter(s => s === selectedStation);

  return (
    <>
      <div className="space-y-6">
        {/* Station Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedStation === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedStation('all')}
            size="sm"
          >
            All Stations
          </Button>
          {stations.map(station => (
            <Button
              key={station}
              variant={selectedStation === station ? 'default' : 'outline'}
              onClick={() => setSelectedStation(station)}
              size="sm"
            >
              {station}
            </Button>
          ))}
        </div>

        {/* Station Cards */}
        {filteredStations.map(stationName => {
          const tasks = tasksByStation[stationName];
          const StationIcon = STATION_ICONS[stationName] || Package;
          const stationColor = STATION_COLORS[stationName] || 'border-gray-200 bg-gray-50';

          return (
            <Card key={stationName} className={`${stationColor} border-2`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StationIcon className="h-6 w-6" />
                    <CardTitle className="text-xl">{stationName}</CardTitle>
                    <Badge variant="secondary">{tasks.length} items</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Station Total</p>
                    <p className="text-xl font-bold">
                      ${tasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0).toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map(task => (
                    <PrepTaskCard 
                      key={task.id} 
                      task={task}
                      onViewDetails={() => handleViewDetails(task)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Modal */}
      <PrepItemDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </>
  );
};

const PrepTaskCard = ({ task, onViewDetails }) => {
  // Extract menu item info
  const menuItemName = task.menu_items?.name || task.menu_item_name || 'Unknown Item';
  const category = task.menu_items?.category_normalized || task.category || '';
  const unit = task.unit || task.menu_items?.base_unit || 'lbs';
  
  // Quantities
  const quantity = task.quantity || task.prep_quantity || 0;
  const cost = task.estimated_cost || 0;
  
  // Smart factor
  const smartFactor = task.smart_factor || 1.0;
  const confidence = task.confidence_level || 0;
  
  const isHighPriority = smartFactor > 1.2;
  const isPopular = category === 'Proteins' || category === 'proteins' || category === 'protein';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg text-gray-900">{menuItemName}</h4>
            {isHighPriority && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                High Demand
              </Badge>
            )}
            {isPopular && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Popular Item
              </Badge>
            )}
          </div>

          {/* Prep Details Grid */}
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Quantity to Prep</p>
              <p className="text-lg font-semibold text-blue-600">
                {quantity} {unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Smart Factor</p>
              <p className="text-lg font-semibold text-purple-600">
                {smartFactor.toFixed(2)}x
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Estimated Cost</p>
              <p className="text-lg font-semibold text-green-600">
                ${cost.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Smart Insights */}
          {confidence > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Smart Calculation</p>
                  <p className="text-blue-700">
                    Quantity adjusted by {smartFactor.toFixed(2)}x based on historical patterns
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    📊 {(confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Category Badge */}
          {category && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="ml-4">
          <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
            onClick={onViewDetails}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrepStationView;
