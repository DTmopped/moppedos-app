import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export const useSmartPrepLogic = (selectedDate) => {
  const [tenantId, setTenantId] = useState(null);
  const [prepSchedule, setPrepSchedule] = useState(null);
  const [prepTasks, setPrepTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tenant ID for current user
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('No user logged in');
          return;
        }

        const { data: userTenant, error: tenantError } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (tenantError) throw tenantError;
        
        console.log('Fetched tenant_id:', userTenant.tenant_id);
        setTenantId(userTenant.tenant_id);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err.message);
      }
    };

    fetchTenant();
  }, []);

  // Fetch prep schedule when tenant and date are available
  useEffect(() => {
    if (!tenantId || !selectedDate) {
      setLoading(false);
      return;
    }

    const fetchPrepSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching prep schedule for:', { tenantId, selectedDate });

        // Fetch prep schedule for the selected date
        const { data: schedule, error: scheduleError } = await supabase
          .from('prep_schedules')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('date', selectedDate)
          .single();

        if (scheduleError) {
          if (scheduleError.code === 'PGRST116') {
            // No schedule found for this date
            console.log('No prep schedule found for this date');
            setPrepSchedule(null);
            setPrepTasks([]);
            setLoading(false);
            return;
          }
          throw scheduleError;
        }

        console.log('Prep schedule found:', schedule);
        setPrepSchedule(schedule);

        // Fetch prep tasks for this schedule
        const { data: tasks, error: tasksError } = await supabase
          .from('prep_tasks')
          .select(`
            *,
            menu_items (
              id,
              name,
              category_normalized,
              base_unit
            ),
            prep_stations (
              id,
              name
            )
          `)
          .eq('schedule_id', schedule.id);

        if (tasksError) throw tasksError;

        console.log('Prep tasks found:', tasks);
        setPrepTasks(tasks || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching prep schedule:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPrepSchedule();
  }, [tenantId, selectedDate]);

  const refreshSchedule = () => {
    if (tenantId && selectedDate) {
      // Trigger re-fetch by updating a dummy state
      setLoading(true);
    }
  };

  return {
    tenantId,
    prepSchedule,
    prepTasks,
    loading,
    error,
    refreshSchedule
  };
};
