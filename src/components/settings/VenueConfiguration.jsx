import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * VenueConfiguration Component - FIXED VERSION
 * Handles venue type selection and configuration
 */

const VenueConfiguration = ({ locationId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [restaurantType, setRestaurantType] = useState('');
  const [venueTypes, setVenueTypes] = useState(['restaurant']);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState({});

  useEffect(() => {
    if (locationId) {
      loadConfiguration();
    }
  }, [locationId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading configuration for location:', locationId);

      // Load current settings
      const { data: settings, error: settingsError } = await supabase
        .rpc('get_tenant_location_settings', { p_location_id: locationId });

      if (settingsError) {
        console.error('Settings error:', settingsError);
        throw settingsError;
      }

      console.log('Loaded settings:', settings);

      // Load available templates
      const { data: templates, error: templatesError } = await supabase
        .from('restaurant_templates')
        .select('name, industry_type, venue_types, time_blocks, description')
        .eq('is_active', true)
        .order('name');

      if (templatesError) {
        console.error('Templates error:', templatesError);
        throw templatesError;
      }

      console.log('Loaded templates:', templates);

      setRestaurantType(settings?.restaurant_type || 'fast_casual');
      setVenueTypes(settings?.venue_types || ['restaurant']);
      setTimeBlocks(settings?.time_blocks || {});
      setAvailableTemplates(templates || []);
      
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantTypeChange = (newType) => {
    setRestaurantType(newType);
    setHasChanges(true);

    const template = availableTemplates.find(t => t.industry_type === newType);
    if (template) {
      const templateVenues = template.venue_types || ['restaurant'];
      setVenueTypes(templateVenues);
    }
  };

  const handleVenueToggle = (venueType) => {
    setVenueTypes(prev => {
      if (prev.includes(venueType) && prev.length === 1) {
        return prev; // Can't remove last venue
      }
      
      if (prev.includes(venueType)) {
        return prev.filter(v => v !== venueType);
      } else {
        return [...prev, venueType];
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('tenant_forecast_settings')
        .update({
          restaurant_type: restaurantType,
          venue_types: venueTypes
        })
        .eq('location_id', locationId);

      if (updateError) throw updateError;

      await loadConfiguration();
      setHasChanges(false);
      alert('✅ Venue configuration saved!');
      
    } catch (err) {
      console.error('Error saving:', err);
      setError(err.message);
      alert('❌ Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  // Simple debug render first
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
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800 font-semibold">Error: {error}</p>
          <button 
            onClick={loadConfiguration}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Venue Configuration</h1>
        <p className="text-slate-600">Configure your venue types and operating hours</p>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
        <div className="font-semibold mb-2">Debug Info:</div>
        <div>Location ID: {locationId}</div>
        <div>Restaurant Type: {restaurantType}</div>
        <div>Venue Types: {venueTypes.join(', ')}</div>
        <div>Templates: {availableTemplates.length}</div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4">
          <p className="text-amber-800">⚠️ You have unsaved changes</p>
        </div>
      )}

      {/* Restaurant Type */}
      <div className="bg-white border border-slate-300 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Restaurant Template</h2>
        
        <select
          value={restaurantType}
          onChange={(e) => handleRestaurantTypeChange(e.target.value)}
          className="w-full p-3 border-2 border-slate-300 rounded"
        >
          {availableTemplates.map(template => (
            <option key={template.industry_type} value={template.industry_type}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Venue Types */}
      <div className="bg-white border border-slate-300 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Active Venues</h2>
        
        <div className="space-y-3">
          {/* Restaurant */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-300 rounded">
            <div>
              <div className="font-bold">🍽️ Restaurant</div>
              <div className="text-sm text-slate-600">Primary venue</div>
            </div>
            <div className="text-blue-600 font-semibold">Active</div>
          </div>

          {/* Club */}
          <button
            onClick={() => handleVenueToggle('club')}
            className={`w-full flex items-center justify-between p-4 border-2 rounded ${
              venueTypes.includes('club')
                ? 'bg-purple-50 border-purple-300'
                : 'bg-white border-slate-300 hover:bg-purple-50'
            }`}
          >
            <div className="text-left">
              <div className="font-bold">🎵 Nightclub / Lounge</div>
              <div className="text-sm text-slate-600">Evening entertainment</div>
            </div>
            <div className={venueTypes.includes('club') ? 'text-purple-600' : 'text-slate-400'}>
              {venueTypes.includes('club') ? 'Active' : 'Inactive'}
            </div>
          </button>

          {/* Coffee Shop */}
          <button
            onClick={() => handleVenueToggle('coffee_shop')}
            className={`w-full flex items-center justify-between p-4 border-2 rounded ${
              venueTypes.includes('coffee_shop')
                ? 'bg-amber-50 border-amber-300'
                : 'bg-white border-slate-300 hover:bg-amber-50'
            }`}
          >
            <div className="text-left">
              <div className="font-bold">☕ Coffee Shop</div>
              <div className="text-sm text-slate-600">Morning/afternoon café</div>
            </div>
            <div className={venueTypes.includes('coffee_shop') ? 'text-amber-600' : 'text-slate-400'}>
              {venueTypes.includes('coffee_shop') ? 'Active' : 'Inactive'}
            </div>
          </button>
        </div>
      </div>

      {/* Time Blocks Preview */}
      <div className="bg-white border border-slate-300 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Operating Hours Preview</h2>
        
        {Object.keys(timeBlocks).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(timeBlocks).map(([venueType, blocks]) => (
              <div key={venueType} className="border border-slate-200 rounded p-4">
                <h3 className="font-bold mb-3 capitalize">{venueType.replace('_', ' ')}</h3>
                <div className="space-y-2">
                  {Object.entries(blocks).map(([key, block]) => (
                    <div key={key} className="flex justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <div className="font-semibold">{block.label}</div>
                        <div className="text-sm text-slate-600">{block.start} - {block.end}</div>
                      </div>
                      <div className={`text-sm ${block.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {block.enabled ? 'Active' : 'Disabled'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No time blocks configured</p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={loadConfiguration}
          disabled={saving || !hasChanges}
          className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`px-6 py-2 rounded ${
            hasChanges
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default VenueConfiguration;
