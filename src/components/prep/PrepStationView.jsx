import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, FileText } from 'lucide-react';
import { supabase } from '@/supabaseClient';

const PrepStationView = ({ prepTasks, prepSchedule, onItemRemoved }) => {
  const [removing, setRemoving] = useState(null);
  const [selectedStation, setSelectedStation] = useState('all');
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [editedQuantity, setEditedQuantity] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  // Station color mapping
  const stationColors = {
    'Smoker': { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-200', text: 'text-blue-600' },
    'Hot Sides': { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', border: 'border-orange-200', text: 'text-orange-600' },
    'Cold Prep': { bg: 'bg-green-600', hover: 'hover:bg-green-700', border: 'border-green-200', text: 'text-green-600' },
    'Dessert': { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', border: 'border-purple-200', text: 'text-purple-600' },
    'Other': { bg: 'bg-gray-600', hover: 'hover:bg-gray-700', border: 'border-gray-200', text: 'text-gray-600' }
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

  const startEditingQuantity = (task) => {
    setEditingQuantity(task.id);
    setEditedQuantity(task.prep_quantity?.toString() || '0');
  };

  const cancelEditingQuantity = () => {
    setEditingQuantity(null);
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

      setEditingQuantity(null);
      setEditedQuantity('');
      
      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const startEditingNotes = (task) => {
    setEditingNotes(task.id);
    setEditedNotes(task.notes || '');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setEditedNotes('');
  };

  const saveNotes = async (taskId) => {
    try {
      const { error } = await supabase
        .from('prep_tasks')
        .update({ notes: editedNotes })
        .eq('id', taskId);

      if (error) throw error;

      setEditingNotes(null);
      setEditedNotes('');
      
      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes. Please try again.');
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
                  className="px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Item Details */}
                    <div className="flex-1 space-y-3">
                      {/* Item Name & Category */}
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-gray-900">
                          {task.menu_items?.name || 'Unknown Item'}
                        </h4>
                        {task.menu_items?.category_normalized && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded uppercase">
                            {task.menu_items.category_normalized}
                          </span>
                        )}
                      </div>

                      {/* Quantity Row */}
                      <div className="flex items-center gap-6">
                        {/* Editable Quantity */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 w-20">Quantity:</span>
                          {editingQuantity === task.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={editedQuantity}
                                onChange={(e) => setEditedQuantity(e.target.value)}
                                className="w-24 px-3 py-1 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveQuantity(task.id);
                                  if (e.key === 'Escape') cancelEditingQuantity();
                                }}
                              />
                              <span className="text-sm font-medium text-gray-600">{task.prep_unit || task.menu_items?.base_unit || 'units'}</span>
                              <button
                                onClick={() => saveQuantity(task.id)}
                                className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={cancelEditingQuantity}
                                className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-bold ${colors.text}`}>
                                {task.prep_quantity || 0}
                              </span>
                              <span className="text-base font-medium text-gray-600">{task.prep_unit || task.menu_items?.base_unit || 'units'}</span>
                              <button
                                onClick={() => startEditingQuantity(task)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit quantity"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Par Level if available */}
                        {task.par_level && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Par Level:</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {task.par_level} {task.prep_unit || task.menu_items?.base_unit || 'units'}
                            </span>
                          </div>
                        )}

                        {/* On Hand if available */}
                        {task.on_hand !== null && task.on_hand !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">On Hand:</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {task.on_hand} {task.prep_unit || task.menu_items?.base_unit || 'units'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes Row */}
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                        {editingNotes === task.id ? (
                          <div className="flex-1 flex items-start gap-2">
                            <textarea
                              value={editedNotes}
                              onChange={(e) => setEditedNotes(e.target.value)}
                              placeholder="Add notes or special instructions..."
                              className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') cancelEditingNotes();
                              }}
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => saveNotes(task.id)}
                                className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                title="Save notes"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={cancelEditingNotes}
                                className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => startEditingNotes(task)}
                            className="flex-1 cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors group"
                          >
                            {task.notes ? (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.notes}</p>
                            ) : (
                              <p className="text-sm text-gray-400 italic group-hover:text-gray-600">
                                Click to add notes or special instructions...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Remove Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleRemove(task.id)}
                        disabled={removing === task.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrepStationView;
