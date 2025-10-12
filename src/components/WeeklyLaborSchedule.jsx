import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle, Plus, X, User, 
  Calendar, DollarSign, Target, Eye, EyeOff, TrendingUp, Users, ChevronDown, ChevronUp,
  Loader2, BarChart3, PieChart, Activity
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment, SHIFT_TIMES } from '@/config/laborScheduleConfig';

// Enhanced Badge Component with professional styling
const Badge = ({ children, variant = "default", size = "sm", emoji }) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full transition-all duration-200";
  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm"
  };
  const variantClasses = {
    default: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    foh: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-150",
    boh: "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-150", 
    bar: "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-150",
    management: "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-150",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    danger: "bg-red-100 text-red-800 border border-red-200"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {emoji && <span className="mr-1.5">{emoji}</span>}
      {children}
    </span>
  );
};

// Professional Budget Row Component
const BudgetRow = ({ title, scheduled, budget, color = "slate", emoji, icon: Icon }) => {
  const percentage = budget > 0 ? (scheduled / budget) * 100 : 0;
  
  const getStatusColor = (pct) => {
    if (pct <= 80) return "text-emerald-700";
    if (pct <= 100) return "text-amber-700";
    return "text-red-700";
  };

  const getProgressColor = (pct) => {
    if (pct <= 80) return "bg-emerald-500";
    if (pct <= 100) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusEmoji = (pct) => {
    if (pct <= 80) return "✅";
    if (pct <= 100) return "⚠️";
    return "🚨";
  };

  return (
    <div className="flex items-center justify-between py-4 px-5 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-5 flex-1">
        <div className="flex items-center space-x-3">
          {emoji && <span className="text-xl">{emoji}</span>}
          {Icon && <Icon className="h-5 w-5 text-slate-600" />}
          <span className="font-semibold text-slate-800 w-20">{title}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-900 font-semibold text-lg">
            ${scheduled.toLocaleString()}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-medium">
            ${budget.toLocaleString()}
          </span>
          <span className={`font-bold ${getStatusColor(percentage)} flex items-center space-x-1.5`}>
            <span>{getStatusEmoji(percentage)}</span>
            <span>({percentage.toFixed(1)}%)</span>
          </span>
        </div>
      </div>
      <div className="w-40 bg-slate-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-700 ease-out ${getProgressColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Professional Stats Card Component
const QuickStatsCard = ({ title, value, subtitle, emoji, color = "blue", trend }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800",
    emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-800",
    amber: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-800"
  };

  return (
    <div className={`p-5 rounded-xl border-2 ${colorClasses[color]} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80 mb-1">{title}</div>
          <div className="text-3xl font-bold mb-1">{value}</div>
          {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
          {trend && (
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">{trend}</span>
            </div>
          )}
        </div>
        {emoji && <span className="text-3xl">{emoji}</span>}
      </div>
    </div>
  );
};

// Utility functions
const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  return start;
};

const formatDateHeader = (date) => {
  if (!date || !(date instanceof Date)) return { day: 'Invalid', date: 'Date' };
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'numeric', day: 'numeric'
  });
  const parts = formatted.split(', ');
  return { day: parts[0] || 'Day', date: parts[1] || 'Date' };
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
  
  let hours, minutes;
  if (timeString.includes(':')) {
    [hours, minutes] = timeString.split(':');
  } else return timeString;

  const hour = parseInt(hours);
  const min = minutes || '00';
  if (isNaN(hour)) return timeString;

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${min} ${ampm}`;
};

const calculateHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const parseTime = (timeStr) => {
    let cleanTime = timeStr.replace(/AM|PM/gi, '').trim();
    let [hours, minutes = 0] = cleanTime.split(':').map(Number);
    
    if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
      hours += 12;
    } else if (timeStr.toUpperCase().includes('AM') && hours === 12) {
      hours = 0;
    }
    
    return hours + (minutes / 60);
  };
  
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  return Math.max(0, end - start);
};

const WeeklyLaborSchedule = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showManagerView, setShowManagerView] = useState(true);
  const [budgetCollapsed, setBudgetCollapsed] = useState(false);

  const contextData = useLaborData();
  const employees = contextData?.employees || [];
  const loading = contextData?.loading || false;
  const error = contextData?.error || null;
  const saveSchedule = contextData?.saveSchedule;
  const convertTimeToStandard = contextData?.convertTimeToStandard;

  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const filteredRoles = ROLES.filter(
    role => selectedDepartment === 'ALL' || role.department === selectedDepartment
  );

  const getFilteredEmployees = () => {
    if (!employees || !Array.isArray(employees)) return [];
    let filtered = employees.filter(emp => emp.is_active !== false);
    if (selectedDepartment !== 'ALL') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  // Calculate department stats (excluding Management from totals)
  const getDepartmentStats = (department) => {
    const assignments = Object.values(scheduleData).reduce((acc, day) => {
      const deptEmployees = (day.employees || []).filter(emp => 
        department === 'ALL' ? emp.department !== 'Management' : emp.department === department
      );
      return acc.concat(deptEmployees);
    }, []);

    const totalCost = assignments.reduce((sum, emp) => sum + (emp.hourly_rate * emp.hours), 0);
    const totalHours = assignments.reduce((sum, emp) => sum + emp.hours, 0);

    // Enhanced budget data with realistic targets
    const budgets = {
      'FOH': { budget: 1200, target: 1000 },
      'BOH': { budget: 1800, target: 1500 },
      'Bar': { budget: 600, target: 500 },
      'ALL': { budget: 3600, target: 3000 } // FOH + BOH + Bar (excluding Management)
    };

    return {
      scheduled: Math.round(totalCost),
      budget: budgets[department]?.budget || 0,
      target: budgets[department]?.target || 0,
      hours: Math.round(totalHours),
      employeeCount: assignments.length
    };
  };

  // Enhanced color functions with professional gradients
  const getDepartmentColor = (department) => {
    switch (department) {
      case 'FOH': return 'border-blue-300 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50';
      case 'BOH': return 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50';
      case 'Bar': return 'border-purple-300 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50';
      case 'Management': return 'border-amber-300 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50';
      default: return 'border-slate-300 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50';
    }
  };

  const getDepartmentFilterStyle = (deptId, isSelected) => {
    const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-sm text-sm";
    if (isSelected) {
      switch (deptId) {
        case 'FOH': return `${baseStyle} bg-blue-600 text-white shadow-lg transform scale-105`;
        case 'BOH': return `${baseStyle} bg-emerald-600 text-white shadow-lg transform scale-105`;
        case 'Bar': return `${baseStyle} bg-purple-600 text-white shadow-lg transform scale-105`;
        case 'Management': return `${baseStyle} bg-amber-600 text-white shadow-lg transform scale-105`;
        default: return `${baseStyle} bg-slate-700 text-white shadow-lg transform scale-105`;
      }
    }
    return `${baseStyle} bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md`;
  };

  const getDepartmentEmoji = (department) => {
    switch (department) {
      case 'FOH': return '🍽️';
      case 'BOH': return '👨‍🍳';
      case 'Bar': return '🍸';
      case 'Management': return '👔';
      default: return '👥';
    }
  };

  // Event handlers
  const handleAddEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    
    const shift = shiftIndex === 0 ? 'AM' : 'PM';
    const shiftTimes = SHIFT_TIMES[shift] || { start: '9:00', end: '17:00' };

    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
    const currentAssignments = scheduleData[scheduleKey]?.employees || [];

    if (currentAssignments.find(emp => emp.id === employeeId)) return;

    const startTime = convertTimeToStandard ? convertTimeToStandard(shiftTimes.start) : formatTime(shiftTimes.start);
    const endTime = convertTimeToStandard ? convertTimeToStandard(shiftTimes.end) : formatTime(shiftTimes.end);

    const newEmployee = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      hourly_rate: employee.hourly_rate,
      start: startTime,
      end: endTime,
      hours: calculateHours(startTime, endTime)
    };

    setScheduleData(prev => ({
      ...prev,
      [scheduleKey]: {
        ...prev[scheduleKey],
        employees: [...currentAssignments, newEmployee]
      }
    }));

    setHasUnsavedChanges(true);
    setShowDropdown(null);
  };

  const handleRemoveEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
    const currentAssignments = scheduleData[scheduleKey]?.employees || [];
    
    setScheduleData(prev => ({
      ...prev,
      [scheduleKey]: {
        ...prev[scheduleKey],
        employees: currentAssignments.filter(emp => emp.id !== employeeId)
      }
    }));

    setHasUnsavedChanges(true);
  };

  const handleSaveSchedule = async () => {
    try {
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (saveSchedule) {
        await saveSchedule(weekKey, scheduleData);
        setHasUnsavedChanges(false);
        alert('✅ Schedule saved successfully!');
      } else {
        localStorage.setItem('weeklyLaborSchedule', JSON.stringify(scheduleData));
        setHasUnsavedChanges(false);
        alert('💾 Schedule saved to local storage!');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('❌ Error saving schedule. Please try again.');
    }
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const getAssignedEmployees = (roleIndex, shiftIndex, dayIndex) => {
    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
    return scheduleData[scheduleKey]?.employees || [];
  };

  const getTotalAssignments = () => {
    return Object.values(scheduleData).reduce((total, day) => {
      return total + (day.employees?.length || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-6" />
          <p className="text-slate-600 text-lg">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-6" />
          <p className="text-red-600 text-lg">Error loading schedule: {error}</p>
        </div>
      </div>
    );
  }

  const fohStats = getDepartmentStats('FOH');
  const bohStats = getDepartmentStats('BOH');
  const barStats = getDepartmentStats('Bar');
  const totalStats = getDepartmentStats('ALL');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-full mx-auto space-y-6">
        {/* Professional Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span>Weekly Schedule</span>
            </h1>
            <Button
              onClick={() => setShowManagerView(!showManagerView)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {showManagerView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showManagerView ? 'Employee View' : 'Manager View'}</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Calendar className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-slate-700">
                Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)} className="bg-white shadow-sm hover:shadow-md">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateWeek(1)} className="bg-white shadow-sm hover:shadow-md">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats (Manager View Only) */}
        {showManagerView && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickStatsCard 
              title="Total Labor Cost" 
              value={`$${totalStats.scheduled.toLocaleString()}`}
              subtitle={`Target: $${totalStats.target.toLocaleString()}`}
              emoji="💰"
              color="blue"
              trend="+5.2% vs last week"
            />
            <QuickStatsCard 
              title="Total Hours" 
              value={totalStats.hours}
              subtitle="Scheduled this week"
              emoji="⏰"
              color="emerald"
              trend="Within target range"
            />
            <QuickStatsCard 
              title="Staff Assigned" 
              value={getTotalAssignments()}
              subtitle={`${filteredEmployees.length} available`}
              emoji="👥"
              color="purple"
              trend="Optimal coverage"
            />
            <QuickStatsCard 
              title="Budget Status" 
              value={`${((totalStats.scheduled / totalStats.budget) * 100).toFixed(0)}%`}
              subtitle="of weekly budget"
              emoji={totalStats.scheduled <= totalStats.target ? "✅" : "⚠️"}
              color="amber"
              trend={totalStats.scheduled <= totalStats.target ? "Under budget" : "Over budget"}
            />
          </div>
        )}

        {/* Enhanced Budget Section (Manager View Only) */}
        {showManagerView && (
          <Card className="border-slate-300 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-slate-600" />
                  <h3 className="text-xl font-bold text-slate-800">💼 Labor Budget vs Actual</h3>
                  <Badge variant="default" emoji="📊" size="sm">Live Tracking</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBudgetCollapsed(!budgetCollapsed)}
                  className="text-slate-600 hover:text-slate-800"
                >
                  {budgetCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              
              {!budgetCollapsed && (
                <div className="space-y-3">
                  <BudgetRow 
                    title="FOH" 
                    scheduled={fohStats.scheduled} 
                    budget={fohStats.budget} 
                    color="blue" 
                    emoji="🍽️"
                  />
                  <BudgetRow 
                    title="BOH" 
                    scheduled={bohStats.scheduled} 
                    budget={bohStats.budget} 
                    color="emerald" 
                    emoji="👨‍🍳"
                  />
                  <BudgetRow 
                    title="Bar" 
                    scheduled={barStats.scheduled} 
                    budget={barStats.budget} 
                    color="purple" 
                    emoji="🍸"
                  />
                  <div className="border-t-2 border-slate-200 pt-3 mt-4">
                    <BudgetRow 
                      title="Total" 
                      scheduled={totalStats.scheduled} 
                      budget={totalStats.budget} 
                      color="slate" 
                      emoji="📈"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Department Filter & Stats */}
        <Card className="border-slate-300 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <Filter className="h-5 w-5 text-slate-600" />
                  <span className="font-bold text-slate-700">Department Filter:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ALL', label: `All (${ROLES.length})`, emoji: '👥' },
                    { id: 'FOH', label: `FOH (${getRolesByDepartment('FOH').length})`, emoji: '🍽️' },
                    { id: 'BOH', label: `BOH (${getRolesByDepartment('BOH').length})`, emoji: '👨‍🍳' },
                    { id: 'Bar', label: `Bar (${getRolesByDepartment('Bar').length})`, emoji: '🍸' },
                    { id: 'Management', label: `Mgmt (${getRolesByDepartment('Management').length})`, emoji: '👔' }
                  ].map(dept => (
                    <Button
                      key={dept.id}
                      size="sm"
                      onClick={() => setSelectedDepartment(dept.id)}
                      className={getDepartmentFilterStyle(dept.id, selectedDepartment === dept.id)}
                    >
                      <span>{dept.emoji}</span>
                      <span>{dept.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-600 font-medium">Available:</span>
                  <Badge variant="default" size="sm">{filteredEmployees.length}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-600 font-medium">Assigned:</span>
                  <Badge variant="default" size="sm">{getTotalAssignments()}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FIXED Schedule Grid with proper layout */}
        <Card className="border-slate-300 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Fixed Day Headers */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1200px]">
                  <div className="grid grid-cols-8 gap-3 mb-6">
                    <div className="col-span-1 text-center font-bold text-slate-700 py-3">
                      Role / Shift
                    </div>
                    {weekDays.map((day, index) => {
                      const { day: dayName, date } = formatDateHeader(day);
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={index} className={`text-center p-3 rounded-lg ${isToday ? 'bg-blue-100 border-2 border-blue-400 shadow-md' : 'bg-slate-50 border border-slate-200'}`}>
                          <div className={`font-bold text-sm ${isToday ? 'text-blue-800' : 'text-slate-800'}`}>
                            {dayName} {isToday && '🗓️'}
                          </div>
                          <div className={`text-xs ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                            {date}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fixed Schedule Rows */}
                  {filteredRoles.map((role, roleIndex) => {
                    return [0, 1].map(shiftIndex => {
                      const shift = shiftIndex === 0 ? 'AM' : 'PM';
                      const shiftTimes = SHIFT_TIMES[shift] || { start: '9:00', end: '17:00' };
                      
                      return (
                        <div key={`${roleIndex}-${shiftIndex}`} className="grid grid-cols-8 gap-3 mb-4">
                          {/* Fixed Role Header */}
                          <div className={`col-span-1 p-4 rounded-lg border-2 ${getDepartmentColor(role.department)} flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[120px]`}>
                            <div className="text-center space-y-2">
                              <div className="text-lg">{getDepartmentEmoji(role.department)}</div>
                              <div className="font-bold text-slate-900 text-sm">{role.name}</div>
                              <div className="text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1">
                                <span>{shift === 'AM' ? '🌅' : '🌙'}</span>
                                <span>{shift}</span>
                              </div>
                              <div className="text-slate-600 text-xs">
                                {formatTime(shiftTimes.start)} - {formatTime(shiftTimes.end)}
                              </div>
                              <Badge variant={role.department.toLowerCase()} size="sm">
                                {role.department}
                              </Badge>
                            </div>
                          </div>

                          {/* Fixed Day Cards */}
                          {weekDays.map((day, dayIndex) => {
                            const assignedEmployees = getAssignedEmployees(roleIndex, shiftIndex, dayIndex);
                            const dropdownKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                            const isToday = day.toDateString() === new Date().toDateString();
                            
                            return (
                              <div key={dayIndex} className={`p-3 border-2 border-slate-200 rounded-lg min-h-[120px] ${isToday ? 'bg-blue-50/50 border-blue-300' : 'bg-white'} hover:shadow-md transition-all duration-200`}>
                                <div className="h-full flex flex-col">
                                  {assignedEmployees.length > 0 ? (
                                    <div className="space-y-2 flex-1">
                                      {assignedEmployees.map((emp, empIndex) => (
                                        <div key={empIndex} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 group hover:shadow-lg transition-all duration-200">
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                              <div className="font-bold text-slate-900 text-xs truncate flex items-center space-x-1">
                                                <span>👤</span>
                                                <span>{emp.name}</span>
                                              </div>
                                              <div className="text-slate-600 text-xs flex items-center space-x-1 mt-1">
                                                <span>💼</span>
                                                <span>{emp.role}</span>
                                                <span>•</span>
                                                <span>⏱️ {emp.hours}h</span>
                                              </div>
                                              <div className="text-slate-500 text-xs flex items-center space-x-1 mt-1">
                                                <span>💰</span>
                                                <span>${emp.hourly_rate}/hr</span>
                                              </div>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleRemoveEmployee(roleIndex, shiftIndex, dayIndex, emp.id)}
                                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center">
                                      <div className="relative">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)}
                                          className="text-slate-600 hover:bg-slate-50 border-dashed border-slate-400 text-xs px-3 py-2 flex items-center space-x-1 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                          <Plus className="h-3 w-3" />
                                          <span>Add Employee</span>
                                        </Button>
                                        
                                        {showDropdown === dropdownKey && (
                                          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-300 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                            {filteredEmployees.length > 0 ? (
                                              filteredEmployees.map(employee => (
                                                <button
                                                  key={employee.id}
                                                  onClick={() => handleAddEmployee(roleIndex, shiftIndex, dayIndex, employee.id)}
                                                  className="w-full text-left px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-center space-x-2 transition-colors duration-150"
                                                >
                                                  <span>👤</span>
                                                  <div className="flex-1">
                                                    <div className="font-semibold">{employee.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center space-x-1">
                                                      <span>💼 {employee.role}</span>
                                                      <span>•</span>
                                                      <span>💰 ${employee.hourly_rate}/hr</span>
                                                    </div>
                                                  </div>
                                                </button>
                                              ))
                                            ) : (
                                              <div className="px-4 py-3 text-xs text-slate-500 text-center">
                                                <span>😔 No employees available</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Action Bar */}
        <Card className="border-slate-300 shadow-lg bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="text-sm text-slate-600">
                {hasUnsavedChanges ? (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">⚠️ You have unsaved changes</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <span className="font-medium">✅ All changes saved</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => window.print()} className="bg-white shadow-sm hover:shadow-md" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  🖨️ Print Schedule
                </Button>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={!hasUnsavedChanges}
                  size="sm"
                  className={hasUnsavedChanges ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg' : 'bg-slate-300 text-slate-500'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {hasUnsavedChanges ? '💾 Save Schedule' : '✅ Saved'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(null)}
          />
        )}
      </div>
    </div>
  );
};

export default WeeklyLaborSchedule;
