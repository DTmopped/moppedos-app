import React, { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { format, parseISO, addDays, startOfWeek, isValid } from 'date-fns';
import { fetchForecastData, calculateOptimalStaffing } from '@/lib/laborScheduleUtils.js';
import { SPEND_PER_GUEST } from '@/config/laborScheduleConfig.jsx';
import { Loader2, AlertTriangle, CheckCircle, CalendarDays, Users, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import WeeklyCalendarGrid from './WeeklyCalendarGrid';

const SchedulingDashboard = ({ initialWeekStartDate = new Date() }) => {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(initialWeekStartDate, { weekStartsOn: 1 }));
  const [scheduleData, setScheduleData] = useState(null);
  const [forecastDataState, setForecastDataState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return isValid(date) ? format(date, 'yyyy-MM-dd') : 'Invalid Date';
  });

  const parseTimeStringToDate = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const date = new Date(0);
    date.setUTCHours(+parts[0], +parts[1], +(parts[2] || 0));
    return isNaN(date.getTime()) ? null : date;
  };

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

  const calculateAllMetrics = (currentScheduleData, currentForecastData) => {
    if (!currentScheduleData || !currentForecastData) {
      setMetrics(null);
      return;
    }

    const newMetrics = {
      totalProjectedGuests: 0,
      totalProjectedSales: 0,
      totalLaborHours: 0,
      totalLaborCost: 0,
      daysOverTarget: 0,
      dailyMetrics: {}
    };
    const averageHourlyRate = 15;

    weekDates.forEach(date => {
      const shifts = currentScheduleData[date] || [];
      const forecast = currentForecastData.find(f => f.date === date);

      let dailyProjectedGuests = 0;
      let dailyProjectedSales = 0;
      let dailyLaborHours = 0;
      let dailyLaborCost = 0;
      let dailyLaborPercentage = 0;
      let dailyIsOverTarget = false;

      if (forecast) {
        dailyProjectedGuests = forecast.projectedGuests || 0;
        dailyProjectedSales = dailyProjectedGuests * SPEND_PER_GUEST;

        newMetrics.totalProjectedGuests += dailyProjectedGuests;
        newMetrics.totalProjectedSales += dailyProjectedSales;

        shifts.forEach(shift => {
          const start = parseTimeStringToDate(shift.start_time);
          const end = parseTimeStringToDate(shift.end_time);

          if (shift.employee_id && start && end) {
            if (end < start) end.setUTCDate(end.getUTCDate() + 1);
            const durationMs = end - start;
            const durationHours = durationMs / (1000 * 60 * 60);
            if (durationHours > 0) {
              dailyLaborHours += durationHours;
              const employeeWage = shift.employees?.wage_rate || averageHourlyRate;
              dailyLaborCost += durationHours * employeeWage;
            }
          }
        });

        newMetrics.totalLaborHours += dailyLaborHours;
        newMetrics.totalLaborCost += dailyLaborCost;

        dailyLaborPercentage = dailyProjectedSales > 0
          ? (dailyLaborCost / dailyProjectedSales) * 100
          : 0;

        const targetPercentage = 18;
        dailyIsOverTarget = dailyLaborPercentage > targetPercentage;
        if (dailyIsOverTarget) newMetrics.daysOverTarget++;
      }

      newMetrics.dailyMetrics[date] = {
        projectedGuests: dailyProjectedGuests,
        projectedSales: dailyProjectedSales,
        laborHours: dailyLaborHours,
        laborCost: dailyLaborCost,
        laborPercentage: dailyLaborPercentage,
        isOverTarget: dailyIsOverTarget
      };
    });

    newMetrics.averageLaborPercentage = newMetrics.totalProjectedSales > 0
      ? (newMetrics.totalLaborCost / newMetrics.totalProjectedSales) * 100
      : 0;

    setMetrics(newMetrics);
  };

  const changeWeek = (direction) => {
    setWeekStartDate(prev => addDays(prev, direction * 7));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 p-4 md:p-6 bg-slate-900 rounded-lg shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400 mr-3" />
        <p className="text-lg text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-900 rounded-lg shadow-xl">
      <Card className="glassmorphic-card bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <CardTitle className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Weekly Scheduling Dashboard
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={() => changeWeek(-1)} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-purple-300">Prev Week</Button>
              <span className="text-md font-semibold text-slate-300 whitespace-nowrap">
                {format(weekStartDate, 'MMM dd, yyyy')}
              </span>
              <Button onClick={() => changeWeek(1)} variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-pink-300">Next Week</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {scheduleData && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">
                Weekly Calendar View
              </h3>
              <WeeklyCalendarGrid
                weekStartDate={weekStartDate}
                scheduleData={scheduleData}
                onScheduleChange={setScheduleData}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingDashboard;
