import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle, Plus, X, User, Calendar, Target, TrendingUp
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment, SHIFT_TIMES } from '@/config/laborScheduleConfig';

// Enhanced Badge Component with better styling
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm";
  const variantClasses = {
    default: "bg-slate-100 text-slate-800 border border-slate-200",
    foh: "bg-blue-50 text-blue-700 border border-blue-200",
    boh: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    bar: "bg-purple-50 text-purple-700 border border-purple-200",
    management: "bg-amber-50 text-amber-700 border border-amber-200"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Enhanced Stats Card Component
const StatsCard = ({ icon: Icon, label, value, subtext, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700"
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-3 flex items-center space-x-3`}>
      <Icon className="h-5 w-5" />
      <div>
        <div className="font-semibold text-sm">{value}</div>
        <div className="text-xs opacity-75">{label}</div>
        {subtext && <div className="text-xs opacity-60">{subtext}</div>}
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
    weekday: 'long', month: 'numeric', day: 'numeric'
  });
  const parts = formatted.split(', ');
  return { day: parts[0] || 'Day', date: parts[1] || 'Date' };
};

// Enhanced time formatting function
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
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

// NEW: Calculate hours between two times
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

  const contextData = useLaborData();
  const employees = contextData?.employees || [];
  const loading = contextData?.loading || false;
  const error = contextData?.error || null;
  const saveSchedule = contextData?.saveSchedule;
  const convertTimeToStandard = contextData?.convertTimeToStandard;

  console.log('Context data:', contextData);
  console.log('Employees:', employees);
  
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
    if (!employees || !Array.isArray(employees)) {
      return [];
    }

    let filtered = employees.filter(emp => emp.is_active !== false);
    
    if (selectedDepartment !== 'ALL') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  // Enhanced color functions with better styling
  const getDepartmentCardColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm';
      case 'BOH': return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm';
      case 'Bar': return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm';
      case 'Management': return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm';
      default: return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm';
    }
  };

  const getDepartmentRoleColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300 shadow-md';
      case 'BOH': return 'bg-gradient-to-r from-emerald-100 to-emerald-50 border-emerald-300 shadow-md';
      case 'Bar': return 'bg-gradient-to-r from-purple-100 to-purple-50 border-purple-300 shadow-md';
      case 'Management': return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300 shadow-md';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300 shadow-md';
    }
  };

  const getDepartmentIndicatorColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-blue-500 shadow-lg shadow-blue-500/30';
      case 'BOH': return 'bg-emerald-500 shadow-lg shadow-emerald-500/30';
      case 'Bar': return 'bg-purple-500 shadow-lg shadow-purple-500/30';
      case 'Management': return 'bg-amber-500 shadow-lg shadow-amber-500/30';
      default: return 'bg-gray-400 shadow-lg shadow-gray-400/30';
    }
  };

  const getDepartmentFilterStyle = (deptId, isSelected) => {
    if (isSelected) {
      switch (deptId) {
        case 'FOH': return 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30';
        case 'BOH': return 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30';
        case 'Bar': return 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/30';
        case 'Management': return 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/30';
        default: return 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30';
      }
    }
    return 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200';
  };

  // Event handlers
  const handleEmployeeClick = (roleIndex, shiftIndex) => {
    const employeeId = `${roleIndex}-${shiftIndex}`;
    setSelectedEmployee(selectedEmployee === employeeId ? null : employeeId);
  };

  const handleAddEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    
    const shift = shiftIndex === 0 ? 'AM' : 'PM';
    const shiftTimes = SHIFT_TIMES[shift] || { start: '9:00', end: '17:00' };

    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
    const currentAssignments = scheduleData[scheduleKey]?.employees || [];

    if (currentAssignments.find(emp => emp.id === employeeId)) {
      return;
    }

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
        const result = await saveSchedule(weekKey, scheduleData);
        console.log('Schedule saved successfully:', result);
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

  const handlePrintSchedule = () => {
    window.print();
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

  // NEW: Calculate total hours
  const getTotalHours = () => {
    return Object.values(scheduleData).reduce((total, day) => {
      const dayHours = (day.employees || []).reduce((dayTotal, emp) => {
        return dayTotal + (emp.hours || 0);
      }, 0);
      return total + dayHours;
    }, 0);
  };

  // NEW: Get coverage status
  const getCoverageStatus = () => {
    const totalSlots = filteredRoles.length * 2 * 7; // roles * shifts * days
    const filledSlots = getTotalAssignments();
    const percentage = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
    
    if (percentage >= 80) return { status: 'Good', color: 'emerald' };
    if (percentage >= 60) return { status: 'Fair', color: 'amber' };
    return { status: 'Low', color: 'red' };
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

  const coverageStatus = getCoverageStatus();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Better Stats */}
      <Card className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          {/* Top Row - Filters and Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-700">Department Filter:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { id: 'ALL', label: `ALL (${ROLES.length})` },
                  { id: 'FOH', label: `FOH (${getRolesByDepartment('FOH').length})` },
                  { id: 'BOH', label: `BOH (${getRolesByDepartment('BOH').length})` },
                  { id: 'Bar', label: `Bar (${getRolesByDepartment('Bar').length})` },
                  { id: 'Management', label: `Management (${getRolesByDepartment('Management').length})` }
                ].map(dept => (
                  <Button
                    key={dept.id}
                    size="sm"
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={`rounded-xl font-medium transition-all duration-200 ${getDepartmentFilterStyle(dept.id, selectedDepartment === dept.id)}`}
                  >
                    {dept.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-700">
                  Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}
                </span>
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <StatsCard 
              icon={User} 
              label="Available Employees" 
              value={filteredEmployees.length}
              color="blue"
            />
            <StatsCard 
              icon={Target} 
              label="Total Assignments" 
              value={getTotalAssignments()}
              subtext={`${Math.round(getTotalHours())} hours scheduled`}
              color="emerald"
            />
            <StatsCard 
              icon={Clock} 
              label="Total Hours" 
              value={`${Math.round(getTotalHours())}h`}
              subtext={`Avg ${getTotalAssignments() > 0 ? Math.round(getTotalHours() / getTotalAssignments()) : 0}h per assignment`}
              color="purple"
            />
            <StatsCard 
              icon={TrendingUp} 
              label="Coverage Status" 
              value={coverageStatus.status}
              subtext={`${Math.round((getTotalAssignments() / (filteredRoles.length * 2 * 7)) * 100)}% filled`}
              color={coverageStatus.color}
            />
          </div>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Header Row */}
      <div className="grid grid-cols-8 gap-4">
        <div className="col-span-1">
          <Card className="bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300 rounded-2xl shadow-md h-full">
            <CardContent className="p-4 text-center flex items-center justify-center h-full">
              <span className="font-bold text-slate-800 text-sm">Role / Shift</span>
            </CardContent>
          </Card>
        </div>
        {weekDays.map((day, index) => {
          const headerInfo = formatDateHeader(day);
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={index}>
              <Card className={`${isToday ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300' : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300'} rounded-2xl shadow-md`}>
                <CardContent className="p-4 text-center">
                  <div className={`font-bold text-xs ${isToday ? 'text-blue-800' : 'text-slate-800'}`}>{headerInfo.day}</div>
                  <div className={`text-xs mt-1 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>{headerInfo.date}</div>
                  {isToday && <div className="text-xs text-blue-500 font-medium mt-1">Today</div>}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Enhanced Schedule Rows */}
      <div className="space-y-4">
        {filteredRoles.map((role, roleIndex) => {
          const shifts = [
            { name: 'AM Shift', startTime: SHIFT_TIMES.AM.start, endTime: SHIFT_TIMES.AM.end },
            { name: 'PM Shift', startTime: SHIFT_TIMES.PM.start, endTime: SHIFT_TIMES.PM.end }
          ];
          return shifts.map((shift, shiftIndex) => {
            const employeeId = `${roleIndex}-${shiftIndex}`;
            const isSelected = selectedEmployee === employeeId;
            const shiftHours = calculateHours(formatTime(shift.startTime), formatTime(shift.endTime));

            return (
              <div key={employeeId} className="grid grid-cols-8 gap-4 items-stretch">
                {/* Enhanced Role / Shift Card */}
                <div className="col-span-1 flex">
                  <Card
                    className={`${getDepartmentRoleColor(role.department)} flex-1 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-yellow-400 shadow-xl scale-105' : ''
                    }`}
                    onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center space-y-2">
                      <div className={`w-4 h-4 rounded-full ${getDepartmentIndicatorColor(role.department)}`}></div>
                      <div className="font-bold text-slate-900 text-sm">{role.name}</div>
                      <div className="text-slate-700 text-xs font-medium">{shift.name}</div>
                      <div className="text-slate-900 text-xs font-semibold bg-white/50 px-2 py-1 rounded-lg">
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </div>
                      <div className="text-slate-600 text-xs">
                        {shiftHours}h shift
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Day Cards */}
                {weekDays.map((day, dayIndex) => {
                  const assignedEmployees = getAssignedEmployees(roleIndex, shiftIndex, dayIndex);
                  const dropdownKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={dayIndex} className="col-span-1 flex">
                      <Card
                        className={`${getDepartmentCardColor(role.department)} flex-1 rounded-2xl transition-all duration-200 min-h-[140px] ${
                          isToday ? 'ring-2 ring-blue-300' : ''
                        }`}
                      >
                        <CardContent className="p-3 flex flex-col justify-between h-full space-y-2">
                          
                          {/* Enhanced Assigned Employees Section */}
                          <div className="space-y-2 flex-1">
                            {assignedEmployees.length > 0 ? (
                              assignedEmployees.map((emp, empIndex) => (
                                <div key={empIndex} className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-white/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-bold text-slate-900 truncate">
                                        {emp.name}
                                      </div>
                                      <div className="text-xs text-slate-600 font-medium">
                                        {emp.role}
                                      </div>
                                      <div className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        <span className="font-semibold">{emp.hours}h</span>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveEmployee(roleIndex, shiftIndex, dayIndex, emp.id)}
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="flex-1 flex items-center justify-center">
                                <div className="relative">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)}
                                    className="text-slate-600 hover:text-slate-900 hover:bg-white/70 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 transition-all duration-200 px-4 py-2"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Employee
                                  </Button>
                                  
                                  {/* Enhanced Employee Dropdown */}
                                  {showDropdown === dropdownKey && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto backdrop-blur-sm">
                                      {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map(employee => (
                                          <button
                                            key={employee.id}
                                            onClick={() => handleAddEmployee(roleIndex, shiftIndex, dayIndex, employee.id)}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                                          >
                                            <div className="font-semibold">{employee.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center justify-between">
                                              <span>{employee.role}</span>
                                              <span className="font-medium">${employee.hourly_rate}/hr</span>
                                            </div>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                          No employees available
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Department Badge */}
                          <div className="flex justify-center">
                            <Badge variant={role.department.toLowerCase()}>{role.department}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            );
          });
        })}
      </div>

      {/* Enhanced Action Buttons */}
      <Card className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {getTotalAssignments() > 0 && (
                <div className="space-y-1">
                  <div>Total assignments: <strong>{getTotalAssignments()}</strong></div>
                  <div>Total hours: <strong>{Math.round(getTotalHours())}h</strong></div>
                  <div>Coverage: <strong>{Math.round((getTotalAssignments() / (filteredRoles.length * 2 * 7)) * 100)}%</strong></div>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePrintSchedule}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print / Export
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={!hasUnsavedChanges}
                className={`rounded-xl transition-all duration-200 shadow-lg ${
                  hasUnsavedChanges 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Save className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? 'Save Schedule' : 'No Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Selected Employee Indicator */}
      {selectedEmployee && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/30"></div>
              <span className="font-semibold text-yellow-900 text-sm">
                Currently editing: {filteredRoles[parseInt(selectedEmployee.split('-')[0])]?.name} –
                {selectedEmployee.split('-')[1] === '0' ? 'AM Shift' : 'PM Shift'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmployee(null)}
                className="ml-auto border-yellow-400 text-yellow-800 hover:bg-yellow-100 rounded-xl transition-all duration-200"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
