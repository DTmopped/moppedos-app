import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Filter, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

const Badge = ({ children, variant = "default" }) => {
  const base = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg";
  const colors = {
    default: "bg-white text-slate-700 border border-slate-300",
    foh: "bg-white text-blue-700 border border-blue-300",
    boh: "bg-white text-emerald-700 border border-emerald-300",
    bar: "bg-white text-purple-700 border border-purple-300",
    management: "bg-white text-slate-700 border border-slate-300"
  };
  return <span className={`${base} ${colors[variant]}`}>{children}</span>;
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
  const [weekday, dateStr] = date.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' }).split(', ');
  return { day: weekday, date: dateStr };
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, min = '00'] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${min} ${ampm}`;
};

const WeeklyLaborSchedule = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const { employees, loading, error } = useLaborData();

  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const filteredRoles = ROLES.filter(role => selectedDepartment === 'ALL' || role.department === selectedDepartment);

  const handleEmployeeClick = (roleIdx, shiftIdx) => {
    const id = `${roleIdx}-${shiftIdx}`;
    setSelectedEmployee(selectedEmployee === id ? null : id);
  };

  const updateScheduleData = (roleIdx, shiftIdx, dayIdx, field, val) => {
    const key = `${roleIdx}-${shiftIdx}-${dayIdx}`;
    setScheduleData(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const handlePrint = () => window.print();
  const navigateWeek = (dir) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (dir * 7));
    setCurrentWeek(newWeek);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-600" />
          {[{ id: 'ALL' }, { id: 'FOH' }, { id: 'BOH' }, { id: 'Bar' }, { id: 'Management' }].map(dept => (
            <Button key={dept.id} size="sm" onClick={() => setSelectedDepartment(dept.id)}>
              {dept.id}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigateWeek(-1)}><ChevronLeft /></Button>
          <span className="font-semibold">Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}</span>
          <Button onClick={() => navigateWeek(1)}><ChevronRight /></Button>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-8 gap-2">
        <div className="col-span-1" />
        {weekDays.map((day, idx) => {
          const h = formatDateHeader(day);
          return (
            <Card key={idx} className="text-center">
              <CardContent>
                <div className="text-xs font-semibold">{h.day}</div>
                <div className="text-xs text-slate-500">{h.date}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grid */}
      {filteredRoles.map((role, roleIdx) => (
        ['AM', 'PM'].map((shiftName, shiftIdx) => (
          <div key={`${roleIdx}-${shiftIdx}`} className="grid grid-cols-8 gap-2 items-stretch">
            {/* Left: Role Info */}
            <Card className="col-span-1 cursor-pointer" onClick={() => handleEmployeeClick(roleIdx, shiftIdx)}>
              <CardContent className="p-2 text-center">
                <div className="text-xs font-semibold">{role.name}</div>
                <div className="text-xs text-slate-500">{shiftName} Shift</div>
                <div className="text-xs">{shiftName === 'AM' ? '9:00 AM – 5:00 PM' : '3:00 PM – 11:00 PM'}</div>
              </CardContent>
            </Card>

            {/* Right: Daily Cells */}
            {weekDays.map((_, dayIdx) => {
              const k = `${roleIdx}-${shiftIdx}-${dayIdx}`;
              const data = scheduleData[k] || {};
              return (
                <Card key={k} className="col-span-1">
                  <CardContent className="p-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Employee Name"
                      value={data.employee || ''}
                      onChange={e => updateScheduleData(roleIdx, shiftIdx, dayIdx, 'employee', e.target.value)}
                      className="w-full text-xs text-center border border-slate-300 rounded px-2 py-1"
                    />
                    <div className="flex items-center justify-center space-x-1 text-xs text-slate-700">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{shiftName === 'AM' ? '9:00 AM – 5:00 PM' : '3:00 PM – 11:00 PM'}</span>
                    </div>
                    <div className="flex justify-center">
                      <Badge variant={role.department.toLowerCase()}>{role.department}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      ))}

      {/* Save / Print */}
      <div className="flex justify-end gap-2">
        <Button onClick={handlePrint}>Print Schedule</Button>
      </div>
    </div>
  );
};

export default WeeklyLaborSchedule;

