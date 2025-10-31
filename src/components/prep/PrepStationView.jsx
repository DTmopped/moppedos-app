import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PrepItemDetailModal from './PrepItemDetailModal';
import { supabase } from '@/supabaseClient';

const PrepStationView = ({ prepTasks, prepSchedule, onItemRemoved }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [removing, setRemoving] = useState(null);

  if (!prepTasks || prepTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No prep schedule available for this date</p>
      </div>
    );
  }

  // Group tasks by station
  const tasksByStation = prepTasks.reduce((acc, task) => {
    const stationName = task.prep_stations?.name || task.station_name || 'Unknown Station';
    if (!acc[stationName]) {
      acc[stationName] = [];
    }
    acc[stationName].push(task);
    return acc;
  }, {});

  // Station colors
  const stationColors = {
    'Smoker': 'bg-red-50 border-red-200',
    'Hot Sides': 'bg-orange-50 border-orange-200',
    'Cold Prep': 'bg-green-50 border-green-200',
    'Dessert': 'bg-pink-50 border-pink-200',
  };

  // Handle remove item
  const handleRemoveItem = async (taskId, itemName) => {
    if (!confirm(`Are you sure you want to remove "${itemName}" from the prep list?`)) {
      return;
    }

    setRemoving(taskId);

    try {
      const { error } = await supabase
        .from('prep_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Notify parent to refresh
      if (onItemRemoved) {
        onItemRemoved();
      }

      alert(`Removed ${itemName} from prep list`);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  // Calculate station total cost
  const getStationTotal = (tasks) => {
    return tasks.reduce((sum, task) => sum + (task.estimated_cost || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Station Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold">
          All Stations
        </button>
        {Object.keys(tasksByStation).map(station => (
          <button
            key={station}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-400 transition-colors font-semibold"
          >
            {station}
          </button>
        ))}
      </div>

      {/* Stations */}
      {Object.entries(tasksByStation).map(([stationName, tasks]) => (
        <div
          key={stationName}
          className={`border-2 rounded-lg overflow-hidden ${stationColors[stationName] || 'bg-gray-50 border-gray-200'}`}
        >
          {/* Station Header */}
          <div className="flex items-center justify-between p-4 bg-white bg-opacity-50 border-b-2 border-inherit">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {stationName === 'Smoker' && '🔥'}
                {stationName === 'Hot Sides' && '🍲'}
                {stationName === 'Cold Prep' && '🥗'}
                {stationName === 'Dessert' && '🍰'}
              </span>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{stationName}</h3>
                <p className="text-sm text-gray-600">{tasks.length} items</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Station Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${getStationTotal(tasks).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Station Items */}
          <div className="p-4 space-y-3">
            {tasks.map(task => {
              const itemName = task.menu_items?.name || task.menu_item_name || 'Unknown Item';
              const category = task.menu_items?.category_normalized || task.category || '';
              const quantity = task.prep_quantity || task.quantity || task.adjusted_quantity || 0;
              const unit = task.prep_unit || task.unit || task.menu_items?.base_unit || 'lbs';
              const smartFactor = (task.smart_factor || task.multiplier || 1.0).toFixed(2);
              const estimatedCost = task.estimated_cost || 0;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{itemName}</h4>
                        {task.is_popular && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
                            🔥 Popular Item
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">Quantity to Prep</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {quantity} {unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">Smart Factor</p>
                          <p className="text-2xl font-bold text-purple-600 mt-1">{smartFactor}x</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">Estimated Cost</p>
                          <p className="text-2xl font-bold text-green-600 mt-1">
                            ${estimatedCost.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded">
                          {category}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm whitespace-nowrap"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleRemoveItem(task.id, itemName)}
                        disabled={removing === task.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap flex items-center gap-2 justify-center disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        {removing === task.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Detail Modal */}
      {selectedTask && (
        <PrepItemDetailModal
          task={selectedTask}
          prepSchedule={prepSchedule}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default PrepStationView;
