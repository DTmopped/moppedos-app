import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/supabaseClient';

const PrepItemManager = ({ prepSchedule, prepTasks, onItemsUpdated }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableMenuItems, setAvailableMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [customQuantity, setCustomQuantity] = useState('');

  // Fetch available menu items when modal opens
  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setLoading(true);

    try {
      // Get all menu items for this tenant
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('*, prep_stations(name)')
        .eq('tenant_id', prepSchedule.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Filter out items already in prep list
      const existingItemIds = prepTasks.map(task => task.menu_item_id);
      const available = menuItems.filter(item => !existingItemIds.includes(item.id));

      setAvailableMenuItems(available);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      alert('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Add item to prep list
  const handleAddItem = async () => {
    if (!selectedMenuItem) {
      alert('Please select a menu item');
      return;
    }

    setLoading(true);

    try {
      // Calculate quantity (use custom or default based on expected guests)
      const quantity = customQuantity 
        ? parseFloat(customQuantity)
        : (prepSchedule.expected_guests * (selectedMenuItem.portion_size || 0.25));

      // Insert new prep task
      const { data, error } = await supabase
        .from('prep_tasks')
        .insert({
          schedule_id: prepSchedule.id,
          menu_item_id: selectedMenuItem.id,
          station_id: selectedMenuItem.station_id,
          prep_quantity: quantity,
          prep_unit: selectedMenuItem.base_unit || 'lb',
          smart_factor: 1.0,
          status: 'pending'
        })
        .select('*, menu_items(*), prep_stations(*)');

      if (error) throw error;

      // Notify parent to refresh
      if (onItemsUpdated) {
        onItemsUpdated();
      }

      // Reset and close
      setSelectedMenuItem(null);
      setCustomQuantity('');
      setShowAddModal(false);
      
      alert(`Added ${selectedMenuItem.name} to prep list!`);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item to prep list');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from prep list
  const handleRemoveItem = async (taskId, itemName) => {
    if (!confirm(`Are you sure you want to remove "${itemName}" from the prep list?`)) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('prep_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Notify parent to refresh
      if (onItemsUpdated) {
        onItemsUpdated();
      }

      alert(`Removed ${itemName} from prep list`);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prep-item-manager">
      {/* Add Item Button */}
      <button
        onClick={handleOpenAddModal}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        disabled={loading}
      >
        <Plus size={20} />
        Add Item to Prep List
      </button>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Add Item to Prep List</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {loading && !availableMenuItems.length ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading menu items...</p>
                </div>
              ) : availableMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg">All menu items are already in the prep list!</p>
                </div>
              ) : (
                <>
                  {/* Menu Item Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Menu Item
                    </label>
                    <select
                      value={selectedMenuItem?.id || ''}
                      onChange={(e) => {
                        const item = availableMenuItems.find(i => i.id === e.target.value);
                        setSelectedMenuItem(item);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    >
                      <option value="">-- Choose an item --</option>
                      {availableMenuItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.prep_stations?.name || 'No station'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Quantity (Optional) */}
                  {selectedMenuItem && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quantity (Optional - leave blank for auto-calculation)
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={customQuantity}
                          onChange={(e) => setCustomQuantity(e.target.value)}
                          placeholder={`Auto: ${(prepSchedule.expected_guests * (selectedMenuItem.portion_size || 0.25)).toFixed(1)}`}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                        <span className="flex items-center px-4 bg-gray-100 rounded-lg text-gray-700 font-semibold">
                          {selectedMenuItem.base_unit || 'lb'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Based on {prepSchedule.expected_guests} guests × {selectedMenuItem.portion_size || 0.25} {selectedMenuItem.base_unit || 'lb'} per guest
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {availableMenuItems.length > 0 && (
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!selectedMenuItem || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add to Prep List'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove Item Buttons (rendered in PrepStationView) */}
      <style jsx>{`
        .remove-item-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .remove-item-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
        
        .remove-item-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default PrepItemManager;

// Export the remove function for use in PrepStationView
export const RemoveItemButton = ({ task, onRemove, loading }) => {
  const itemName = task.menu_items?.name || task.menu_item_name || 'this item';
  
  const handleClick = () => {
    if (confirm(`Remove "${itemName}" from prep list?`)) {
      onRemove(task.id, itemName);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="remove-item-btn"
      title={`Remove ${itemName}`}
    >
      <Trash2 size={16} />
      Remove
    </button>
  );
};
