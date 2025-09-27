import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Badge Component
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

// Utilities
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

  const { loading, error } = useLaborData();
  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const filteredRoles = ROLES.filter(
    role => selectedDepartment === 'ALL' || role.department === selectedDepartment
  );

  const getDepartmentCardColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-blue-50 border-blue-200';
      case 'BOH': return 'bg-emerald-50 border-emerald-200';
      case 'Bar': return 'bg-purple-50 border-purple-200';
      case 'Management': return 'bg-slate-50 border-slate-200';
      default: return 'bg-gray-50 border-gray-200';
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
    <div className="space-y-8">
      {/* Filter + Week Nav */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
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
            { name: 'AM Shift', startTime: '9:00', endTime: '17:00' },
            { name: 'PM Shift', startTime: '15:00', endTime: '23:00' }
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
                        {formatTime(`${shift.startTime}:00`)} – {formatTime(`${shift.endTime}:00`)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Day Cards */}
                {weekDays.map((day, dayIndex) => (
                  <div key={dayIndex} className="col-span-1 flex">
                    <Card
                      className={`${getDepartmentCardColor(role.department)} flex-1 rounded-xl shadow-sm ${
                        isSelected ? 'ring-2 ring-yellow-400 shadow-lg' : ''
                      }`}
                    >
                      <CardContent className="p-3 flex flex-col justify-between h-full">
                        {/* Name input */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
                          <input
                            type="text"
                            placeholder="Employee Name"
                            className="w-full border-0 outline-none text-xs font-medium text-slate-900 placeholder-slate-400 bg-transparent text-center"
                            onChange={(e) =>
                              updateScheduleData(roleIndex, shiftIndex, dayIndex, 'employee', e.target.value)
                            }
                          />
                        </div>
                        {/* Time inline */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 mt-2">
                          <div className="flex items-center justify-center space-x-1 text-xs text-slate-900 font-semibold">
                            <Clock className="h-3 w-3 text-slate-600" />
                            <span>{formatTime(`${shift.startTime}:00`)}</span>
                            <span>–</span>
                            <span>{formatTime(`${shift.endTime}:00`)}</span>
                          </div>
                        </div>
                        {/* Badge */}
                        <div className="flex justify-center pt-1">
                          <Badge variant={role.department.toLowerCase()}>{role.department}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            );
          });
        })}
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Schedule
        </Button>
      </div>

      {/* Selected Employee */}
      {selectedEmployee && (
        <Card className="border-yellow-300 bg-yellow-50 shadow-sm rounded-xl">
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
    </div>
  );
};

export default WeeklyLaborSchedule;

