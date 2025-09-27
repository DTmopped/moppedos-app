import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Save, FileText, Settings, Users, Clock, 
  ChevronLeft, ChevronRight, Filter, Download, AlertCircle
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Clean Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded";
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

// Date utilities
const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  return start;
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

// Fixed time formatting function
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  let hours, minutes;
  
  if (timeString.includes(':')) {
    [hours, minutes] = timeString.split(':');
  } else {
    return timeString;
  }
  
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

  // Department colors matching the overview cards
  const getDepartmentRowColor = (department) => {
    switch(department) {
      case 'FOH': return 'bg-blue-50/60';
      case 'BOH': return 'bg-emerald-50/60';
      case 'Bar': return 'bg-purple-50/60';
      case 'Management': return 'bg-slate-50/60';
      default: return 'bg-gray-50/60';
    }
  };

  // Department colors for left column - matching
  const getDepartmentLeftColumnColor = (department) => {
    switch(department) {
      case 'FOH': return 'bg-blue-50/60 border-l-4 border-blue-400';
      case 'BOH': return 'bg-emerald-50/60 border-l-4 border-emerald-400';
      case 'Bar': return 'bg-purple-50/60 border-l-4 border-purple-400';
      case 'Management': return 'bg-slate-50/60 border-l-4 border-slate-400';
      default: return 'bg-gray-50/60 border-l-4 border-gray-400';
    }
  };

  // Department indicator dots
  const getDepartmentIndicatorColor = (department) => {
    switch(department) {
      case 'FOH': return 'bg-blue-500';
      case 'BOH': return 'bg-emerald-500';
      case 'Bar': return 'bg-purple-500';
      case 'Management': return 'bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  // Department filter styling
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

      {/* Schedule Grid with perfect alignment */}
      <Card className="bg-white border border-slate-200 shadow-lg">
        <div className="relative overflow-hidden">
          {/* Sticky Header Row - Properly aligned with content */}
          <div className="sticky top-0 z-20 bg-white border-b-2 border-slate-300 shadow-sm">
            <div className="grid grid-cols-8 gap-0">
              <div className="bg-slate-200 p-3 font-semibold text-slate-800 border-r-2 border-slate-300 sticky left-0 z-30 w-[220px] flex items-center justify-center">
                <div className="bg-white rounded-lg p-2 shadow-sm text-center">
                  <span className="text-sm">Role / Shift</span>
                </div>
              </div>
              {weekDays.map((day, index) => {
                const headerInfo = formatDateHeader(day);
                return (
                  <div key={index} className="bg-slate-200 p-3 border-r border-slate-300 last:border-r-0 w-[220px] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-2 shadow-sm text-center">
                      <div className="font-semibold text-slate-800 text-sm">
                        {headerInfo.day},
                      </div>
                      <div className="text-slate-600 text-xs">
                        {headerInfo.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Schedule Body with perfect alignment */}
          <div className="max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-slate-200">
              {filteredRoles.map((role, roleIndex) => {
                const shifts = [
                  { name: 'AM Shift', startTime: '9:00', endTime: '5:00' },
                  { name: 'PM Shift', startTime: '3:00', endTime: '11:00' }
                ];

                return shifts.map((shift, shiftIndex) => {
                  const employeeId = `${roleIndex}-${shiftIndex}`;
                  const isSelected = selectedEmployee === employeeId;
                  
                  return (
                    <div 
                      key={employeeId}
                      className={`grid grid-cols-8 gap-0 transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-yellow-400 ring-inset shadow-lg' : ''
                      } ${getDepartmentRowColor(role.department)}`}
                    >
                      {/* Sticky Role/Shift Column - SHORTER and CENTERED */}
                      <div className={`sticky left-0 border-r-2 border-slate-300 z-10 w-[220px] h-[90px] flex items-center justify-center p-2 ${getDepartmentLeftColumnColor(role.department)}`}>
                        <div 
                          className="cursor-pointer group w-full"
                          onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                        >
                          <div className="bg-white rounded-lg p-2 shadow-sm">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getDepartmentIndicatorColor(role.department)} group-hover:scale-110 transition-transform`}></div>
                              <div className="text-center flex-1">
                                <div className="font-semibold text-slate-900 text-sm group-hover:text-slate-800">{role.name}</div>
                                <div className="text-slate-700 text-xs">{shift.name}</div>
                                <div className="text-slate-900 text-xs font-medium mt-1">
                                  {formatTime(`${shift.startTime}:00`)} - {formatTime(`${shift.endTime}:00`)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Day Columns - MATCHING WIDTH and ALIGNMENT */}
                      {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className={`border-r border-slate-200 last:border-r-0 w-[220px] h-[90px] flex items-center justify-center p-2 ${isSelected ? 'bg-yellow-100/50' : ''}`}>
                          <div className="space-y-2 w-full">
                            {/* Employee Name Input - MATCHING WIDTH */}
                            <div className="bg-white rounded-lg p-2 shadow-sm w-full">
                              <input
                                type="text"
                                placeholder="Employee Name"
                                className="w-full border-0 outline-none text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent text-center"
                                onChange={(e) => updateScheduleData(roleIndex, shiftIndex, dayIndex, 'employee', e.target.value)}
                              />
                            </div>
                            
                            {/* Time Display - SINGLE ROW, MATCHING WIDTH */}
                            <div className="bg-white rounded-lg p-2 shadow-sm w-full">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1 text-xs text-slate-900 font-semibold">
                                  <Clock className="h-3 w-3 text-slate-600" />
                                  <span>
                                    {formatTime(`${shift.startTime}:00`)} - {formatTime(`${shift.endTime}:00`)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Department Badge */}
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

      {/* Selected Employee Info - YELLOW HIGHLIGHT FUNCTIONALITY */}
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
