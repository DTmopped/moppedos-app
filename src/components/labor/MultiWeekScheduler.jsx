import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, Calendar, Copy, RotateCcw, Save,
  ArrowRight, Clock, Users, TrendingUp, AlertCircle
} from 'lucide-react';
import { startOfWeek, addWeeks, format, isSameWeek } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    outline: "bg-white text-slate-700 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Week Navigation Component
const WeekNavigation = ({ currentWeek, onWeekChange, availableWeeks }) => {
  const currentWeekIndex = availableWeeks.findIndex(week => 
    isSameWeek(week.startDate, currentWeek)
  );

  const canGoPrevious = currentWeekIndex > 0;
  const canGoNext = currentWeekIndex < availableWeeks.length - 1;

  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-slate-900">Week Navigation</span>
        </div>
        <div className="flex items-center space-x-1">
          {availableWeeks.map((week, index) => (
            <button
              key={week.id}
              onClick={() => onWeekChange(week.startDate)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isSameWeek(week.startDate, currentWeek)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {week.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => canGoPrevious && onWeekChange(availableWeeks[currentWeekIndex - 1].startDate)}
          disabled={!canGoPrevious}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center min-w-[120px]">
          <div className="font-semibold text-slate-900">
            {format(currentWeek, 'MMM d')} - {format(addWeeks(currentWeek, 1), 'MMM d, yyyy')}
          </div>
          <div className="text-xs text-slate-500">
            {availableWeeks[currentWeekIndex]?.label || 'Current Week'}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => canGoNext && onWeekChange(availableWeeks[currentWeekIndex + 1].startDate)}
          disabled={!canGoNext}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Week Actions Component
const WeekActions = ({ 
  currentWeek, 
  onCopyFromPrevious, 
  onResetWeek, 
  onSaveWeek,
  hasChanges,
  isCurrentWeek 
}) => {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <Badge variant={isCurrentWeek ? "default" : "secondary"}>
          {isCurrentWeek ? "Current Week" : "Future Week"}
        </Badge>
        {hasChanges && (
          <Badge variant="warning">
            <Clock className="h-3 w-3 mr-1" />
            Unsaved Changes
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyFromPrevious}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Previous Week
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onResetWeek}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        
        <Button
          onClick={onSaveWeek}
          disabled={!hasChanges}
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Week
        </Button>
      </div>
    </div>
  );
};

// Schedule Summary Component
const ScheduleSummary = ({ weekData, weekLabel }) => {
  const totalShifts = Object.values(weekData).reduce((total, dayData) => {
    return total + Object.values(dayData).reduce((dayTotal, shiftData) => {
      return dayTotal + Object.values(shiftData).reduce((shiftTotal, roleData) => {
        return shiftTotal + (Array.isArray(roleData) ? roleData.filter(emp => emp.name).length : 0);
      }, 0);
    }, 0);
  }, 0);

  const filledRoles = new Set();
  Object.values(weekData).forEach(dayData => {
    Object.values(dayData).forEach(shiftData => {
      Object.entries(shiftData).forEach(([role, employees]) => {
        if (Array.isArray(employees) && employees.some(emp => emp.name)) {
          filledRoles.add(role);
        }
      });
    });
  });

  const completionPercentage = ROLES.length > 0 ? Math.round((filledRoles.size / ROLES.length) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{totalShifts}</div>
        <div className="text-sm text-slate-600">Total Shifts</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-emerald-600">{filledRoles.size}</div>
        <div className="text-sm text-slate-600">Roles Filled</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{completionPercentage}%</div>
        <div className="text-sm text-slate-600">Complete</div>
      </div>
    </div>
  );
};

// Main Multi-Week Scheduler Component
const MultiWeekScheduler = ({ 
  scheduleData, 
  onScheduleUpdate,
  onWeekSave,
  filteredRoles,
  selectedDepartment 
}) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState({});
  
  // Generate 5 weeks (current + 4 future)
  const availableWeeks = React.useMemo(() => {
    const weeks = [];
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 });
    
    for (let i = 0; i < 5; i++) {
      const weekStart = addWeeks(startWeek, i);
      weeks.push({
        id: `week-${i}`,
        startDate: weekStart,
        label: i === 0 ? 'Current' : `Week +${i}`,
        isCurrentWeek: i === 0
      });
    }
    return weeks;
  }, []);

  // Get current week data
  const currentWeekData = React.useMemo(() => {
    const weekKey = format(currentWeek, 'yyyy-MM-dd');
    return scheduleData[weekKey] || {};
  }, [scheduleData, currentWeek]);

  // Handle week change
  const handleWeekChange = (newWeekStart) => {
    setCurrentWeek(newWeekStart);
  };

  // Copy from previous week
  const handleCopyFromPrevious = () => {
    const currentWeekIndex = availableWeeks.findIndex(week => 
      isSameWeek(week.startDate, currentWeek)
    );
    
    if (currentWeekIndex > 0) {
      const previousWeek = availableWeeks[currentWeekIndex - 1];
      const previousWeekKey = format(previousWeek.startDate, 'yyyy-MM-dd');
      const previousWeekData = scheduleData[previousWeekKey] || {};
      
      // Copy the schedule structure but clear employee names for future weeks
      const copiedData = JSON.parse(JSON.stringify(previousWeekData));
      
      // If copying to a future week, clear names but keep structure
      if (currentWeekIndex > 0) {
        Object.keys(copiedData).forEach(day => {
          Object.keys(copiedData[day]).forEach(shift => {
            Object.keys(copiedData[day][shift]).forEach(role => {
              if (Array.isArray(copiedData[day][shift][role])) {
                copiedData[day][shift][role] = copiedData[day][shift][role].map(emp => ({
                  ...emp,
                  name: '', // Clear names for future weeks
                  start: emp.start || '',
                  end: emp.end || ''
                }));
              }
            });
          });
        });
      }
      
      const currentWeekKey = format(currentWeek, 'yyyy-MM-dd');
      onScheduleUpdate(currentWeekKey, copiedData);
      setHasUnsavedChanges(prev => ({ ...prev, [currentWeekKey]: true }));
    }
  };

  // Reset current week
  const handleResetWeek = () => {
    const currentWeekKey = format(currentWeek, 'yyyy-MM-dd');
    onScheduleUpdate(currentWeekKey, {});
    setHasUnsavedChanges(prev => ({ ...prev, [currentWeekKey]: false }));
  };

  // Save current week
  const handleSaveWeek = () => {
    const currentWeekKey = format(currentWeek, 'yyyy-MM-dd');
    if (onWeekSave) {
      onWeekSave(currentWeekKey, currentWeekData);
    }
    setHasUnsavedChanges(prev => ({ ...prev, [currentWeekKey]: false }));
  };

  const currentWeekKey = format(currentWeek, 'yyyy-MM-dd');
  const hasChanges = hasUnsavedChanges[currentWeekKey] || false;
  const isCurrentWeek = isSameWeek(currentWeek, new Date());

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <WeekNavigation
        currentWeek={currentWeek}
        onWeekChange={handleWeekChange}
        availableWeeks={availableWeeks}
      />

      {/* Week Actions */}
      <WeekActions
        currentWeek={currentWeek}
        onCopyFromPrevious={handleCopyFromPrevious}
        onResetWeek={handleResetWeek}
        onSaveWeek={handleSaveWeek}
        hasChanges={hasChanges}
        isCurrentWeek={isCurrentWeek}
      />

      {/* Schedule Summary */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Week Summary - {format(currentWeek, 'MMM d')} to {format(addWeeks(currentWeek, 1), 'MMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleSummary 
            weekData={currentWeekData}
            weekLabel={availableWeeks.find(w => isSameWeek(w.startDate, currentWeek))?.label}
          />
        </CardContent>
      </Card>

      {/* Future Week Planning Tips */}
      {!isCurrentWeek && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Future Week Planning</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Use "Copy Previous Week" to start with last week's structure, then adjust for expected sales changes, 
                  PTO requests, and special events. Save early to avoid losing changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiWeekScheduler;
