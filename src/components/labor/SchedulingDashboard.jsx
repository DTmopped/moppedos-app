import React, { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { fetchForecastData, calculateOptimalStaffing } from '@/lib/laborScheduleUtils.js';
import { SPEND_PER_GUEST } from '@/config/laborScheduleConfig.jsx';
import { Loader2, AlertTriangle, CheckCircle, CalendarDays, TrendingUp, Users, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils;

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

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStartDate, i), 'yyyy-MM-dd')
  );

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
          if (shift.employee_id && shift.start_time && shift.end_time) {
            try {
                const startTimeParts = shift.start_time.split(':');
                const endTimeParts = shift.end_time.split(':');

                const startDateObj = new Date(0);
                startDateObj.setUTCHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), parseInt(startTimeParts[2] || '0', 10));
                
                const endDateObj = new Date(0);
                endDateObj.setUTCHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), parseInt(endTimeParts[2] || '0', 10));

                if (endDateObj < startDateObj) { 
                    endDateObj.setDate(endDateObj.getDate() + 1);
                }
                
                const durationMs = endDateObj.getTime() - startDateObj.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);

                if (durationHours > 0) {
                    dailyLaborHours += durationHours;
                    const employeeWage = shift.employees?.wage_rate || averageHourlyRate;
                    dailyLaborCost += durationHours * employeeWage;
                }
            } catch(e) {
                console.error("Error parsing shift times in dashboard:", shift.start_time, shift.end_time, e);
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
        if (dailyIsOverTarget) {
          newMetrics.daysOverTarget += 1;
        }
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
          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CustomMetricCard
                title="Projected Guests"
                value={metrics.totalProjectedGuests.toLocaleString()}
                icon={<Users className="h-5 w-5 text-purple-400" />}
                isLoading={false}
                cardClassName="bg-slate-800/70"
              />
              <CustomMetricCard
                title="Projected Sales"
                value={`${metrics.totalProjectedSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                icon={<DollarSign className="h-5 w-5 text-green-400" />}
                isLoading={false}
                cardClassName="bg-slate-800/70"
              />
              <CustomMetricCard
                title="Labor Hours"
                value={metrics.totalLaborHours.toFixed(1)}
                unit="hrs"
                icon={<CalendarDays className="h-5 w-5 text-sky-400" />}
                isLoading={false}
                cardClassName="bg-slate-800/70"
              />
              <CustomMetricCard
                title="Labor %"
                value={`${metrics.averageLaborPercentage.toFixed(1)}%`}
                icon={<Percent className={cn("h-5 w-5", metrics.averageLaborPercentage > 18 ? "text-red-400" : "text-green-400")} />}
                trend={`Target: 18.0% (${metrics.daysOverTarget} day(s) over)`}
                isLoading={false}
                cardClassName={cn("bg-slate-800/70", metrics.averageLaborPercentage > 18 ? 'border-red-600/50' : 'border-green-600/50')}
              />
            </div>
          ) : (
            <CardDescription className="text-center text-slate-400 py-8">
              No data available. Please ensure you have forecast data and scheduled shifts for this week.
            </CardDescription>
          )}

          {metrics && metrics.dailyMetrics && Object.keys(metrics.dailyMetrics).length > 0 && (
            <div className="mt-8 bg-slate-800/60 border border-slate-700 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-200 mb-0 p-4 border-b border-slate-700">Daily Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-medium text-slate-300">Date</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Guests</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Sales</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Labor Hours</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Labor Cost</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Labor %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {weekDates.map(date => {
                      const dailyMetric = metrics.dailyMetrics[date];
                      if (!dailyMetric || dailyMetric.projectedGuests === 0 && dailyMetric.projectedSales === 0 && dailyMetric.laborHours === 0) {
                        // Don't render a row if there's no meaningful data for the day
                        // This handles days where forecast might be missing or no shifts are scheduled
                        return (
                          <tr key={date} className="text-slate-500">
                            <td className="py-2 px-3">{format(parseISO(date), 'EEE, MMM d')}</td>
                            <td className="py-2 px-3 text-right italic" colSpan={5}>No activity or forecast</td>
                          </tr>
                        );
                      }
                      
                      return (
                        <tr key={date} className="hover:bg-slate-700/30 transition-colors duration-150">
                          <td className="py-2 px-3 text-slate-300">
                            {format(parseISO(date), 'EEE, MMM d')}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {dailyMetric.projectedGuests.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            ${dailyMetric.projectedSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {dailyMetric.laborHours.toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            ${dailyMetric.laborCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className={cn(`py-2 px-3 text-right font-medium`,
                            dailyMetric.isOverTarget ? 'text-red-400' : 'text-green-400'
                          )}>
                            {dailyMetric.laborPercentage.toFixed(1)}%
                            {dailyMetric.isOverTarget ? <AlertTriangle size={14} className="inline ml-1 mb-0.5" /> : <CheckCircle size={14} className="inline ml-1 mb-0.5" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {weekDates.every(date => {
                 const dm = metrics.dailyMetrics[date];
                 return !dm || (dm.projectedGuests === 0 && dm.projectedSales === 0 && dm.laborHours === 0);
              }) && (
                <CardDescription className="text-center text-slate-500 p-6">
                  No daily activity or forecast data available for this week.
                </CardDescription>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingDashboard;

import React, { useState, useEffect } from 'react';
import { supabase } from 'supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { fetchForecastData, calculateOptimalStaffing } from '@/lib/laborScheduleUtils.js';
import { SPEND_PER_GUEST } from '@/config/laborScheduleConfig.jsx';
import { Loader2, AlertTriangle, CheckCircle, CalendarDays, TrendingUp, Users, DollarSign, Percent } from 'lucide-react';
import { cn } from ''@/lib//utils;

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

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStartDate, i), 'yyyy-MM-dd')
  );

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
          if (shift.employee_id && shift.start_time && shift.end_time) {
            try {
                const startTimeParts = shift.start_time.split(':');
                const endTimeParts = shift.end_time.split(':');

                const startDateObj = new Date(0);
                startDateObj.setUTCHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), parseInt(startTimeParts[2] || '0', 10));
                
                const endDateObj = new Date(0);
                endDateObj.setUTCHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), parseInt(endTimeParts[2] || '0', 10));

                if (endDateObj < startDateObj) { 
                    endDateObj.setDate(endDateObj.getDate() + 1);
                }
                
                const durationMs = endDateObj.getTime() - startDateObj.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);

                if (durationHours > 0) {
                    dailyLaborHours += durationHours;
                    const employeeWage = shift.employees?.wage_rate || averageHourlyRate;
                    dailyLaborCost += durationHours * employeeWage;
                }
            } catch(e) {
                console.error("Error parsing shift times in dashboard:", shift.start_time, shift.end_time, e);
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
        if (dailyIsOverTarget) {
          newMetrics.daysOverTarget += 1;
        }
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
          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CustomMetricCard
                title="Projected Guests"
                value={metrics.totalProjectedGuests.toLocaleString()}
                icon={<Users className="h-5 w-5 text-purple-400" />}
                isLoading={false}
                cardClassName="bg-slate-800/70"
              />
              <CustomMetricCard
                title="Projected Sales"
                value={`${metrics.totalProjectedSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                icon={<DollarSign className="h-5 w-5 text-green-400" />}
                isLoading={false}
                cardClassName="bg-slate-800/70"
              />
              <CustomMetricCard
                title="Labor Hours"
                value={metrics.totalLaborHours.toFixed(1)}
                unit="hrs"
                icon={<CalendarDays className="h-5 w-5 text-sky-400" />}
                isLoading={false}
                cardClassName="bg-slate-800/70"
              />
              <CustomMetricCard
                title="Labor %"
                value={`${metrics.averageLaborPercentage.toFixed(1)}%`}
                icon={<Percent className={cn("h-5 w-5", metrics.averageLaborPercentage > 18 ? "text-red-400" : "text-green-400")} />}
                trend={`Target: 18.0% (${metrics.daysOverTarget} day(s) over)`}
                isLoading={false}
                cardClassName={cn("bg-slate-800/70", metrics.averageLaborPercentage > 18 ? 'border-red-600/50' : 'border-green-600/50')}
              />
            </div>
          ) : (
            <CardDescription className="text-center text-slate-400 py-8">
              No data available. Please ensure you have forecast data and scheduled shifts for this week.
            </CardDescription>
          )}

          {metrics && metrics.dailyMetrics && Object.keys(metrics.dailyMetrics).length > 0 && (
            <div className="mt-8 bg-slate-800/60 border border-slate-700 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-200 mb-0 p-4 border-b border-slate-700">Daily Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-medium text-slate-300">Date</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Guests</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Sales</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Labor Hours</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Labor Cost</th>
                      <th className="text-right py-2.5 px-3 font-medium text-slate-300">Labor %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {weekDates.map(date => {
                      const dailyMetric = metrics.dailyMetrics[date];
                      if (!dailyMetric || dailyMetric.projectedGuests === 0 && dailyMetric.projectedSales === 0 && dailyMetric.laborHours === 0) {
                        // Don't render a row if there's no meaningful data for the day
                        // This handles days where forecast might be missing or no shifts are scheduled
                        return (
                          <tr key={date} className="text-slate-500">
                            <td className="py-2 px-3">{format(parseISO(date), 'EEE, MMM d')}</td>
                            <td className="py-2 px-3 text-right italic" colSpan={5}>No activity or forecast</td>
                          </tr>
                        );
                      }
                      
                      return (
                        <tr key={date} className="hover:bg-slate-700/30 transition-colors duration-150">
                          <td className="py-2 px-3 text-slate-300">
                            {format(parseISO(date), 'EEE, MMM d')}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {dailyMetric.projectedGuests.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            ${dailyMetric.projectedSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {dailyMetric.laborHours.toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            ${dailyMetric.laborCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className={cn(`py-2 px-3 text-right font-medium`,
                            dailyMetric.isOverTarget ? 'text-red-400' : 'text-green-400'
                          )}>
                            {dailyMetric.laborPercentage.toFixed(1)}%
                            {dailyMetric.isOverTarget ? <AlertTriangle size={14} className="inline ml-1 mb-0.5" /> : <CheckCircle size={14} className="inline ml-1 mb-0.5" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {weekDates.every(date => {
                 const dm = metrics.dailyMetrics[date];
                 return !dm || (dm.projectedGuests === 0 && dm.projectedSales === 0 && dm.laborHours === 0);
              }) && (
                <CardDescription className="text-center text-slate-500 p-6">
                  No daily activity or forecast data available for this week.
                </CardDescription>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingDashboard;
