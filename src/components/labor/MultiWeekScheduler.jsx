import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, Users, DollarSign, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Copy, Edit, BarChart3, Target,
  AlertCircle, CheckCircle, XCircle, Plus, Settings, RefreshCw, Loader2
} from 'lucide-react';
import { format, addWeeks, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';
import { supabase } from '@/supabaseClient';
import { getCurrentLocationId } from '@/supabaseClient';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    minimal: "bg-orange-50 text-orange-700 border-orange-200",
    full: "bg-green-50 text-green-700 border-green-200",
    notset: "bg-slate-50 text-slate-600 border-slate-200"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Multi-Week Analytics Summary
const AnalyticsSummary = ({ weeks }) => {
  const totalWeeks = weeks.length;
  const totalHours = weeks.reduce((sum, week) => sum + week.totalHours, 0);
  const totalCost = weeks.reduce((sum, week) => sum + week.estimatedCost, 0);
  const avgWeeklyCost = totalCost / totalWeeks;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-blue-600 rounded-full">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{totalWeeks}</div>
          <div className="text-sm text-blue-700">Weeks Planned</div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-emerald-600 rounded-full">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{totalHours.toLocaleString()}</div>
          <div className="text-sm text-emerald-700">Total Hours</div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-purple-600 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">${totalCost.toLocaleString()}</div>
          <div className="text-sm text-purple-700">Total Cost</div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-orange-600 rounded-full">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-900">${Math.round(avgWeeklyCost).toLocaleString()}</div>
          <div className="text-sm text-orange-700">Avg/Week</div>
        </CardContent>
      </Card>
    </div>
  );
};

