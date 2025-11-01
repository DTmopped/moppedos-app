import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export const useSmartPrepLogic = () => {
  const [tenantId, setTenantId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow (since test data is for 10/31/2025)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [prepSchedule, setPrepSchedule] = useState(null);
  const [prepTasks, setPrepTasks] = useState([]);
  const [financialImpact, setFinancialImpact] = useState(null);
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
          .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

        if (scheduleError) {
          console.error('Error fetching schedule:', scheduleError);
          throw scheduleError;
        }

        if (!schedule) {
          console.log('No prep schedule found for this date');
          setPrepSchedule(null);
          setPrepTasks([]);
          setFinancialImpact(null);
          setLoading(false);
          return;
        }

        console.log('Prep schedule found:', schedule);
        setPrepSchedule(schedule);

        // Fetch prep tasks for this schedule with complete menu_items data
        const { data: tasks, error: tasksError } = await supabase
          .from('prep_tasks')
          .select(`
            *,
            menu_items (
              id,
              name,
              category_normalized,
              base_unit,
              portion_size,
              portion_unit,
              cost_per_unit
            ),
            prep_stations (
              id,
              name
            )
          `)
          .eq('schedule_id', schedule.id);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          throw tasksError;
        }

        console.log('Prep tasks found:', tasks);
        setPrepTasks(tasks || []);

        // Fetch financial impact for this schedule
        const { data: financial, error: financialError } = await supabase
          .from('financial_tracking')
          .select('*')
          .eq('schedule_id', schedule.id)
          .maybeSingle();

        if (financialError) {
          console.error('Error fetching financial data:', financialError);
          // Don't throw - financial data is optional
        }

        console.log('Financial data found:', financial);
        setFinancialImpact(financial);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching prep schedule:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPrepSchedule();
  }, [tenantId, selectedDate]);

  const refreshData = () => {
    if (tenantId && selectedDate) {
      // Trigger re-fetch by updating loading state
      setLoading(true);
      // The useEffect will automatically re-run
    }
  };

  return {
    tenantId,
    selectedDate,
    setSelectedDate,
    prepSchedule,
    prepTasks,
    financialImpact,
    loading,
    error,
    refreshData
  };
};
