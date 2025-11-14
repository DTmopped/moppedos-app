import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useStaffingRules = (locationId) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId) {
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        console.log('📊 Fetching staffing rules for:', locationId);
        
        const { data, error } = await supabase
          .from('staffing_rules')
          .select('*')
          .eq('location_id', locationId)
          .order('department', { ascending: true });

        if (error) throw error;

        console.log('✅ Fetched staffing rules:', data?.length || 0, 'roles');
        
        // Transform to frontend format
        const transformed = data.map((rule, index) => ({
          name: rule.role,
          abbreviation: rule.role.substring(0, 3).toUpperCase(),
          ratio: rule.covers_per_staff || 30,
          shifts: [{
            type: 'DINNER',
            start: rule.shift_start_dinner || '5:00 PM',
            end: rule.shift_end_dinner || '10:00 PM'
          }],
          minCount: rule.min_staff || 0,
          department: rule.department === 'Bar' ? 'FOH' : rule.department,
          hourly_rate: 15.00,
          colorClass: `bg-${rule.department === 'FOH' ? 'blue' : rule.department === 'BOH' ? 'green' : 'yellow'}-100`,
          isFixedStation: rule.is_fixed_station || false
        }));

        setRoles(transformed);
      } catch (error) {
        console.error('❌ Error fetching staffing rules:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [locationId]);

  return { roles, loading };
};

export const getRolesByDepartment = (roles, department) => {
  if (department === 'ALL') return roles;
  return roles.filter(role => role.department === department);
};
