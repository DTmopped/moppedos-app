import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle, Plus, X, User, 
  Calendar, DollarSign, Target, Eye, EyeOff, TrendingUp, Users
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment, SHIFT_TIMES } from '@/config/laborScheduleConfig';

// Clean Badge Component
const Badge = ({ children, variant = "default", size = "sm" }) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full";
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };
  const variantClasses = {
    default: "bg-slate-100 text-slate-700",
    foh: "bg-blue-100 text-blue-700",
    boh: "bg-emerald-100 text-emerald-700", 
    bar: "bg-purple-100 text-purple-700",
    management: "bg-amber-100 text-amber-700"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

// Budget Card Component
const BudgetCard = ({ title, budget, scheduled, hours, targetHours, color = "blue" }) => {
  const budgetUsed = budget > 0 ? (scheduled / budget) * 100 : 0;
  const hoursProgress = targetHours > 0 ? (hours / targetHours) * 100 : 0;
  
  const getStatusColor = (percentage) => {
    if (percentage <= 80) return "text-emerald-600";
    if (percentage <= 100) return "text-amber-600";
    return "text-red-600";
  };

  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    emerald: "border-emerald-200 bg-emerald-50",
    purple: "border-purple-200 bg-purple-50",
    amber: "border-amber-200 bg-amber-50"
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <h4 className="font-semibold text-slate-800 mb-3">{title}</h4>
      
      {/* Budget Section */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Budget:</span>
          <span className="font-medium">${budget.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Scheduled:</span>
          <span className="font-medium">${scheduled.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Used:</span>
          <span className={`font-bold ${getStatusColor(budgetUsed)}`}>
            {budgetUsed.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              budgetUsed <= 80 ? 'bg-emerald-500' : 
              budgetUsed <= 100 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Hours Section */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Target:</span>
          <span className="font-medium">{targetHours}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Scheduled:</span>
          <span className="font-medium">{hours}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Progress:</span>
          <span className={`font-bold ${getStatusColor(hoursProgress)}`}>
            {hoursProgress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              hoursProgress <= 80 ? 'bg-emerald-500' : 
              hoursProgress <= 100 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(hoursProgress, 100)}%` }}
          />
        </div>
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

  // Calculate department stats
  const getDepartmentStats = (department) => {
    const assignments = Object.values(scheduleData).reduce((acc, day) => {
      const deptEmployees = (day.employees || []).filter(emp => 
        department === 'ALL' || emp.department === department
      );
      return acc.concat(deptEmployees);
    }, []);

    const totalCost = assignments.reduce((sum, emp) => sum + (emp.hourly_rate * emp.hours), 0);
    const totalHours = assignments.reduce((sum, emp) => sum + emp.hours, 0);

    // Mock budget data - in real app, pull from FVA/Forecast
    const budgets = {
      'FOH': { budget: 800, targetHours: 50 },
      'BOH': { budget: 1200, targetHours: 75 },
      'Bar': { budget: 300, targetHours: 20 },
      'Management': { budget: 400, targetHours: 25 },
      'ALL': { budget: 2700, targetHours: 170 }
    };

    return {
      scheduled: Math.round(totalCost),
      hours: Math.round(totalHours),
      budget: budgets[department]?.budget || 0,
      targetHours: budgets[department]?.targetHours || 0
    };
  };

  // Enhanced color functions
  const getDepartmentColor = (department) => {
    switch (department) {
      case 'FOH': return 'border-blue-200 bg-blue-50';
      case 'BOH': return 'border-emerald-200 bg-emerald-50';
      case 'Bar': return 'border-purple-200 bg-purple-50';
      case 'Management': return 'border-amber-200 bg-amber-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  const getDepartmentFilterStyle = (deptId, isSelected) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200";
    if (isSelected) {
      switch (deptId) {
        case 'FOH': return `${baseStyle} bg-blue-600 text-white`;
        case 'BOH': return `${baseStyle} bg-emerald-600 text-white`;
        case 'Bar': return `${baseStyle} bg-purple-600 text-white`;
        case 'Management': return `${baseStyle} bg-amber-600 text-white`;
        default: return `${baseStyle} bg-slate-600 text-white`;
      }
    }
    return `${baseStyle} bg-white text-slate-700 border border-slate-300 hover:bg-slate-50`;
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
        alert('Schedule saved successfully!');
      } else {
        localStorage.setItem('weeklyLaborSchedule', JSON.stringify(scheduleData));
        setHasUnsavedChanges(false);
        alert('Schedule saved to local storage!');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule. Please try again.');
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading schedule: {error}</p>
        </div>
      </div>
    );
  }

  const fohStats = getDepartmentStats('FOH');
  const bohStats = getDepartmentStats('BOH');
  const barStats = getDepartmentStats('Bar');
  const mgmtStats = getDepartmentStats('Management');
  const totalStats = getDepartmentStats('ALL');

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-slate-800">Weekly Schedule</h2>
          <Button
            onClick={() => setShowManagerView(!showManagerView)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            {showManagerView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showManagerView ? 'Employee View' : 'Manager View'}</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-700">
              Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Manager Budget Section */}
      {showManagerView && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="h-5 w-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Labor Budget vs Actual</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              <BudgetCard 
                title="FOH" 
                budget={fohStats.budget}
                scheduled={fohStats.scheduled}
                hours={fohStats.hours}
                targetHours={fohStats.targetHours}
                color="blue"
              />
              <BudgetCard 
                title="BOH" 
                budget={bohStats.budget}
                scheduled={bohStats.scheduled}
                hours={bohStats.hours}
                targetHours={bohStats.targetHours}
                color="emerald"
              />
              <BudgetCard 
                title="Bar" 
                budget={barStats.budget}
                scheduled={barStats.scheduled}
                hours={barStats.hours}
                targetHours={barStats.targetHours}
                color="purple"
              />
              <BudgetCard 
                title="Management" 
                budget={mgmtStats.budget}
                scheduled={mgmtStats.scheduled}
                hours={mgmtStats.hours}
                targetHours={mgmtStats.targetHours}
                color="amber"
              />
              <BudgetCard 
                title="TOTAL" 
                budget={totalStats.budget}
                scheduled={totalStats.scheduled}
                hours={totalStats.hours}
                targetHours={totalStats.targetHours}
                color="blue"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Filter & Stats */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-700">Department:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { id: 'ALL', label: `All (${ROLES.length})` },
                  { id: 'FOH', label: `FOH (${getRolesByDepartment('FOH').length})` },
                  { id: 'BOH', label: `BOH (${getRolesByDepartment('BOH').length})` },
                  { id: 'Bar', label: `Bar (${getRolesByDepartment('Bar').length})` },
                  { id: 'Management', label: `Mgmt (${getRolesByDepartment('Management').length})` }
                ].map(dept => (
                  <Button
                    key={dept.id}
                    size="sm"
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={getDepartmentFilterStyle(dept.id, selectedDepartment === dept.id)}
                  >
                    {dept.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Available: <strong>{filteredEmployees.length}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Assignments: <strong>{getTotalAssignments()}</strong></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <div className="space-y-4">
        {/* Header Row */}
        <div className="grid grid-cols-8 gap-3">
          <div className="col-span-1">
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-center">
              <span className="font-semibold text-slate-800 text-sm">Role / Shift</span>
            </div>
          </div>
          {weekDays.map((day, index) => {
            const headerInfo = formatDateHeader(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={index}>
                <div className={`${isToday ? 'bg-blue-100 border-blue-300' : 'bg-slate-100 border-slate-200'} border rounded-lg p-3 text-center`}>
                  <div className={`font-semibold text-xs ${isToday ? 'text-blue-800' : 'text-slate-800'}`}>
                    {headerInfo.day}
                  </div>
                  <div className={`text-xs mt-1 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                    {headerInfo.date}
                  </div>
                  {isToday && <div className="text-xs text-blue-500 font-medium mt-1">Today</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule Rows */}
        {filteredRoles.map((role, roleIndex) => {
          const shifts = [
            { name: 'AM', startTime: SHIFT_TIMES.AM.start, endTime: SHIFT_TIMES.AM.end },
            { name: 'PM', startTime: SHIFT_TIMES.PM.start, endTime: SHIFT_TIMES.PM.end }
          ];
          
          return shifts.map((shift, shiftIndex) => (
            <div key={`${roleIndex}-${shiftIndex}`} className="grid grid-cols-8 gap-3">
              {/* Role Card */}
              <div className="col-span-1">
                <div className={`${getDepartmentColor(role.department)} border rounded-lg p-3 h-24 flex flex-col justify-center`}>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 text-sm">{role.name}</div>
                    <div className="text-slate-600 text-xs mt-1">{shift.name} Shift</div>
                    <div className="text-slate-700 text-xs font-medium mt-1">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Cards */}
              {weekDays.map((day, dayIndex) => {
                const assignedEmployees = getAssignedEmployees(roleIndex, shiftIndex, dayIndex);
                const dropdownKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div key={dayIndex} className="col-span-1">
                    <div className={`${getDepartmentColor(role.department)} border rounded-lg p-2 h-24 ${isToday ? 'ring-2 ring-blue-300' : ''}`}>
                      {assignedEmployees.length > 0 ? (
                        <div className="space-y-1">
                          {assignedEmployees.map((emp, empIndex) => (
                            <div key={empIndex} className="bg-white rounded p-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-slate-900 truncate">{emp.name}</div>
                                  <div className="text-slate-600">{emp.hours}h</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveEmployee(roleIndex, shiftIndex, dayIndex, emp.id)}
                                  className="h-5 w-5 p-0 text-slate-400 hover:text-red-500"
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
                              variant="ghost"
                              onClick={() => setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)}
                              className="text-slate-600 hover:bg-white/70 border border-dashed border-slate-300 text-xs px-2 py-1"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                            
                            {showDropdown === dropdownKey && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                                {filteredEmployees.length > 0 ? (
                                  filteredEmployees.map(employee => (
                                    <button
                                      key={employee.id}
                                      onClick={() => handleAddEmployee(roleIndex, shiftIndex, dayIndex, employee.id)}
                                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                    >
                                      <div className="font-medium">{employee.name}</div>
                                      <div className="text-xs text-slate-500">{employee.role}</div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-slate-500">No employees available</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Department Badge */}
                      <div className="mt-1 flex justify-center">
                        <Badge variant={role.department.toLowerCase()} size="sm">
                          {role.department}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })}
      </div>

      {/* Action Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>You have unsaved changes</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" />
                Print Schedule
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={!hasUnsavedChanges}
                className={hasUnsavedChanges ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
              >
                <Save className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? 'Save Schedule' : 'Saved'}
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
  );
};

export default WeeklyLaborSchedule;
