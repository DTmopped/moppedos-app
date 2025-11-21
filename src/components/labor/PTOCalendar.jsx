import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  User, AlertTriangle, CheckCircle
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isToday, addMonths, subMonths, 
  isWithinInterval, startOfDay, endOfDay, parseISO
} from 'date-fns';
import { supabase } from '@/supabaseClient';
import { getCurrentLocationId } from '@/supabaseClient';

// PTO Calendar Component
const PTOCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [ptoRequests, setPtoRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load PTO requests for current month
  useEffect(() => {
    loadPTORequests();
  }, [currentMonth]);

  const loadPTORequests = async () => {
    try {
      setLoading(true);
      const locationUuid = getCurrentLocationId();
      
      if (!locationUuid) {
        console.error('No location ID found');
        setLoading(false);
        return;
      }

      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // Get approved PTO requests that overlap with current month
      const { data, error } = await supabase
        .from('pto_requests')
        .select(`
          *,
          employees:employee_id (
            name,
            role
          )
        `)
        .eq('location_id', locationUuid)
        .eq('status', 'approved')
        .or(`start_date.lte.${monthEnd},end_date.gte.${monthStart}`);

      if (error) {
        console.error('Error loading PTO requests:', error);
        setLoading(false);
        return;
      }

      setPtoRequests(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PTO requests:', error);
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  // Get all days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Check if a day has PTO
  const getPTOForDay = (day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    return ptoRequests.filter(pto => {
      const ptoStart = startOfDay(parseISO(pto.start_date));
      const ptoEnd = endOfDay(parseISO(pto.end_date));
      
      return isWithinInterval(dayStart, { start: ptoStart, end: ptoEnd }) ||
             isWithinInterval(ptoStart, { start: dayStart, end: dayEnd });
    });
  };

  // Calendar day cell component
  const CalendarDay = ({ day }) => {
    const ptoList = getPTOForDay(day);
    const hasPTO = ptoList.length > 0;
    const isCurrentDay = isToday(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);

    return (
      <div
        className={`
          min-h-24 p-2 border border-slate-200
          ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'}
          ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
          ${hasPTO ? 'bg-amber-50' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-slate-700'}`}>
            {format(day, 'd')}
          </span>
          {hasPTO && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              {ptoList.length} PTO
            </span>
          )}
        </div>

        {hasPTO && (
          <div className="space-y-1">
            {ptoList.slice(0, 3).map((pto, index) => (
              <div
                key={index}
                className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded truncate"
                title={`${pto.employees?.name} - ${pto.request_type}`}
              >
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate">{pto.employees?.name}</span>
                </div>
              </div>
            ))}
            {ptoList.length > 3 && (
              <div className="text-xs text-amber-600 px-2">
                +{ptoList.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-900">
            <CalendarIcon className="h-5 w-5 mr-2" />
            PTO Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-slate-900">
            <CalendarIcon className="h-5 w-5 mr-2" />
            PTO Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreviousMonth}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToday}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextMonth}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-slate-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-slate-200">
          {/* Add empty cells for days before month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="min-h-24 border-r border-b border-slate-200 bg-slate-50"
            />
          ))}

          {/* Render actual days */}
          {daysInMonth.map(day => (
            <CalendarDay key={day.toISOString()} day={day} />
          ))}

          {/* Add empty cells to complete the grid */}
          {Array.from({ 
            length: 6 - endOfMonth(currentMonth).getDay() 
          }).map((_, index) => (
            <div
              key={`empty-end-${index}`}
              className="min-h-24 border-r border-b border-slate-200 bg-slate-50"
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded mr-2" />
            <span className="text-slate-600">PTO Day</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded mr-2" />
            <span className="text-slate-600">Today</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
            <span className="text-slate-600">Approved PTO Only</span>
          </div>
        </div>

        {/* Summary */}
        {ptoRequests.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              {format(currentMonth, 'MMMM')} PTO Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Total Requests:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {ptoRequests.length}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Total Days:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {ptoRequests.reduce((sum, pto) => sum + (pto.days_requested || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTOCalendar;
