export async function saveForecastToSupabase({ 
  supabase, 
  locationId,      // Keep for backward compatibility
  locationUuid,    // New multi-tenant UUID parameter
  baseDate, 
  days, 
  captureRate, 
  spendPerGuest, 
  amSplit,         // ✅ ADDED: AM split ratio parameter
  foodCostGoal, 
  bevCostGoal, 
  laborCostGoal 
}) {
  // ✅ Enhanced validation with multi-tenant support
  if (!locationUuid && !locationId) {
    throw new Error('Missing locationUuid (preferred) or locationId');
  }
  
  if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
    throw new Error('Invalid baseDate');
  }

  // ✅ Validate amSplit parameter
  if (typeof amSplit !== 'number' || amSplit <= 0 || amSplit >= 1) {
    throw new Error('Invalid amSplit - must be a number between 0 and 1');
  }

  // ✅ Prefer locationUuid for multi-tenant security
  const useLocationUuid = locationUuid || null;
  const useLocationId = locationId || null;

  console.log('🔄 Saving forecast with:', {
    locationUuid: useLocationUuid,
    locationId: useLocationId,
    baseDate: baseDate.toISOString().split('T')[0],
    daysCount: Object.keys(days).length,
    amSplit: amSplit
  });

  const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  const records = [];
  const dates = [];

  for (const [dayName, pax] of Object.entries(days)) {
    const idx = DAY_ORDER.indexOf(dayName);
    if (idx === -1) continue;
    
    const paxValue = Number(String(pax).replace(/,/g, ''));
    if (!Number.isFinite(paxValue)) continue;

    const d = new Date(baseDate);
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);

    const guests = Math.round(paxValue * captureRate);
    const sales = guests * spendPerGuest;

    // ✅ CALCULATE AM/PM SPLITS
    const amGuests = Math.round(guests * amSplit);
    const pmGuests = guests - amGuests;

    // ✅ Create record with both UUID and ID for compatibility
    const record = {
      date: dateStr,
      forecast_sales: sales,
      food_cost_pct: foodCostGoal,
      bev_cost_pct: bevCostGoal,
      labor_cost_pct: laborCostGoal,
      // Additional forecast fields for enhanced tracking
      forecast_guests: guests,
      forecast_pax: paxValue,
      // ✅ ADDED: AM/PM SPLITS TO DATABASE RECORD
      am_guests: amGuests,
      pm_guests: pmGuests,
    };

    // ✅ Add location identifiers based on what's available
    if (useLocationUuid) {
      record.location_uuid = useLocationUuid;  // Multi-tenant UUID (preferred)
    }
    if (useLocationId) {
      record.location_id = useLocationId;      // Legacy ID (backward compatibility)
    }

    records.push(record);
  }

  if (records.length === 0) {
    throw new Error('No valid records to save');
  }

  console.log('📝 Prepared records:', records.length);
  console.log('🔍 Sample record with AM/PM splits:', records[0]);

  try {
    // ✅ Delete existing records using appropriate identifier
    let deleteQuery = supabase.from('fva_daily_history').delete();
    
    if (useLocationUuid) {
      // Use UUID for multi-tenant security (preferred)
      deleteQuery = deleteQuery.eq('location_uuid', useLocationUuid);
      console.log('🗑️ Deleting existing records by location_uuid:', useLocationUuid);
    } else if (useLocationId) {
      // Fallback to legacy ID
      deleteQuery = deleteQuery.eq('location_id', useLocationId);
      console.log('🗑️ Deleting existing records by location_id:', useLocationId);
    }
    
    const { error: delErr } = await deleteQuery.in('date', dates);
    if (delErr) {
      console.error('❌ Delete error:', delErr);
      throw delErr;
    }

    console.log('✅ Deleted existing records for dates:', dates);

    // ✅ Insert new records
    const { data: insertedData, error: insErr } = await supabase
      .from('fva_daily_history')
      .insert(records)
      .select(); // Return inserted records for confirmation

    if (insErr) {
      console.error('❌ Insert error:', insErr);
      throw insErr;
    }

    console.log('✅ Successfully inserted:', insertedData?.length || records.length, 'records');
    console.log('🎯 AM/PM splits saved successfully!');

    // ✅ Enhanced return data
    return { 
      success: true,
      count: records.length, 
      dates,
      locationUuid: useLocationUuid,
      locationId: useLocationId,
      totalSales: records.reduce((sum, r) => sum + r.forecast_sales, 0),
      totalAmGuests: records.reduce((sum, r) => sum + r.am_guests, 0),
      totalPmGuests: records.reduce((sum, r) => sum + r.pm_guests, 0),
      dateRange: {
        start: dates[0],
        end: dates[dates.length - 1]
      }
    };

  } catch (error) {
    console.error('❌ saveForecastToSupabase error:', error);
    throw error;
  }
}

// ✅ Additional utility function for loading forecasts with multi-tenant support
export async function loadForecastFromSupabase({ 
  supabase, 
  locationId, 
  locationUuid, 
  startDate, 
  endDate 
}) {
  const useLocationUuid = locationUuid || null;
  const useLocationId = locationId || null;

  if (!useLocationUuid && !useLocationId) {
    throw new Error('Missing locationUuid (preferred) or locationId');
  }

  console.log('🔄 Loading forecasts with:', {
    locationUuid: useLocationUuid,
    locationId: useLocationId,
    startDate,
    endDate
  });

  try {
    let query = supabase
      .from('fva_daily_history')
      .select('*')
      .order('date', { ascending: true });

    // ✅ Filter by location using appropriate identifier
    if (useLocationUuid) {
      query = query.eq('location_uuid', useLocationUuid);
    } else if (useLocationId) {
      query = query.eq('location_id', useLocationId);
    }

    // ✅ Add date filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Load error:', error);
      throw error;
    }

    console.log('✅ Loaded forecasts:', data?.length || 0, 'records');

    return {
      success: true,
      data: data || [],
      count: data?.length || 0
    };

  } catch (error) {
    console.error('❌ loadForecastFromSupabase error:', error);
    throw error;
  }
}
