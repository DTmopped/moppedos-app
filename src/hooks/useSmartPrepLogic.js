import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Smart Prep Logic Hook
 * Handles all prep calculation logic, smart multipliers, and schedule generation
 */
export const useSmartPrepLogic = () => {
  const [prepSchedule, setPrepSchedule] = useState(null);
  const [financialImpact, setFinancialImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Fetch or generate prep schedule
  const fetchPrepSchedule = async (date) => {
    try {
      setLoading(true);

      // Check if schedule already exists
      let { data: existingSchedule, error: scheduleError } = await supabase
        .from('prep_schedules')
        .select(`
          *,
          tasks:prep_tasks(
            *,
            menu_item:menu_items(*),
            station:prep_stations(*)
          )
        `)
        .eq('date', date)
        .single();

      if (scheduleError && scheduleError.code !== 'PGRST116') {
        throw scheduleError;
      }

      // If no schedule exists, generate one
      if (!existingSchedule) {
        existingSchedule = await generatePrepSchedule(date);
      }

      // Calculate retherm milestones
      const rethermMilestones = await calculateRethermMilestones(
        existingSchedule.tasks,
        date
      );

      setPrepSchedule({
        ...existingSchedule,
        retherm_milestones: rethermMilestones
      });

      // Calculate financial impact
      const impact = await calculateFinancialImpact(existingSchedule);
      setFinancialImpact(impact);

    } catch (error) {
      console.error('Error fetching prep schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate new prep schedule
  const generatePrepSchedule = async (date) => {
    // Get forecast for the date
    const { data: forecast } = await supabase
      .from('forecasts')
      .select('*')
      .eq('date', date)
      .single();

    if (!forecast) {
      throw new Error('No forecast available for this date');
    }

    // Get smart multipliers for the date
    const adjustmentFactor = await getSmartMultipliers(date);

    // Create schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('prep_schedules')
      .insert({
        date,
        expected_guests: forecast.expected_guests,
        adjustment_factor: adjustmentFactor.combined,
        status: 'draft'
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Generate prep tasks
    const tasks = await generatePrepTasks(
      schedule.id,
      forecast.expected_guests,
      adjustmentFactor
    );

    return {
      ...schedule,
      tasks
    };
  };

  // Generate prep tasks based on menu items and rules
  const generatePrepTasks = async (scheduleId, expectedGuests, adjustmentFactor) => {
    // Get all active menu items with their prep rules
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select(`
        *,
        station:prep_stations(*),
        rules:prep_rules(*),
        recipe:recipes(*)
      `)
      .eq('active', true);

    const tasks = [];

    for (const item of menuItems) {
      const rule = item.rules?.[0]; // Get primary rule
      if (!rule) continue;

      // Calculate prep quantity
      const prepCalc = calculatePrepQuantity(
        item,
        rule,
        expectedGuests,
        adjustmentFactor
      );

      // Get current inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('menu_item_id', item.id)
        .single();

      const onHand = inventory?.quantity || 0;

      // Create task
      const task = {
        schedule_id: scheduleId,
        menu_item_id: item.id,
        station_id: item.station_id,
        menu_item_name: item.name,
        station_name: item.station?.name,
        on_hand: onHand,
        par_level: rule.par_level || prepCalc.quantity,
        prep_quantity: Math.max(0, prepCalc.quantity - onHand),
        unit: item.base_unit,
        estimated_cost: prepCalc.cost,
        estimated_time: item.recipe?.total_prep_time || 0,
        prep_instructions: item.recipe?.prep_instructions || [],
        smart_insights: prepCalc.insights,
        confidence: adjustmentFactor.confidence,
        data_points: adjustmentFactor.data_points,
        popularity: await getItemPopularity(item.id),
        completed: false
      };

      tasks.push(task);
    }

    // Insert tasks into database
    const { data: insertedTasks, error } = await supabase
      .from('prep_tasks')
      .insert(tasks)
      .select();

    if (error) throw error;

    return insertedTasks;
  };

  // Calculate prep quantity based on rules and multipliers
  const calculatePrepQuantity = (item, rule, expectedGuests, adjustmentFactor) => {
    let baseQty = 0;
    let insights = '';

    if (rule.rule_type === 'per_guest') {
      baseQty = rule.base_quantity * expectedGuests;
      insights = `${rule.base_quantity} ${item.base_unit} per guest × ${expectedGuests} guests`;
    } else if (rule.rule_type === 'par_level') {
      baseQty = rule.par_level;
      insights = `Par level: ${rule.par_level} ${item.base_unit}`;
    } else if (rule.rule_type === 'batch') {
      const needed = rule.base_quantity * expectedGuests;
      const batches = Math.ceil(needed / rule.batch_size);
      baseQty = batches * rule.batch_size;
      insights = `${batches} batches of ${rule.batch_size} ${item.base_unit}`;
    }

    // Apply smart multiplier
    const adjustedQty = baseQty * adjustmentFactor.combined;

    // Apply min/max constraints
    const finalQty = Math.min(
      Math.max(adjustedQty, rule.min_quantity || 0),
      rule.max_quantity || Infinity
    );

    // Calculate cost
    const cost = finalQty * item.cost_per_unit;

    // Add multiplier insight
    if (adjustmentFactor.combined !== 1.0) {
      insights += ` × ${adjustmentFactor.combined.toFixed(2)} (smart factor)`;
    }

    return {
      quantity: Math.round(finalQty * 10) / 10, // Round to 1 decimal
      cost,
      insights
    };
  };

  // Get smart multipliers for a date
  const getSmartMultipliers = async (date) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const season = getSeason(dateObj);
    const holiday = await getHoliday(date);

    // Fetch multipliers from database
    const { data: multipliers } = await supabase
      .from('smart_multipliers')
      .select('*')
      .eq('active', true)
      .in('multiplier_type', ['day_of_week', 'seasonal', 'holiday']);

    // Find relevant multipliers
    const dayMultiplier = multipliers?.find(
      m => m.multiplier_type === 'day_of_week' && m.key === dayOfWeek.toString()
    );
    const seasonMultiplier = multipliers?.find(
      m => m.multiplier_type === 'seasonal' && m.key === season
    );
    const holidayMultiplier = holiday ? multipliers?.find(
      m => m.multiplier_type === 'holiday' && m.key === holiday
    ) : null;

    // Combine multipliers
    const dayValue = dayMultiplier?.value || 1.0;
    const seasonValue = seasonMultiplier?.value || 1.0;
    const holidayValue = holidayMultiplier?.value || 1.0;
    const combined = dayValue * seasonValue * holidayValue;

    // Calculate average confidence and data points
    const activeMultipliers = [dayMultiplier, seasonMultiplier, holidayMultiplier].filter(Boolean);
    const avgConfidence = activeMultipliers.length > 0
      ? activeMultipliers.reduce((sum, m) => sum + m.confidence, 0) / activeMultipliers.length
      : 0.5;
    const totalDataPoints = activeMultipliers.reduce((sum, m) => sum + m.data_points, 0);

    return {
      combined,
      confidence: avgConfidence,
      data_points: totalDataPoints,
      breakdown: {
        day_of_week: { value: dayValue, confidence: dayMultiplier?.confidence },
        seasonal: { value: seasonValue, confidence: seasonMultiplier?.confidence },
        holiday: { value: holidayValue, confidence: holidayMultiplier?.confidence }
      }
    };
  };

  // Calculate retherm milestones
  const calculateRethermMilestones = async (tasks, date) => {
    const milestones = [];

    for (const task of tasks) {
      // Skip non-protein items or items that don't need retherming
      if (task.station_name !== 'Proteins' && task.station_name !== 'Sides') {
        continue;
      }

      // Get hourly demand pattern for this item
      const demandPattern = await getHourlyDemandPattern(task.menu_item_id, date);

      // Calculate milestones
      const itemMilestones = calculateServiceMilestones(
        task,
        demandPattern
      );

      milestones.push(...itemMilestones);
    }

    return milestones;
  };

  // Calculate service milestones for an item
  const calculateServiceMilestones = (task, demandPattern) => {
    const milestones = [];
    let cumulative = 0;

    // Identify demand peaks
    const peaks = identifyDemandPeaks(demandPattern);

    for (const peak of peaks) {
      cumulative += peak.quantity;

      milestones.push({
        menu_item_id: task.menu_item_id,
        menu_item_name: task.menu_item_name,
        time: peak.time,
        quantity: peak.quantity,
        cumulative_quantity: cumulative,
        intensity: peak.intensity,
        description: peak.description,
        reasoning: peak.reasoning,
        current_hot_hold: 0, // Updated in real-time
        next_action: `Start retherming ${peak.quantity} lbs for ${peak.time} service`
      });
    }

    return milestones;
  };

  // Identify demand peaks from hourly pattern
  const identifyDemandPeaks = (demandPattern) => {
    const peaks = [];
    const threshold = 0.15; // 15% of total demand

    let currentPeak = null;

    for (const hour of demandPattern) {
      if (hour.percentage >= threshold) {
        if (!currentPeak) {
          currentPeak = {
            time: hour.time,
            quantity: hour.quantity,
            percentage: hour.percentage,
            intensity: hour.percentage > 0.3 ? 'rush' : 'steady'
          };
        } else {
          currentPeak.quantity += hour.quantity;
          currentPeak.percentage = Math.max(currentPeak.percentage, hour.percentage);
          if (hour.percentage > 0.3) currentPeak.intensity = 'rush';
        }
      } else {
        if (currentPeak) {
          peaks.push({
            ...currentPeak,
            description: `${currentPeak.intensity === 'rush' ? 'Peak rush' : 'Steady service'}`,
            reasoning: `${(currentPeak.percentage * 100).toFixed(0)}% of demand occurs during this period`
          });
          currentPeak = null;
        }
      }
    }

    // Add final peak if exists
    if (currentPeak) {
      peaks.push({
        ...currentPeak,
        description: `${currentPeak.intensity === 'rush' ? 'Peak rush' : 'Steady service'}`,
        reasoning: `${(currentPeak.percentage * 100).toFixed(0)}% of demand occurs during this period`
      });
    }

    return peaks;
  };

  // Get hourly demand pattern (mock for now, will use real POS data)
  const getHourlyDemandPattern = async (menuItemId, date) => {
    // TODO: Query actual POS data
    // For now, return a typical dinner service pattern
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    return [
      { time: '5:00 PM', quantity: 2, percentage: 0.1 },
      { time: '6:00 PM', quantity: 4, percentage: 0.2 },
      { time: '7:00 PM', quantity: 6, percentage: 0.3 },
      { time: '8:00 PM', quantity: isWeekend ? 8 : 4, percentage: isWeekend ? 0.4 : 0.2 },
      { time: '9:00 PM', quantity: 2, percentage: 0.1 }
    ];
  };

  // Get item popularity (% of guests who order it)
  const getItemPopularity = async (menuItemId) => {
    // TODO: Calculate from POS data
    // For now, return a default
    return 0.65; // 65% of guests order this item
  };

  // Calculate financial impact
  const calculateFinancialImpact = async (schedule) => {
    const tasks = schedule.tasks || [];

    // Calculate costs by station
    const costByStation = tasks.reduce((acc, task) => {
      const station = task.station_name || 'Misc';
      acc[station] = (acc[station] || 0) + (task.estimated_cost || 0);
      return acc;
    }, {});

    const totalPrepCost = Object.values(costByStation).reduce((sum, cost) => sum + cost, 0);

    // Estimate revenue (average check size * expected guests)
    const avgCheckSize = 35; // TODO: Get from tenant settings
    const expectedRevenue = schedule.expected_guests * avgCheckSize;

    // Calculate food cost percentage
    const foodCostPercentage = (totalPrepCost / expectedRevenue) * 100;

    // Estimate waste and shortage risks
    const potentialWaste = totalPrepCost * 0.05; // 5% waste risk
    const potentialShortage = expectedRevenue * 0.03; // 3% shortage risk

    // Calculate potential savings
    const potentialSavings = schedule.adjustment_factor > 1.1
      ? totalPrepCost * 0.08 // 8% savings if following smart schedule
      : totalPrepCost * 0.05; // 5% baseline savings

    return {
      total_prep_cost: totalPrepCost,
      protein_cost: costByStation['Proteins'] || 0,
      sides_cost: costByStation['Sides'] || 0,
      desserts_cost: costByStation['Desserts'] || 0,
      misc_cost: costByStation['Misc'] || 0,
      expected_revenue: expectedRevenue,
      food_cost_percentage: foodCostPercentage,
      target_food_cost_percentage: 30.0,
      variance: foodCostPercentage - 30.0,
      potential_waste: potentialWaste,
      potential_shortage: potentialShortage,
      potential_savings: potentialSavings,
      cost_variance: totalPrepCost - (expectedRevenue * 0.30) // vs 30% target
    };
  };

  // Helper: Get season
  const getSeason = (date) => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  // Helper: Get holiday
  const getHoliday = async (date) => {
    // TODO: Implement holiday detection
    // Check against a holidays table or API
    return null;
  };

  // Refresh data
  const refreshData = () => {
    fetchPrepSchedule(selectedDate);
  };

  // Load data on mount and when date changes
  useEffect(() => {
    fetchPrepSchedule(selectedDate);
  }, [selectedDate]);

  return {
    prepSchedule,
    financialImpact,
    loading,
    selectedDate,
    setSelectedDate,
    refreshData
  };
};
