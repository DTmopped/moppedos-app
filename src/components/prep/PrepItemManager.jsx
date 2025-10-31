import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/supabaseClient';

const PrepItemManager = ({ prepSchedule, prepTasks, onItemsUpdated }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [customQuantity, setCustomQuantity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (showAddModal) {
      fetchMenuItems();
    }
  }, [showAddModal]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', prepSchedule.tenant_id)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem) {
      alert('Please select a menu item');
      return;
    }

    const menuItem = menuItems.find(item => item.id === selectedItem);
    if (!menuItem) return;

    setLoading(true);

    try {
      // Calculate quantity based on expected guests if not custom
      const quantity = customQuantity 
        ? parseFloat(customQuantity)
        : (prepSchedule.expected_guests * menuItem.portion_size);

      // Get station for this menu item
      const { data: stations } = await supabase
        .from('prep_stations')
        .select('id')
        .eq('tenant_id', prepSchedule.tenant_id)
        .eq('name', getStationForCategory(menuItem.category_normalized))
        .single();

      const newTask = {
        schedule_id: prepSchedule.id,
        menu_item_id: menuItem.id,
        station_id: stations?.id,
        quantity: quantity,
        unit: menuItem.base_unit,
        notes: notes || null,
        is_completed: false
      };

      const { error } = await supabase
        .from('prep_tasks')
        .insert([newTask]);

      if (error) throw error;

      // Reset form
      setSelectedItem('');
      setCustomQuantity('');
      setNotes('');
      setShowAddModal(false);

      // Refresh parent data
      if (onItemsUpdated) {
        onItemsUpdated();
      }
    } catch (error) {
      console.error('Error adding prep task:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStationForCategory = (category) => {
    const categoryLower = (category || '').toLowerCase();
    
    if (categoryLower.includes('brisket') || categoryLower.includes('pork') || 
        categoryLower.includes('ribs') || categoryLower.includes('chicken') ||
        categoryLower.includes('protein') || categoryLower.includes('meat')) {
      return 'Smoker';
    }
    
    if (categoryLower.includes('mac') || categoryLower.includes('beans') || 
        categoryLower.includes('greens') || categoryLower.includes('corn') ||
        categoryLower.includes('hot side')) {
      return 'Hot Sides';
    }
    
    if (categoryLower.includes('slaw') || categoryLower.includes('cold')) {
      return 'Cold Prep';
    }
    
    if (categoryLower.includes('dessert') || categoryLower.includes('pudding') || 
        categoryLower.includes('pie') || categoryLower.includes('cake')) {
      return 'Dessert';
    }
    
    return 'Other';
  };

  const selectedMenuItem = menuItems.find(item => item.id === selectedItem);
  const calculatedQuantity = selectedMenuItem && prepSchedule
    ? (prepSchedule.expected_guests * selectedMenuItem.portion_size).toFixed(2)
    : 0;

  return (
    <>
      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
      >
        <Plus size={20} />
        Add Item to Prep List
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Item to Prep List</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Menu Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Menu Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an item...</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category_normalized})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              {selectedMenuItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Portion size:</span> {selectedMenuItem.portion_size} {selectedMenuItem.base_unit} per guest
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Expected guests:</span> {prepSchedule.expected_guests}
                      </p>
                      <p className="text-sm font-bold text-blue-700 mt-2">
                        Calculated quantity: {calculatedQuantity} {selectedMenuItem.base_unit}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Quantity (optional - leave blank to use calculated)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={customQuantity}
                          onChange={(e) => setCustomQuantity(e.target.value)}
                          placeholder={calculatedQuantity}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">{selectedMenuItem.base_unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Adjustments (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any special instructions or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!selectedItem || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Adding...' : 'Add to Prep List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrepItemManager;
