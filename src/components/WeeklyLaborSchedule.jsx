import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle, Plus, X, User
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment, SHIFT_TIMES } from '@/config/laborScheduleConfig';

// Badge Component (keeping your exact design)
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg";
  const variantClasses = {
    default: "bg-white text-slate-700 border border-slate-300",
    foh: "bg-white text-blue-700 border border-blue-300",
    boh: "bg-white text-emerald-700 border border-emerald-300",
    bar: "bg-white text-purple-700 border border-purple-300",
    management: "bg-white text-slate-700 border border-slate-300"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Utility functions (keeping your exact functions)
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

const formatTime = (timeString) => {
  if (!timeString) return '';
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

const WeeklyLaborSchedule = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fixed context usage with proper error handling
  const contextData = useLaborData();
  const employees = contextData?.employees || [];
  const loading = contextData?.loading || false;
  const error = contextData?.error || null;
  const saveSchedule = contextData?.saveSchedule;

  console.log('Context data:', contextData);
  console.log('Employees:', employees);
  console.log('Employees length:', employees.length);
  
  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const filteredRoles = ROLES.filter(
    role => selectedDepartment === 'ALL' || role.department === selectedDepartment
  );

  // Fixed employee filtering
  const getFilteredEmployees = () => {
    if (!employees || !Array.isArray(employees)) {
      console.log('No employees array available');
      return [];
    }

    let filtered = employees.filter(emp => emp.is_active !== false);
    
    if (selectedDepartment !== 'ALL') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    
    console.log(`Filtered employees for ${selectedDepartment}:`, filtered);
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  // Your exact color functions (preserved)
  const getDepartmentCardColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-blue-100 border-blue-300';
      case 'BOH': return 'bg-emerald-100 border-emerald-300';
      case 'Bar': return 'bg-purple-100 border-purple-300';
      case 'Management': return 'bg-slate-100 border-slate-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getDepartmentRoleColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-blue-100 border-blue-300';
      case 'BOH': return 'bg-emerald-100 border-emerald-300';
      case 'Bar': return 'bg-purple-100 border-purple-300';
      case 'Management': return 'bg-slate-100 border-slate-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getDepartmentIndicatorColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-blue-500';
      case 'BOH': return 'bg-emerald-500';
      case 'Bar': return 'bg-purple-500';
      case 'Management': return 'bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  const getDepartmentFilterStyle = (deptId, isSelected) => {
    if (isSelected) {
      switch (deptId) {
        case 'FOH': return 'bg-blue-600 text-white border-blue-600';
        case 'BOH': return 'bg-emerald-600 text-white border-emerald-600';
        case 'Bar': return 'bg-purple-600 text-white border-purple-600';
        case 'Management': return 'bg-slate-600 text-white border-slate-600';
        default: return 'bg-blue-600 text-white border-blue-600';
      }
    }
    return 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';
  };

  // Event handlers
  const handleEmployeeClick = (roleIndex, shiftIndex) => {
    const employeeId = `${roleIndex}-${shiftIndex}`;
    setSelectedEmployee(selectedEmployee === employeeId ? null : employeeId);
  };

const handleAddEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
  const employee = employees.find(emp => emp.id === employeeId);
  if (!employee) return;

  // FIX: Use the actual role from the full ROLES array, not filtered
  const actualRole = filteredRoles[roleIndex];
  const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
  
  const shift = shiftIndex === 0 ? 'AM' : 'PM';
  const shiftTimes = SHIFT_TIMES[shift] || { start: '9:00', end: '17:00' };

  // FIX: Use the actual role index for the schedule key
  const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
  const currentAssignments = scheduleData[scheduleKey]?.employees || [];

  // Check if employee is already assigned
  if (currentAssignments.find(emp => emp.id === employeeId)) {
    return;
  }

  const newEmployee = {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    hourly_rate: employee.hourly_rate,
    start: shiftTimes.start,
    end: shiftTimes.end
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
  console.log('Employee assigned to actual role index:', actualRoleIndex, newEmployee);
};


  const handleRemoveEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
    const scheduleKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
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
        console.log('Schedule saved successfully');
      } else {
        localStorage.setItem('weeklyLaborSchedule', JSON.stringify(scheduleData));
      }
      
      setHasUnsavedChanges(false);
      alert('Schedule saved successfully!');
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
  // FIX: Use actual role index when in filtered view
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

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Stats */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Filter className="h-4 w-4 text-slate-600" />
                <span className="font-medium text-slate-700">Department Filter:</span>
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
                    className={`rounded-lg ${getDepartmentFilterStyle(dept.id, selectedDepartment === dept.id)}`}
                  >
                    {dept.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium text-slate-700">
                Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}
              </span>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Live Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-slate-600">Available Employees:</span>
                <span className="font-semibold text-slate-900">{filteredEmployees.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="text-slate-600">Total Assignments:</span>
                <span className="font-semibold text-slate-900">{getTotalAssignments()}</span>
              </div>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Unsaved Changes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header Row */}
      <div className="grid grid-cols-8 gap-3">
        <div className="col-span-1">
          <Card className="bg-slate-100 border-slate-300 rounded-xl shadow-sm h-full">
            <CardContent className="p-4 text-center">
              <span className="font-semibold text-slate-800 text-sm">Role / Shift</span>
            </CardContent>
          </Card>
        </div>
        {weekDays.map((day, index) => {
          const headerInfo = formatDateHeader(day);
          return (
            <div key={index}>
              <Card className="bg-slate-100 border-slate-300 rounded-xl shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="font-semibold text-slate-800 text-xs">{headerInfo.day}</div>
                  <div className="text-slate-600 text-xs mt-1">{headerInfo.date}</div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Schedule Rows */}
      <div className="space-y-6">
        {filteredRoles.map((role, roleIndex) => {
          const shifts = [
            { name: 'AM Shift', startTime: SHIFT_TIMES.AM.start, endTime: SHIFT_TIMES.AM.end },
            { name: 'PM Shift', startTime: SHIFT_TIMES.PM.start, endTime: SHIFT_TIMES.PM.end }
          ];
          return shifts.map((shift, shiftIndex) => {
            const employeeId = `${roleIndex}-${shiftIndex}`;
            const isSelected = selectedEmployee === employeeId;

            return (
              <div key={employeeId} className="grid grid-cols-8 gap-3 items-stretch">
                {/* Role / Shift */}
                <div className="col-span-1 flex">
                  <Card
                    className={`${getDepartmentRoleColor(role.department)} flex-1 rounded-xl shadow-sm cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-yellow-400 shadow-lg' : ''
                    }`}
                    onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center space-y-1">
                      <div className={`w-3 h-3 rounded-full ${getDepartmentIndicatorColor(role.department)}`}></div>
                      <div className="font-semibold text-slate-900 text-xs">{role.name}</div>
                      <div className="text-slate-700 text-xs">{shift.name}</div>
                      <div className="text-slate-900 text-xs font-medium">
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Day Cards */}
                {weekDays.map((day, dayIndex) => {
                  const assignedEmployees = getAssignedEmployees(roleIndex, shiftIndex, dayIndex);
                  const dropdownKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                  
                  return (
                    <div key={dayIndex} className="col-span-1 flex">
                      <Card
                        className={`${getDepartmentCardColor(role.department)} flex-1 rounded-xl shadow-sm ${
                          isSelected ? 'ring-2 ring-yellow-400 shadow-lg' : ''
                        }`}
                      >
                        <CardContent className="p-3 flex flex-col justify-between h-full space-y-2">
                          {/* Assigned Employees */}
                          {assignedEmployees.map((employee) => (
                            <div key={employee.id} className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 group relative">
                              <div className="text-xs font-medium text-slate-900 text-center truncate">
                                {employee.name}
                              </div>
                              <div className="text-xs text-slate-600 text-center">
                                ${employee.hourly_rate}/hr
                              </div>
                              <button
                                onClick={() => handleRemoveEmployee(roleIndex, shiftIndex, dayIndex, employee.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </div>
                          ))}
                          
                          {/* Add Employee Button */}
                          <div className="relative">
                            <button
                              onClick={() => setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)}
                              className="w-full bg-white rounded-lg p-2 shadow-sm border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center space-x-1"
                            >
                              <Plus className="h-3 w-3 text-slate-600" />
                              <span className="text-xs text-slate-600 font-medium">Add Employee</span>
                            </button>
                            
                            {/* Employee Dropdown */}
                            {showDropdown === dropdownKey && (
                              <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-300 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1">
                                {filteredEmployees.length > 0 ? (
                                  filteredEmployees.map((employee) => {
                                    const isAssigned = assignedEmployees.find(emp => emp.id === employee.id);
                                    return (
                                      <button
                                        key={employee.id}
                                        onClick={() => !isAssigned && handleAddEmployee(roleIndex, shiftIndex, dayIndex, employee.id)}
                                        disabled={isAssigned}
                                        className={`w-full text-left px-3 py-2 text-xs border-b border-slate-100 last:border-b-0 transition-colors ${
                                          isAssigned 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                            : 'hover:bg-slate-50 cursor-pointer'
                                        }`}
                                      >
                                        <div className="font-medium">{employee.name}</div>
                                        <div className="text-slate-500">{employee.role} - {employee.department}</div>
                                        <div className="text-slate-400">${employee.hourly_rate}/hr {isAssigned && '(Assigned)'}</div>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-3 py-2 text-xs text-slate-500 text-center">
                                    No employees available{selectedDepartment !== 'ALL' ? ` in ${selectedDepartment}` : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Time Display */}
                          <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-center space-x-1 text-xs text-slate-900 font-semibold">
                              <Clock className="h-3 w-3 text-slate-600" />
                              <span>{formatTime(shift.startTime)}</span>
                              <span>–</span>
                              <span>{formatTime(shift.endTime)}</span>
                            </div>
                          </div>
                          
                          {/* Badge */}
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {getTotalAssignments() > 0 && (
            <span>Total assignments: <strong>{getTotalAssignments()}</strong></span>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handlePrintSchedule}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Print / PDF
          </Button>
          <Button
            onClick={handleSaveSchedule}
            disabled={!hasUnsavedChanges}
            className={`rounded-lg ${
              hasUnsavedChanges 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {hasUnsavedChanges ? 'Save Schedule' : 'No Changes'}
          </Button>
        </div>
      </div>

      {/* Selected Employee Indicator */}
      {selectedEmployee && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-yellow-900 text-sm">
                Currently editing: {filteredRoles[parseInt(selectedEmployee.split('-')[0])]?.name} –
                {selectedEmployee.split('-')[1] === '0' ? 'AM Shift' : 'PM Shift'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmployee(null)}
                className="ml-auto border-yellow-400 text-yellow-800 hover:bg-yellow-100 rounded-lg"
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


