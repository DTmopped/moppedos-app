import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Search, Plus, Save, X, Edit2, Trash2, Check, AlertCircle, DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';

/**
 * Enhanced RoleManagement Component with Analytics
 * Manages location-specific role assignments from master catalog (Supabase)
 * 
 * NEW FEATURES:
 * - Role analytics cards (employee count, labor cost, unused roles)
 * - Employee count per role in table
 * - Total cost per role
 * - Highlight unused roles
 * - Green "Add Role" button with bold text
 * - Meal period selection
 */

const RoleManagement = ({ locationId, lightGreenButton = false }) => {
  const { employees, calculateRoleAnalytics } = useLaborData(); // ✅ Get from context
  
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

  // ✅ Calculate analytics
  const analytics = calculateRoleAnalytics ? calculateRoleAnalytics(locationRoles, employees) : null;

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

  const handleAddRole = async (masterRoleId, category, isTipped, mealPeriods) => {
    try {
      setSaving(true);
      setError(null);

      const masterRole = masterRoles.find(r => r.id === masterRoleId);
      
      // Insert only columns that exist in location_roles table
      const { error: insertError } = await supabase
        .from('location_roles')
        .insert({
          location_id: locationId,
          master_role_id: masterRoleId,
          // custom_name is optional - leave null to use master role name
          hourly_rate: 0, // Default to 0, set per employee
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
      {/* Header with GREEN Add Role Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Role Management</h1>
          <p className="text-slate-600">
            Manage roles and rates for this location • {locationRoles.filter(r => r.is_active).length} active roles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
            lightGreenButton
              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold border-2 border-emerald-200'
              : 'bg-emerald-500 hover:bg-emerald-600 text-black font-bold'
          }`}
          title="Add a new role type from your master catalog"
        >
          <Plus className="h-5 w-5" />
          <span>Add Role</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* ✅ Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Roles */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Total Roles</span>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-900">{analytics.totalRoles}</div>
            <div className="text-xs text-blue-600 mt-1">
              {analytics.totalRoles - analytics.unusedRoles} in use
            </div>
          </div>

          {/* Total Employees */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-700">Total Employees</span>
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-900">{analytics.totalEmployees}</div>
            <div className="text-xs text-emerald-600 mt-1">
              Active staff members
            </div>
          </div>

          {/* Average Hourly Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Avg Hourly Rate</span>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-900">
              ${analytics.avgHourlyRate.toFixed(2)}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Across all employees
            </div>
          </div>

          {/* Weekly Labor Cost */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">Weekly Labor Cost</span>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-900">
              ${analytics.totalLaborCost.toLocaleString()}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Estimated (40hrs/week)
            </div>
          </div>
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Show all roles"
            >
              All ({locationRoles.filter(r => r.is_active).length})
            </button>
            {categories.map(cat => {
              const count = locationRoles.filter(r => r.category === cat && r.is_active).length;
              const colorMap = {
                Bar: 'bg-purple-600',
                FOH: 'bg-blue-600',
                BOH: 'bg-emerald-600',
                Management: 'bg-slate-600'
              };
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? `${colorMap[cat]} text-white shadow-md`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={`Filter by ${cat}`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Hourly Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tipped</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRoles.map((role) => (
              <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{role.role_name}</div>
                  <div className="text-sm text-slate-500">{role.master_role_name}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={getCurrentValue(role, 'category')}
                    onChange={(e) => handleFieldChange(role.id, 'category', e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </td>
                {/* ✅ Employee Count */}
                <td className="px-6 py-4">
                  {(() => {
                    const roleStats = analytics?.roleBreakdown?.find(r => r.role_name === role.role_name);
                    const count = roleStats?.employee_count || 0;
                    return (
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          count === 0 
                            ? 'bg-red-100 text-red-700' 
                            : count < 3
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {count} {count === 1 ? 'employee' : 'employees'}
                        </span>
                        {count === 0 && (
                          <span className="text-xs text-red-600" title="No employees assigned to this role">
                            Unused
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-600">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={getCurrentValue(role, 'hourly_rate')}
                      onChange={(e) => handleFieldChange(role.id, 'hourly_rate', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
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
                    className="w-16 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getCurrentValue(role, 'is_active')}
                      onChange={(e) => handleFieldChange(role.id, 'is_active', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-600">Active</span>
                  </label>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleRemoveRole(role.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Remove role from this location"
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

      {/* Enhanced Add Role Modal */}
      {showAddModal && (
        <EnhancedAddRoleModal
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

// Enhanced Add Role Modal Component - Simplified for your schema
const EnhancedAddRoleModal = ({ masterRoles, existingRoles, categories, onAdd, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const existingRoleIds = new Set(existingRoles.map(r => r.master_role_id));
  
  const availableRoles = masterRoles.filter(role => 
    !existingRoleIds.has(role.id) &&
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }
    // Just pass the master role ID - all other info comes from master_roles table
    onAdd(selectedRole.id, null, null, null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Role from Catalog</h2>
            <p className="text-sm text-slate-600 mt-1">Select from {masterRoles.length}+ professional roles</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search - Only show if no role selected */}
          {!selectedRole && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sommelier, chef, bartender, server..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  autoFocus
                />
              </div>

              {/* Role List */}
              <div className="border-2 border-slate-200 rounded-lg max-h-80 overflow-y-auto">
                {availableRoles.slice(0, 20).map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition-colors ${
                      selectedRole?.id === role.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
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
            </>
          )}

          {/* Configuration - Show when role is selected */}
          {selectedRole && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                <div className="font-bold text-emerald-900 text-xl mb-2">{selectedRole.name}</div>
                <p className="text-emerald-700">
                  This role will be added to your location. Role properties (category, tipped status, etc.) 
                  are inherited from the master role definition.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Hourly rates are set per employee, not per role type. 
                  You'll set individual rates when adding employees to this role.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          {selectedRole && (
            <button
              onClick={() => {
                setSelectedRole(null);
                setSearchTerm('');
              }}
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              ← Choose Different Role
            </button>
          )}
          <div className="flex-1"></div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedRole}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                selectedRole
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg hover:shadow-xl'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Add Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
