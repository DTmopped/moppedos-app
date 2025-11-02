import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import PrepItemDetailModal from './PrepItemDetailModal';
import { supabase } from '@/supabaseClient';

const PrepStationView = ({ prepTasks, prepSchedule, onItemRemoved }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [selectedStation, setSelectedStation] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [editedQuantity, setEditedQuantity] = useState('');

  // Station color mapping
  const stationColors = {
    'Smoker': { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-200' },
    'Hot Sides': { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', border: 'border-orange-200' },
    'Cold Prep': { bg: 'bg-green-600', hover: 'hover:bg-green-700', border: 'border-green-200' },
    'Dessert': { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', border: 'border-purple-200' },
    'Other': { bg: 'bg-gray-600', hover: 'hover:bg-gray-700', border: 'border-gray-200' }
  };

  // Group tasks by station
  const groupedTasks = prepTasks?.reduce((acc, task) => {
    const stationName = task.prep_stations?.name || 'Other';
    if (!acc[stationName]) {
      acc[stationName] = [];
    }
    acc[stationName].push(task);
    return acc;
  }, {}) || {};

  const handleRemove = async (taskId) => {
    if (!window.confirm('Are you sure you want to remove this item from the prep list?')) {
      return;
    }

    setRemoving(taskId);
    try {
      const { error } = await supabase
        .from('prep_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error('Error removing prep task:', error);
      alert('Failed to remove item. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditedQuantity(task.prep_quantity?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditedQuantity('');
  };

  const saveQuantity = async (taskId) => {
    const newQuantity = parseFloat(editedQuantity);
    
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    try {
      const { error } = await supabase
        .from('prep_tasks')
        .update({ prep_quantity: newQuantity })
        .eq('id', taskId);

      if (error) throw error;

      setEditingTask(null);
      setEditedQuantity('');
      
      if (onItemRemoved) {
        onItemRemoved(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  // Filter tasks by selected station
  const filteredGroupedTasks = selectedStation === 'all' 
    ? groupedTasks 
    : { [selectedStation]: groupedTasks[selectedStation] || [] };

  const stations = ['all', ...Object.keys(groupedTasks).sort()];

  if (!prepTasks || prepTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No prep tasks scheduled for this date</p>
        <p className="text-gray-400 mt-2">Add items to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Station Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {stations.map((station) => (
          <button
            key={station}
            onClick={() => setSelectedStation(station)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedStation === station
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {station === 'all' ? 'All Stations' : station}
          </button>
        ))}
      </div>

      {/* Prep Tasks by Station */}
      {Object.entries(filteredGroupedTasks).map(([stationName, tasks]) => {
        if (!tasks || tasks.length === 0) return null;

        const colors = stationColors[stationName] || stationColors['Other'];

        return (
          <div key={stationName} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {/* Color-coded Station Header */}
            <div className={`${colors.bg} px-6 py-4 flex items-center justify-between`}>
              <h3 className="text-xl font-bold text-white">{stationName}</h3>
              <span className="text-white font-semibold">{tasks.length} items</span>
            </div>

            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900">
                          {task.menu_items?.name || 'Unknown Item'}
                        </h4>
                        {task.menu_items?.category_normalized && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {task.menu_items.category_normalized}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-4">
                        {/* Editable Quantity */}
                        <div className="flex items-center gap-2">
                          {editingTask === task.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editedQuantity}
                                onChange={(e) => setEditedQuantity(e.target.value)}
                                className="w-24 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveQuantity(task.id);
                                  if (e.key === 'Escape') cancelEditing();
                                }}
                              />
                              <span className="text-sm text-gray-600">{task.prep_unit || task.menu_items?.base_unit}</span>
                              <button
                                onClick={() => saveQuantity(task.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-blue-600">
                                {task.prep_quantity}
                              </span>
                              <span className="text-sm text-gray-600">{task.prep_unit || task.menu_items?.base_unit}</span>
                              <button
                                onClick={() => startEditing(task)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit quantity"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {task.notes && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {task.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleRemove(task.id)}
                        disabled={removing === task.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

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
