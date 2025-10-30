import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Financial Data Hook
 * Handles financial tracking data for daily, weekly, and monthly views
 */
export const useFinancialData = (selectedDate, timeRange) => {
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch financial data based on time range
  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      if (timeRange === 'daily') {
        await fetchDailyData(selectedDate);
      } else if (timeRange === 'weekly') {
        await fetchWeeklyData(selectedDate);
      } else if (timeRange === 'monthly') {
        await fetchMonthlyData(selectedDate);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily financial data
  const fetchDailyData = async (date) => {
    const { data, error } = await supabase
      .from('financial_tracking')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching daily data:', error);
      return;
    }

    setDailyData(data);
  };

  // Fetch weekly financial data (7 days)
  const fetchWeeklyData = async (date) => {
    const endDate = new Date(date);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    const { data, error } = await supabase
      .from('financial_tracking')
      .select(`
        date,
        total_prep_cost,
        food_cost_percentage,
        schedule:prep_schedules(expected_guests)
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly data:', error);
      return;
    }

    // Transform data for charts
    const chartData = data.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      prep_cost: d.total_prep_cost,
      target_cost: d.schedule?.expected_guests * 35 * 0.30, // 30% of expected revenue
      food_cost_pct: d.food_cost_percentage,
      guests: d.schedule?.expected_guests || 0
    }));

    setWeeklyData(chartData);
  };

  // Fetch monthly financial data (4-5 weeks)
  const fetchMonthlyData = async (date) => {
    const endDate = new Date(date);
    const startDate = new Date(endDate);
    startDate.setDate(1); // First day of month

    const { data, error } = await supabase
      .from('financial_tracking')
      .select(`
        date,
        total_prep_cost,
        food_cost_percentage,
        schedule:prep_schedules(expected_guests)
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching monthly data:', error);
      return;
    }

    // Group by week
    const weeklyGroups = groupByWeek(data);

    // Transform data for charts
    const chartData = weeklyGroups.map((week, idx) => ({
      week: `Week ${idx + 1}`,
      prep_cost: week.reduce((sum, d) => sum + d.total_prep_cost, 0),
      revenue: week.reduce((sum, d) => sum + (d.schedule?.expected_guests || 0) * 35, 0),
      food_cost_pct: week.reduce((sum, d) => sum + d.food_cost_percentage, 0) / week.length,
      guests: week.reduce((sum, d) => sum + (d.schedule?.expected_guests || 0), 0)
    }));

    setMonthlyData(chartData);
  };

  // Helper: Group data by week
  const groupByWeek = (data) => {
    const weeks = [];
    let currentWeek = [];

    data.forEach((item, idx) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();

      currentWeek.push(item);

      // If it's Saturday or last item, close the week
      if (dayOfWeek === 6 || idx === data.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  };

  // Reload data when dependencies change
  useEffect(() => {
    fetchFinancialData();
  }, [selectedDate, timeRange]);

  return {
    dailyData,
    weeklyData,
    monthlyData,
    loading
  };
};