// Week Card Component
const WeekCard = ({ week, isCurrentWeek, onCopyPrevious, onEditWeek }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'full':
        return <Badge variant="full">Full Staffing</Badge>;
      case 'minimal':
        return <Badge variant="minimal">Minimal</Badge>;
      case 'not_set':
        return <Badge variant="notset">Not Set</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'full':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'minimal':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'not_set':
        return <XCircle className="h-4 w-4 text-slate-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Card className={`border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow ${
      isCurrentWeek ? 'ring-2 ring-blue-500 border-blue-300' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-slate-900">
                {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d, yyyy')}
              </h3>
              {isCurrentWeek && (
                <Badge variant="info">Current Week</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(week.status)}
              {getStatusBadge(week.status)}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Shifts:</span>
            <span className="font-medium text-slate-900">{week.totalShifts}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Hours:</span>
            <span className="font-medium text-slate-900">{week.totalHours}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Est. Labor Cost:</span>
            <span className="font-medium text-slate-900">${week.estimatedCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopyPrevious(week.id)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy Previous
          </Button>
          <Button
            size="sm"
            onClick={() => onEditWeek(week.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Week
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions Toolbar
const QuickActions = ({ onAutoPopulate, onOptimizeAll, onGenerateReport, isGenerating }) => {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Quick Actions</h3>
            <p className="text-sm text-slate-600">Bulk operations for multi-week planning</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerateReport}
              disabled={isGenerating}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Generate Report
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onOptimizeAll}
              disabled={isGenerating}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Target className="h-4 w-4 mr-1" />
              Optimize All
            </Button>
            <Button
              size="sm"
              onClick={onAutoPopulate}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Auto-Populate All Weeks
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Department Breakdown
const DepartmentBreakdown = ({ weeks }) => {
  // Calculate department totals across all weeks
  const departmentTotals = {
    'Front of House': { hours: 0, cost: 0 },
    'Back of House': { hours: 0, cost: 0 },
    'Bar & Beverage': { hours: 0, cost: 0 },
    'Management': { hours: 0, cost: 0 }
  };

  // Simulate department breakdown (in real app, this would come from actual schedule data)
  weeks.forEach(week => {
    departmentTotals['Front of House'].hours += Math.round(week.totalHours * 0.4);
    departmentTotals['Front of House'].cost += Math.round(week.estimatedCost * 0.4);
    
    departmentTotals['Back of House'].hours += Math.round(week.totalHours * 0.35);
    departmentTotals['Back of House'].cost += Math.round(week.estimatedCost * 0.35);
    
    departmentTotals['Bar & Beverage'].hours += Math.round(week.totalHours * 0.15);
    departmentTotals['Bar & Beverage'].cost += Math.round(week.estimatedCost * 0.15);
    
    departmentTotals['Management'].hours += Math.round(week.totalHours * 0.1);
    departmentTotals['Management'].cost += Math.round(week.estimatedCost * 0.1);
  });

  const departmentColors = {
    'Front of House': 'bg-blue-500',
    'Back of House': 'bg-emerald-500',
    'Bar & Beverage': 'bg-purple-500',
    'Management': 'bg-orange-500'
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <Users className="h-5 w-5 mr-2" />
          Department Breakdown - Multi-Week Totals
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(departmentTotals).map(([dept, data]) => (
            <div key={dept} className="text-center">
              <div className={`w-12 h-12 ${departmentColors[dept]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-slate-900 text-sm mb-1">{dept}</h4>
              <div className="text-xs text-slate-600">
                <div>{data.hours} hours</div>
                <div>${data.cost.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Multi-Week Scheduler Component
const MultiWeekScheduler = () => {
  const [currentPeriodStart, setCurrentPeriodStart] = useState(() => startOfWeek(new Date()));
  const [isGenerating, setIsGenerating] = useState(false);
  const { getWeekSchedule, employees } = useLaborData();

  // Generate 5 weeks of data starting from current period
  const generateWeeksData = (startDate) => {
    const weeks = [];
    for (let i = 0; i < 5; i++) {
      const weekStart = addWeeks(startDate, i);
      const weekEnd = endOfWeek(weekStart);
      const isCurrentWeek = i === 0;
      
      // Simulate different staffing levels and costs
      const staffingLevels = ['full', 'full', 'minimal', 'full', 'not_set'];
      const shifts = [45, 42, 28, 53, 0];
      const hours = [338, 315, 210, 398, 0];
      const costs = [6075, 5670, 3780, 7155, 0];
      
      weeks.push({
        id: `week-${i}`,
        startDate: weekStart,
        endDate: weekEnd,
        status: staffingLevels[i],
        totalShifts: shifts[i],
        totalHours: hours[i],
        estimatedCost: costs[i],
        isCurrentWeek
      });
    }
    return weeks;
  };

  const [weeks, setWeeks] = useState(() => generateWeeksData(currentPeriodStart));

  // Update weeks when period changes
  useEffect(() => {
    setWeeks(generateWeeksData(currentPeriodStart));
  }, [currentPeriodStart]);

  const handlePreviousPeriod = () => {
    setCurrentPeriodStart(prev => addWeeks(prev, -5));
  };

  const handleNextPeriod = () => {
    setCurrentPeriodStart(prev => addWeeks(prev, 5));
  };

  const handleCurrentPeriod = () => {
    setCurrentPeriodStart(startOfWeek(new Date()));
  };

  const handleCopyPrevious = (weekId) => {
    console.log('Copy previous week for:', weekId);
    // Implement copy previous week logic
  };

  const handleEditWeek = (weekId) => {
    console.log('Edit week:', weekId);
    // Navigate to weekly schedule view for specific week
  };

  const handleAutoPopulate = async () => {
    console.log('🚀 Auto-populate all weeks starting...');
    
    try {
      // Get current location UUID
      const locationUuid = getCurrentLocationId();
      
      if (!locationUuid) {
        alert('❌ Error: No location ID found. Please ensure you are logged in.');
        return;
      }
      
      // Show loading state
      setIsGenerating(true);
      
      const results = [];
      
      // Generate schedule for each week
      for (const week of weeks) {
        const weekStartDate = week.startDate.toISOString().split('T')[0];
        
        console.log(`📅 Generating schedule for week starting ${weekStartDate}...`);
        
        try {
          // Call the Supabase RPC function
          const { data, error } = await supabase.rpc('generate_schedule_with_breaks', {
            p_location_id: locationUuid,
            p_week_start_date: weekStartDate
          });
          
          if (error) {
            console.error(`❌ Error generating schedule for ${weekStartDate}:`, error);
            results.push({ week: weekStartDate, status: 'error', error: error.message });
          } else {
            console.log(`✅ Schedule generated for ${weekStartDate}:`, data);
            results.push({ week: weekStartDate, status: 'success', data });
          }
        } catch (err) {
          console.error(`❌ Exception generating schedule for ${weekStartDate}:`, err);
          results.push({ week: weekStartDate, status: 'error', error: err.message });
        }
      }
      
      // Show success message
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      alert(`✅ Schedule Generation Complete!\n\n` +
            `✅ ${successCount} weeks generated successfully\n` +
            `❌ ${errorCount} weeks failed\n\n` +
            `Refresh the page to see the new schedules.`);
      
      // Reload the page to show new schedules
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Fatal error in handleAutoPopulate:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeAll = () => {
    console.log('Optimize all weeks');
    // Implement optimization logic
  };

  const handleGenerateReport = () => {
    console.log('Generate multi-week report');
    // Implement report generation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Multi-Week Scheduler</h2>
          <p className="text-slate-600">Plan and optimize schedules across multiple weeks</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handlePreviousPeriod}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Period
          </Button>
          <Button
            variant="outline"
            onClick={handleCurrentPeriod}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Current Period
          </Button>
          <Button
            variant="outline"
            onClick={handleNextPeriod}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Next Period
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <AnalyticsSummary weeks={weeks} />

      {/* Quick Actions */}
      <QuickActions
        onAutoPopulate={handleAutoPopulate}
        onOptimizeAll={handleOptimizeAll}
        onGenerateReport={handleGenerateReport}
        isGenerating={isGenerating}
      />

      {/* Week Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {weeks.map((week) => (
          <WeekCard
            key={week.id}
            week={week}
            isCurrentWeek={week.isCurrentWeek}
            onCopyPrevious={handleCopyPrevious}
            onEditWeek={handleEditWeek}
          />
        ))}
      </div>

      {/* Department Breakdown */}
      <DepartmentBreakdown weeks={weeks} />

      {/* Planning Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Multi-Week Planning Tips</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Plan 4-5 weeks in advance for better staff coordination and cost control</li>
                <li>• Use "Copy Previous" for consistent schedules, then adjust for special events</li>
                <li>• Monitor labor cost trends across weeks to identify optimization opportunities</li>
                <li>• Consider seasonal patterns and local events when planning future weeks</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiWeekScheduler;
