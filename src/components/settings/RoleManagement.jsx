import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Search, Plus, Save, X, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';

/**
 * RoleManagement Component
 * Manages location-specific role assignments from master catalog
 */

const RoleManagement = ({ locationId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [locationRoles, setLocationRoles] = useState([]);
  const [masterRoles, setMasterRoles] = useState([]);
  const [changes, setChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const categories = ['Bar', 'FOH', 'BOH', 'Management'];

  useEffect(() => {
    if (locationId) {
      loadData();
    }
  }, [locationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load location's assigned roles
      const { data: roles, error: rolesError } = await supabase
        .from('v_location_roles_ordered')
        .select('*')
        .eq('location_id', locationId)
        .order('category')
        .order('display_order');

      if (rolesError) throw rolesError;

      // Load all master roles for adding
      const { data: master, error: masterError } = await supabase
        .from('master_roles')
        .select('*')
        .order('name');

      if (masterError) throw masterError;

      setLocationRoles(roles || []);
      setMasterRoles(master || []);
      
    } catch (err) {
      console.error('Error loading roles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (roleId, field, value) => {
    setChanges(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update each changed role
      for (const [roleId, updates] of Object.entries(changes)) {
        const role = locationRoles.find(r => r.id === roleId);
        
        const { error: updateError } = await supabase
          .from('location_roles')
          .update({
            hourly_rate: updates.hourly_rate ?? role.hourly_rate,
            is_active: updates.is_active ?? role.is_active,
            display_order: updates.display_order ?? role.display_order,
            category: updates.category ?? role.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', roleId);

        if (updateError) throw updateError;
      }

      // Reload data
      await loadData();
      setChanges({});
      setHasChanges(false);
      alert('✅ Changes saved successfully!');
      
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err.message);
      alert('❌ Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async (masterRoleId, hourlyRate, category) => {
    try {
      setSaving(true);
      setError(null);

      const masterRole = masterRoles.find(r => r.id === masterRoleId);
      
      const { error: insertError } = await supabase
        .from('location_roles')
        .insert({
          location_id: locationId,
          master_role_id: masterRoleId,
          role_name: masterRole.name,
          category: category,
          hourly_rate: hourlyRate,
          is_active: true,
          display_order: 999 // Put at end, user can reorder
        });

      if (insertError) throw insertError;

      await loadData();
      setShowAddModal(false);
      alert('✅ Role added successfully!');
      
    } catch (err) {
      console.error('Error adding role:', err);
      setError(err.message);
      alert('❌ Error adding role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!confirm('Remove this role from your location?')) return;

    try {
      setSaving(true);
      setError(null);

      // Soft delete by setting inactive
      const { error: updateError } = await supabase
        .from('location_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (updateError) throw updateError;

      await loadData();
      alert('✅ Role removed');
      
    } catch (err) {
      console.error('Error removing role:', err);
      setError(err.message);
      alert('❌ Error removing role');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentValue = (role, field) => {
    return changes[role.id]?.[field] ?? role[field];
  };

  const filteredRoles = locationRoles.filter(role => {
    const matchesSearch = role.role_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || role.category === selectedCategory;
    return matchesSearch && matchesCategory && role.is_active;
  });

  if (!locationId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">⚠️ No location ID provided</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Role Management</h1>
          <p className="text-slate-600">
            Manage roles and rates for this location • {locationRoles.filter(r => r.is_active).length} active roles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Role</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Changes Warning */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">You have unsaved changes</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setChanges({});
                setHasChanges(false);
              }}
              className="px-4 py-2 text-amber-700 hover:text-amber-900"
            >
              Discard
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({locationRoles.filter(r => r.is_active).length})
            </button>
            {categories.map(cat => {
              const count = locationRoles.filter(r => r.category === cat && r.is_active).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Hourly Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tipped</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRoles.map((role) => (
              <tr key={role.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{role.role_name}</div>
                  <div className="text-sm text-slate-500">{role.master_role_name}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={getCurrentValue(role, 'category')}
                    onChange={(e) => handleFieldChange(role.id, 'category', e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={getCurrentValue(role, 'hourly_rate')}
                      onChange={(e) => handleFieldChange(role.id, 'hourly_rate', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    role.is_tipped 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {role.is_tipped ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={getCurrentValue(role, 'display_order')}
                    onChange={(e) => handleFieldChange(role.id, 'display_order', parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-slate-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getCurrentValue(role, 'is_active')}
                      onChange={(e) => handleFieldChange(role.id, 'is_active', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-600">Active</span>
                  </label>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleRemoveRole(role.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRoles.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No roles found. Try adjusting your filters or add a new role.
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <AddRoleModal
          masterRoles={masterRoles}
          existingRoles={locationRoles}
          categories={categories}
          onAdd={handleAddRole}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// Add Role Modal Component
const AddRoleModal = ({ masterRoles, existingRoles, categories, onAdd, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [category, setCategory] = useState('FOH');

  const existingRoleIds = new Set(existingRoles.map(r => r.master_role_id));
  
  const availableRoles = masterRoles.filter(role => 
    !existingRoleIds.has(role.id) &&
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedRole || !hourlyRate || !category) {
      alert('Please fill in all fields');
      return;
    }
    onAdd(selectedRole.id, parseFloat(hourlyRate), category);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Add Role from Catalog</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search 140+ roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Role List */}
          <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
            {availableRoles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="font-medium text-slate-900">{role.name}</div>
                <div className="text-sm text-slate-500">Display order: {role.display_order}</div>
              </button>
            ))}
            {availableRoles.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                {searchTerm ? 'No roles found matching your search' : 'All roles have been assigned'}
              </div>
            )}
          </div>

          {/* Configuration */}
          {selectedRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-blue-900">Configure: {selectedRole.name}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hourly Rate
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-600">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="15.00"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || !hourlyRate || !category}
            className={`px-6 py-2 rounded-lg ${
              selectedRole && hourlyRate && category
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Add Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
