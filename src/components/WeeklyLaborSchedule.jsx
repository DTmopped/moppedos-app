import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

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
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>
  );
};

const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  return start;
};

const formatDateHeader = (date) => {
  if (!date || !(date instanceof Date)) return { day: 'Invalid', date: 'Date' };
  const formatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' });
  const parts = formatted.split(', ');
  return { day: parts[0] || 'Day', date: parts[1] || 'Date' };
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes || '00'} ${ampm}`;
};

const WeeklyLaborSchedule = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});

  const { loading, error } = useLaborData();
  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.setDate(weekStart.getDate() + i)));

  const filteredRoles = ROLES.filter(role => selectedDepartment === 'ALL' || role.department === selectedDepartment);

  const handleEmployeeClick = (roleIndex, shiftIndex) => {
    const employeeId = `${roleIndex}-${shiftIndex}`;
    setSelectedEmployee(selectedEmployee === employeeId ? null : employeeId);
  };

  const updateScheduleData = (roleIndex, shiftIndex, dayIndex, field, value) => {
    const key = `${roleIndex}-${shiftIndex}-${dayIndex}`;
    setScheduleData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
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

  const handlePrintSchedule = () => window.print();

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  if (loading) return <div className="p-6 text-center">Loading schedule...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header Filter Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-slate-600" />
          {['ALL', 'FOH', 'BOH', 'Bar', 'Management'].map(id => (
            <Button
              key={id}
              size="sm"
              onClick={() => setSelectedDepartment(id)}
              className={`rounded-lg ${selectedDepartment === id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
            >
              {id}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <span className="font-medium text-slate-700">
            Week of {formatDateHeader(getStartOfWeek(currentWeek)).day}, {formatDateHeader(getStartOfWeek(currentWeek)).date}
          </span>
          <div className="flex space-x-1">
            <Button size="sm" onClick={() => navigateWeek(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => navigateWeek(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Header Days */}
      <div className="grid grid-cols-8 gap-3">
        <div className="col-span-1 text-center font-semibold text-sm">Role / Shift</div>
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-center text-sm">
            <div>{formatDateHeader(day).day}</div>
            <div className="text-xs text-slate-500">{formatDateHeader(day).date}</div>
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="space-y-4">
        {filteredRoles.map((role, roleIndex) => (
          ['AM Shift', 'PM Shift'].map((shiftName, shiftIndex) => {
            const start = shiftName === 'AM Shift' ? '9:00' : '15:00';
            const end = shiftName === 'AM Shift' ? '17:00' : '23:00';
            return (
              <div key={`${roleIndex}-${shiftIndex}`} className="grid grid-cols-8 gap-3">
                <div className="col-span-1">
                  <Card className="h-full bg-slate-100 p-2 text-xs text-center">
                    <div className="font-semibold">{role.name}</div>
                    <div>{shiftName}</div>
                    <div>{formatTime(`${start}:00`)} – {formatTime(`${end}:00`)}</div>
                  </Card>
                </div>
                {weekDays.map((_, dayIndex) => (
                  <div key={dayIndex} className="col-span-1">
                    <Card className="h-full p-2 text-xs">
                      <input
                        type="text"
                        placeholder="Employee Name"
                        className="w-full text-xs mb-1 border rounded px-1"
                        onChange={e => updateScheduleData(roleIndex, shiftIndex, dayIndex, 'employee', e.target.value)}
                      />
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-slate-600" />
                        <span>{formatTime(`${start}:00`)}</span>
                        <span>–</span>
                        <span>{formatTime(`${end}:00`)}</span>
                      </div>
                      <div className="mt-1 text-center">
                        <Badge variant={role.department.toLowerCase()}>{role.department}</Badge>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            );
          })
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button onClick={handlePrintSchedule} variant="outline"><FileText className="h-4 w-4 mr-2" />Print / PDF</Button>
        <Button onClick={handleSaveSchedule} className="bg-emerald-600 text-white"><Save className="h-4 w-4 mr-2" />Save</Button>
      </div>
    </div>
  );
};

export default WeeklyLaborSchedule;

