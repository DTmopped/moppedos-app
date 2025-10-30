import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Beef, 
  Salad, 
  Cake,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp
} from 'lucide-react';

const STATION_ICONS = {
  'Proteins': Beef,
  'Sides': Salad,
  'Desserts': Cake,
  'Misc': Package
};

const STATION_COLORS = {
  'Proteins': 'border-red-200 bg-red-50',
  'Sides': 'border-green-200 bg-green-50',
  'Desserts': 'border-pink-200 bg-pink-50',
  'Misc': 'border-gray-200 bg-gray-50'
};

const PrepStationView = ({ schedule, selectedStation, setSelectedStation }) => {
  if (!schedule || !schedule.tasks) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No prep schedule available for this date.</p>
      </div>
    );
  }

  // Group tasks by station
  const tasksByStation = schedule.tasks.reduce((acc, task) => {
    const station = task.station_name || 'Misc';
    if (!acc[station]) acc[station] = [];
    acc[station].push(task);
    return acc;
  }, {});

  const stations = Object.keys(tasksByStation);
  const filteredStations = selectedStation === 'all' 
    ? stations 
    : stations.filter(s => s === selectedStation);

  return (
    <div className="space-y-6">
      {/* Station Filter */}
      <div className="flex items-center gap-2">
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
                  <PrepTaskCard key={task.id} task={task} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const PrepTaskCard = ({ task }) => {
  const needsAttention = task.prep_quantity > task.on_hand * 2;
  const isComplete = task.completed;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg text-gray-900">{task.menu_item_name}</h4>
            {needsAttention && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                High Priority
              </Badge>
            )}
            {isComplete && (
              <Badge variant="success" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            {task.popularity && task.popularity > 0.7 && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Popular Item
              </Badge>
            )}
          </div>

          {/* Prep Details Grid */}
          <div className="grid grid-cols-4 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Prep Inventory</p>
              <p className="text-lg font-semibold text-gray-900">
                {task.on_hand} {task.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Target Par</p>
              <p className="text-lg font-semibold text-gray-900">
                {task.par_level} {task.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Need to Prep</p>
              <p className="text-lg font-semibold text-blue-600">
                {task.prep_quantity} {task.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Prep Cost</p>
              <p className="text-lg font-semibold text-green-600">
                ${task.estimated_cost?.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Smart Insights */}
          {task.smart_insights && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Smart Recommendation</p>
                  <p className="text-blue-700">{task.smart_insights}</p>
                  {task.confidence && (
                    <p className="text-xs text-blue-600 mt-1">
                      📊 {(task.confidence * 100).toFixed(0)}% confidence based on {task.data_points} days of data
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prep Instructions (if Mopped template) */}
          {task.prep_instructions && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Prep Steps:</p>
              <div className="text-sm text-gray-700 space-y-1">
                {task.prep_instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimated_time && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {task.estimated_time} minutes</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="ml-4">
          <Button
            variant={isComplete ? 'outline' : 'default'}
            size="sm"
            className="whitespace-nowrap"
          >
            {isComplete ? 'Edit' : 'Mark Complete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrepStationView;
