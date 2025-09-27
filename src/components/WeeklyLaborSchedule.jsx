import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Save, FileText, Settings, Users, Clock, 
  ChevronLeft, ChevronRight, Filter, Download, AlertCircle
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Clean Badge Component matching department cards
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-semibold rounded";
  const variantClasses = {
    default: "bg-slate-100 text-slate-800",
    foh: "bg-blue-100 text-blue-800",
    boh: "bg-emerald-100 text-emerald-800", 
    bar: "bg-purple-100 text-purple-800",
    management: "bg-slate-100 text-slate-800"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Date utilities
const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  return start;
};

const formatDate = (date) => {
  if (!date || !(date instanceof Date)) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'numeric', 
    day: 'numeric' 
  });
};

const formatDateHeader = (date) => {
  if (!date || !(date instanceof Date)) {
    return { day: 'Invalid', date: 'Date' };
  }
  const formatted = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'numeric', 
    day: 'numeric' 
  });
  const parts = formatted.split(', ');
  return {
    day: parts[0] || 'Day',
    date: parts[1] || 'Date'
  };
};

// Format time to AM/PM with BLACK text
const formatTime = (time) => {
  if (!time || typeof time !== 'string') {
    return 'Invalid Time';
  }
  const timeParts = time.split(':');
  if (timeParts.length !== 2) {
    return time;
  }
  const [hours, minutes] = timeParts;
  const hour = parseInt(hours);
  if (isNaN(hour)) {
    return time;
  }
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const WeeklyLaborSchedule = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});

  const { employees, loading, error } = useLaborData();

  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const filteredRoles = ROLES.filter(role => 
    selectedDepartment === 'ALL' || role.department === selectedDepartment
  );

  // Department colors matching the overview cards - colored borders with white interiors
  const getDepartmentRowColor = (department) => {
    switch(department) {
      case 'FOH': return 'bg-white border-l-4 border-blue-400';
      case 'BOH': return 'bg-white border-l-4 border-emerald-400';
      case 'Bar': return 'bg-white border-l-4 border-purple-400';
      case 'Management': return 'bg-white border-l-4 border-slate-400';
      default: return 'bg-white border-l-4 border-gray-300';
    }
  };

  // Department indicator colors for the dots
  const getDepartmentIndicatorColor = (department) => {
    switch(department) {
      case 'FOH': return 'bg-blue-500';
      case 'BOH': return 'bg-emerald-500';
      case 'Bar': return 'bg-purple-500';
      case 'Management': return 'bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  // Department filter button styling
  const getDepartmentFilterStyle = (deptId, isSelected) => {
    if (isSelected) {
      switch(deptId) {
        case 'FOH': return 'bg-blue-600 text-white border-blue-600';
        case 'BOH': return 'bg-emerald-600 text-white border-emerald-600';
        case 'Bar': return 'bg-purple-600 text-white border-purple-600';
        case 'Management': return 'bg-slate-600 text-white border-slate-600';
        default: return 'bg-blue-600 text-white border-blue-600';
      }
    }
    return 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';
  };

  const handleEmployeeClick = (roleIndex, shiftIndex) => {
    const employeeId = `${roleIndex}-${shiftIndex}`;
    setSelectedEmployee(selectedEmployee === employeeId ? null : employeeId);
  };

  const updateScheduleData = (roleIndex, shiftIndex, dayIndex, field, value) => {
    const key = `${roleIndex}-${shiftIndex}-${dayIndex}`;
    setScheduleData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = () => {
    try {
      localStorage.setItem('weeklyLaborSchedule', JSON.stringify(scheduleData));
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
    <div className="space-y-6">
      {/* Department Filter and Week Navigation */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
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
                    className={getDepartmentFilterStyle(dept.id, selectedDepartment === dept.id)}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateWeek(1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Schedule Grid with MUCH BIGGER cells */}
      <Card className="bg-white border border-slate-200 shadow-lg">
        <div className="relative overflow-hidden">
          {/* Sticky Header Row */}
          <div className="sticky top-0 z-20 bg-white border-b-2 border-slate-300 shadow-sm">
            <div className="grid grid-cols-8 gap-0">
              <div className="bg-slate-100 p-6 font-semibold text-slate-700 text-lg border-r-2 border-slate-300 sticky left-0 z-30">
                Role / Shift
              </div>
              {weekDays.map((day, index) => {
                const headerInfo = formatDateHeader(day);
                return (
                  <div key={index} className="bg-emerald-50 p-6 text-center border-r border-slate-200 last:border-r-0">
                    <div className="font-semibold text-slate-700 text-lg">
                      {headerInfo.day},
                    </div>
                    <div className="text-slate-600 text-base">
                      {headerInfo.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Schedule Body with MUCH BIGGER cells */}
          <div className="max-h-[700px] overflow-y-auto">
            <div className="divide-y divide-slate-200">
              {filteredRoles.map((role, roleIndex) => {
                const shifts = role.shifts || [
                  { name: 'AM Shift', startTime: '09:00', endTime: '17:00' },
                  { name: 'PM Shift', startTime: '15:00', endTime: '23:00' }
                ];

                return shifts.map((shift, shiftIndex) => {
                  const isSelected = selectedEmployee === `${roleIndex}-${shiftIndex}`;
                  
                  return (
                    <div 
                      key={`${roleIndex}-${shiftIndex}`}
                      className={`grid grid-cols-8 gap-0 transition-all duration-200 ${
                        isSelected ? 'bg-yellow-100 ring-2 ring-yellow-400 ring-inset' : 'hover:bg-slate-50'
                      } ${getDepartmentRowColor(role.department)}`}
                    >
                      {/* Sticky Role/Shift Column - BIGGER */}
                      <div className="sticky left-0 bg-white p-8 border-r-2 border-slate-300 z-10 min-w-[240px]">
                        <div 
                          className="cursor-pointer group"
                          onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-5 h-5 rounded-full ${getDepartmentIndicatorColor(role.department)} group-hover:scale-110 transition-transform`}></div>
                            <div>
                              <div className="font-bold text-slate-900 text-lg group-hover:text-slate-800">{role.name}</div>
                              <div className="text-slate-700 text-base font-medium">{shift.name}</div>
                              <div className="text-slate-900 text-base font-semibold mt-2">
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Day Columns - MUCH BIGGER cells */}
                      {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className="p-6 border-r border-slate-200 last:border-r-0 min-h-[160px] bg-white">
                          <div className="space-y-4">
                            {/* BIGGER Employee Name Input */}
                            <input
                              type="text"
                              placeholder="Employee Name"
                              className="w-full p-4 border-2 border-slate-300 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white placeholder-slate-400"
                              onChange={(e) => updateScheduleData(roleIndex, shiftIndex, dayIndex, 'employee', e.target.value)}
                            />
                            
                            {/* Time Display - BLACK text, larger */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center space-x-2 text-base text-slate-900 font-semibold">
                                <Clock className="h-5 w-5 text-slate-600" />
                                <span>
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Department Badge - Larger */}
                            <div className="flex justify-center">
                              <Badge variant={role.department.toLowerCase()}>
                                {role.department}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={handlePrintSchedule}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Print / PDF
        </Button>
        <Button 
          onClick={handleSaveSchedule}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Schedule
        </Button>
      </div>

      {/* Selected Employee Info */}
      {selectedEmployee && (
        <Card className="border-yellow-300 bg-yellow-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-yellow-900 text-sm">
                Currently editing: {filteredRoles[parseInt(selectedEmployee.split('-')[0])]?.name} - 
                {selectedEmployee.split('-')[1] === '0' ? 'AM Shift' : 'PM Shift'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedEmployee(null)}
                className="ml-auto border-yellow-400 text-yellow-800 hover:bg-yellow-100"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklyLaborSchedule;
