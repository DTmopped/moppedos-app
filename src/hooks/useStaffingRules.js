import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useStaffingRules - Dynamic role configuration from Supabase
 * 
 * Replaces hardcoded laborScheduleConfig.jsx with real-time data from staffing_rules table.
 * This ensures frontend always matches backend configuration.
 */
export const useStaffingRules = (locationId) => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaffingRules = async () => {
      if (!locationId) {
        console.log('⚠️ No location ID provided to useStaffingRules');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📊 Fetching staffing rules for location:', locationId);

        // Fetch staffing rules from Supabase
        const { data, error: fetchError } = await supabase
          .from('staffing_rules')
          .select('*')
          .eq('location_id', locationId)
          .order('department', { ascending: true })
          .order('role', { ascending: true });

        if (fetchError) throw fetchError;

        console.log('✅ Fetched staffing rules:', data?.length || 0, 'roles');

        // Transform staffing_rules into frontend role format
        const transformedRoles = data.map((rule, index) => {
          const shifts = [];

          // Add lunch shift if configured
          if (rule.shift_start_lunch && rule.shift_end_lunch) {
            shifts.push({
              type: 'LUNCH',
              start: formatTime(rule.shift_start_lunch),
              end: formatTime(rule.shift_end_lunch),
              min: rule.min_staff || 0,
              max: rule.max_staff || 10
            });
          }

          // Add dinner shift if configured
          if (rule.shift_start_dinner && rule.shift_end_dinner) {
            shifts.push({
              type: 'DINNER',
              start: formatTime(rule.shift_start_dinner),
              end: formatTime(rule.shift_end_dinner),
              min: rule.min_staff || 0,
              max: rule.max_staff || 10
            });
          }

          return {
  name: rule.role,
  abbreviation: generateAbbreviation(rule.role),
  ratio: rule.covers_per_staff || 30,
  shifts: shifts,
  minCount: rule.min_staff || 0,
  department: rule.department === 'Bar' ? 'FOH' : rule.department, // ← ADD THIS
  hourly_rate: rule.hourly_rate || 15.00,
  colorClass: getColorClass(rule.department, index),
  isFixedStation: rule.is_fixed_station || false
};

        });

        setRoles(transformedRoles);

        // Extract unique departments
        const uniqueDepts = [...new Set(data.map(r => r.department))];
        const deptConfig = uniqueDepts.map(dept => ({
          id: dept,
          label: getDepartmentLabel(dept),
          emoji: getDepartmentEmoji(dept)
        }));
        setDepartments(deptConfig);

        console.log('✅ Transformed roles:', transformedRoles.length);
        console.log('✅ Departments:', deptConfig);

      } catch (err) {
        console.error('❌ Error fetching staffing rules:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffingRules();
  }, [locationId]);

  return { roles, departments, loading, error };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format time from database (HH:MM:SS or HH:MM) to display format (H:MM AM/PM)
 */
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Generate abbreviation from role name
 */
const generateAbbreviation = (roleName) => {
  if (!roleName) return 'XX';
  
  // Special cases
  const specialCases = {
    'Shift Lead': 'SL',
    'Prep Cook': 'PC',
    'Dishwasher (PM)': 'DW',
    'Food Runner': 'FR',
    'Meat Portioner': 'MP',
    'Side Portioner': 'SP',
    'Food Gopher': 'FG',
    'Garde Manger': 'GM'
  };
  
  if (specialCases[roleName]) return specialCases[roleName];
  
  // Generate from first letters of each word
  const words = roleName.split(' ');
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 3);
  }
  
  // Single word - take first 3 letters
  return roleName.slice(0, 3).toUpperCase();
};

/**
 * Get color class based on department and index
 */
const getColorClass = (department, index) => {
  const colorsByDept = {
    'BOH': [
      'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100',
      'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100',
      'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
      'bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-lime-100',
      'bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100',
      'bg-teal-200 text-teal-800 dark:bg-teal-700 dark:text-teal-100',
      'bg-cyan-200 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-100'
    ],
    'FOH': [
      'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
      'bg-indigo-200 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100',
      'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-100',
      'bg-pink-200 text-pink-800 dark:bg-pink-700 dark:text-pink-100',
      'bg-violet-200 text-violet-800 dark:bg-violet-700 dark:text-violet-100'
    ],
    'Bar': [
      'bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-700 dark:text-fuchsia-100'
    ],
    'Management': [
      'bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-100'
    ]
  };
  
  const deptColors = colorsByDept[department] || colorsByDept['FOH'];
  return deptColors[index % deptColors.length];
};

/**
 * Get department label
 */
const getDepartmentLabel = (dept) => {
  // Map Bar to FOH for casual dining
  if (dept === 'Bar') return 'Front of House';
  
  const labels = {
    'FOH': 'Front of House',
    'BOH': 'Back of House',
    'Management': 'Management'
  };
  return labels[dept] || dept;
};


/**
 * Get department emoji
 */
const getDepartmentEmoji = (dept) => {
  const emojis = {
    'FOH': '🍽️',
    'BOH': '👨‍🍳',
    'Bar': '🍸',
    'Management': '👔'
  };
  return emojis[dept] || '📋';
};

// ============================================================================
// HELPER EXPORTS (for components that need them)
// ============================================================================

export const getRolesByDepartment = (roles, department) => {
  if (department === 'ALL') return roles;
  return roles.filter(role => role.department === department);
};

export const getRoleByName = (roles, name) => {
  return roles.find(role => role.name === name);
};
