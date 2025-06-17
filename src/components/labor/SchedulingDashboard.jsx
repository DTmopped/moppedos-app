import React, { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { fetchForecastData, calculateOptimalStaffing } from '@/lib/laborScheduleUtils.js';
import { SPEND_PER_GUEST } from '@/config/laborScheduleConfig.jsx';
import { Loader2, AlertTriangle, CheckCircle, CalendarDays, Users, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import WeeklyCalendarGrid from './WeeklyCalendarGrid';

const CustomMetricCard = ({ title, value, icon, unit, trend, isLoading, cardClassName, valueClassName, titleClassName }) => (
  <Card className={cn("bg-slate-800/70 border-slate-700 shadow-lg", cardClassName)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className={cn("text-sm font-medium text-slate-300", titleClassName)}>{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      ) : (
        <>
          <div className={cn("text-2xl font-bold text-slate-100 tabular-nums", valueClassName)}>
            {value}
            {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
          </div>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const SchedulingDashboard = ({ initialWeekStartDate = new Date() }) => {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(initialWeekStartDate, { weekStartsOn: 1 }));
  const [scheduleData, setScheduleData] = useState(null);
  const [forecastDataState, setForecastDataState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStartDate, i), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setMetrics(null);
      const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(weekStartDate, 6), 'yyyy-MM-dd');

      const fetchedForecast = await fetchForecastData(weekStartStr, weekEndStr);
      setForecastDataState(fetchedForecast);

      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('id, status')
        .eq('week_start_date', weekStartStr)
        .limit(1);

      if (scheduleError) {
        console.error("Error fetching schedule:", scheduleError);
        setIsLoading(false);
        return;
      }

      let organizedShifts = {};
      weekDates.forEach(date => { organizedShifts[date] = []; });

      if (schedules && schedules.length > 0) {
        const scheduleId = schedules[0].id;
        const { data: shifts, error: shiftsError } = await supabase
          .from('shifts')
          .select('*, employees(id, name, role, wage_rate)')
          .eq('schedule_id', scheduleId);

        if (shiftsError) {
          console.error("Error fetching shifts:", shiftsError);
        } else if (shifts) {
          shifts.forEach(shift => {
            if (organizedShifts[shift.day]) {
              organizedShifts[shift.day].push(shift);
            }
          });
        }
      }
      setScheduleData(organizedShifts);

      if (fetchedForecast && organizedShifts) {
        calculateAllMetrics(organizedShifts, fetchedForecast);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [weekStartDate]);

  const calculateAllMetrics = (schedule, forecast) => {
    const newMetrics = {
      totalProjectedGuests: 0,
      totalProjectedSales: 0,
      totalLaborHours: 0,
      totalLaborCost: 0,
      daysOverTarget: 0,
      dailyMetrics: {}
    };
    const avgRate = 15;

    weekDates.forEach(date => {
      const shifts = schedule[date] || [];
      const forecastEntry = forecast.find(f => f.date === date);

      let guests = 0, sales = 0, hours = 0, cost = 0;

      if (forecastEntry) {
        guests = forecastEntry.projectedGuests || 0;
        sales = guests * SPEND_PER_GUEST;
        newMetrics.totalProjectedGuests += guests;
        newMetrics.totalProjectedSales += sales;

        shifts.forEach(shift => {
          if (
            typeof shift.start_time === 'string' &&
            typeof shift.end_time === 'string' &&
            shift.start_time.includes(':') &&
            shift.end_time.includes(':')
          ) {
            try {
              const [sh, sm] = shift.start_time.split(':');
              const [eh, em] = shift.end_time.split(':');

              const s = new Date(0);
              const e = new Date(0);
              s.setUTCHours(+sh, +sm, 0);
              e.setUTCHours(+eh, +em, 0);

              if (e < s) e.setDate(e.getDate() + 1);

              const d = (e - s) / 3600000;
              if (d > 0) {
                hours += d;
                cost += d * (shift.employees?.wage_rate || avgRate);
              }
            } catch (err) {
              console.error("Time parse error:", shift, err);
            }
          } else {
            console.warn("Skipping shift with invalid time:", shift);
          }
        });

        newMetrics.totalLaborHours += hours;
        newMetrics.totalLaborCost += cost;

        const percent = sales > 0 ? (cost / sales) * 100 : 0;
        const over = percent > 18;
        if (over) newMetrics.daysOverTarget++;

        newMetrics.dailyMetrics[date] = {
          projectedGuests: guests,
          projectedSales: sales,
          laborHours: hours,
          laborCost: cost,
          laborPercentage: percent,
          isOverTarget: over
        };
      }
    });

    newMetrics.averageLaborPercentage = newMetrics.totalProjectedSales > 0
      ? (newMetrics.totalLaborCost / newMetrics.totalProjectedSales) * 100
      : 0;

    setMetrics(newMetrics);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">Editable Weekly Labor Schedule</h2>
      <WeeklyCalendarGrid
        weekStartDate={weekStartDate}
        scheduleData={scheduleData}
        onScheduleChange={setScheduleData}
      />
    </div>
  );
};

export default SchedulingDashboard;
