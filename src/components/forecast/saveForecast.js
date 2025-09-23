export async function saveForecastToSupabase({ 
  supabase, 
  locationId, 
  baseDate, 
  days, 
  captureRate, 
  spendPerGuest, 
  foodCostGoal, 
  bevCostGoal, 
  laborCostGoal 
}) {
  if (!locationId) throw new Error('Missing locationId');
  if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) throw new Error('Invalid baseDate');

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

    records.push({
      location_id: locationId,
      date: dateStr,
      forecast_sales: sales,
      food_cost_pct: foodCostGoal,
      bev_cost_pct: bevCostGoal,
      labor_cost_pct: laborCostGoal,
    });
  }

  if (records.length === 0) throw new Error('No valid records to save');

  // Delete existing records for these dates
  const { error: delErr } = await supabase
    .from('fva_daily_history')
    .delete()
    .eq('location_id', locationId)
    .in('date', dates);
  if (delErr) throw delErr;

  // Insert new records
  const { error: insErr } = await supabase
    .from('fva_daily_history')
    .insert(records);
  if (insErr) throw insErr;

  return { count: records.length, dates };
}
