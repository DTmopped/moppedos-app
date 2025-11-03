import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export const useSmartPrepLogic = () => {
  const [tenantId, setTenantId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [prepSchedule, setPrepSchedule] = useState(null);
  const [prepTasks, setPrepTasks] = useState([]);
  const [financialImpact, setFinancialImpact] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Fetch forecast data when date changes
  useEffect(() => {
    if (!tenantId || !selectedDate) return;

    const fetchForecast = async () => {
      try {
        const { data: forecast, error: forecastError } = await supabase
          .from('forecast_data')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('date', selectedDate)
          .maybeSingle();

        if (forecastError) {
          console.error('Error fetching forecast:', forecastError);
        }

        console.log('Forecast data found:', forecast);
        setForecastData(forecast);
      } catch (err) {
        console.error('Error fetching forecast:', err);
      }
    };

    fetchForecast();
  }, [tenantId, selectedDate]);

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
          .maybeSingle();

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
  }, [tenantId, selectedDate, refreshTrigger]);

  /**
   * Generate or regenerate prep schedule using database function
   * This replaces the old manual calculation logic
   */
  const generatePrepSchedule = async (expectedGuests) => {
    if (!tenantId || !selectedDate) {
      setError('Missing tenant or date');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      console.log('Generating prep schedule for:', { tenantId, selectedDate, expectedGuests });

      // Step 1: Check if schedule exists, create if not
      let scheduleId = prepSchedule?.id;

      if (!scheduleId) {
        console.log('Creating new prep schedule...');
        
        const { data: newSchedule, error: createError } = await supabase
          .from('prep_schedules')
          .insert({
            tenant_id: tenantId,
            date: selectedDate,
            expected_guests: expectedGuests,
            status: 'draft',
            adjustment_factor: 1.0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating schedule:', createError);
          throw createError;
        }

        console.log('New schedule created:', newSchedule);
        scheduleId = newSchedule.id;
      } else {
        console.log('Updating existing schedule with new guest count...');
        
        // Update expected_guests if provided
        if (expectedGuests !== undefined && expectedGuests !== prepSchedule.expected_guests) {
          const { error: updateError } = await supabase
            .from('prep_schedules')
            .update({ expected_guests: expectedGuests })
            .eq('id', scheduleId);

          if (updateError) {
            console.error('Error updating schedule:', updateError);
            throw updateError;
          }
        }
      }

      // Step 2: Call the database function to calculate prep tasks
      console.log('Calling calculate_smart_prep_schedule function...');
      
      const { data: calculatedTasks, error: rpcError } = await supabase
        .rpc('calculate_smart_prep_schedule', {
          p_schedule_id: scheduleId,
          p_expected_guests: expectedGuests
        });

      if (rpcError) {
        console.error('Error calling calculate_smart_prep_schedule:', rpcError);
        throw rpcError;
      }

      console.log('Prep tasks calculated:', calculatedTasks);

      // Step 3: Refresh the UI to show new tasks
      setRefreshTrigger(prev => prev + 1);

      setGenerating(false);
      return { success: true, scheduleId, tasksCount: calculatedTasks?.length || 0 };

    } catch (err) {
      console.error('Error generating prep schedule:', err);
      setError(err.message);
      setGenerating(false);
      return { success: false, error: err.message };
    }
  };

  /**
   * Refresh data manually
   */
  const refreshData = () => {
    if (tenantId && selectedDate) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  /**
   * Get suggested guest count from forecast data
   */
  const getSuggestedGuestCount = () => {
    if (forecastData) {
      // Use total guests from forecast (am_guests + pm_guests)
      const amGuests = forecastData.am_guests || 0;
      const pmGuests = forecastData.pm_guests || 0;
      return amGuests + pmGuests;
    }
    return prepSchedule?.expected_guests || 200; // Default fallback
  };

  return {
    tenantId,
    selectedDate,
    setSelectedDate,
    prepSchedule,
    prepTasks,
    financialImpact,
    forecastData,
    loading,
    generating,
    error,
    refreshData,
    generatePrepSchedule,
    getSuggestedGuestCount
  };
};

export default useSmartPrepLogic;
