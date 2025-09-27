import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Save, FileText, Settings, Users, Clock, 
  ChevronLeft, ChevronRight, Filter, Download, AlertCircle
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-3 py-1 text-sm font-medium rounded-md";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
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

const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  return start;
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'numeric', 
    day: 'numeric' 
  });
};

const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
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

  const getDepartmentColor = (department) => {
    switch(department) {
      case 'FOH': return 'bg-blue-50 border-blue-200';
      case 'BOH': return 'bg-emerald-50 border-emerald-200';
      case 'Bar': return 'bg-purple-50 border-purple-200';
      case 'Management': return 'bg-slate-50 border-slate-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getDepartmentBadgeVariant = (department) => {
    switch(department) {
      case 'FOH': return 'foh';
      case 'BOH': return 'boh';
      case 'Bar': return 'bar';
      case 'Management': return 'management';
      default: return 'default';
    }
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Enhanced Labor Schedule</CardTitle>
                <p className="text-blue-100 mt-1">Mopped Restaurant Template • Viewing: All Departments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Save className="h-5 w-5 mr-2" />
                Save Schedule
              </Button>
              <Button variant="secondary" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <FileText className="h-5 w-5 mr-2" />
                Print / PDF
              </Button>
              <Button 
                variant={adminMode ? "default" : "secondary"} 
                size="lg"
                onClick={() => setAdminMode(!adminMode)}
                className={adminMode ? "bg-white text-blue-600" : "bg-white/20 hover:bg-white/30 text-white border-white/30"}
              >
                <Settings className="h-5 w-5 mr-2" />
                Admin Mode
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Department Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-slate-700 text-lg">Department Filter:</span>
              <div className="flex space-x-3">
                {[
                  { id: 'ALL', label: 'ALL (13)', color: 'bg-blue-600 text-white' },
                  { id: 'FOH', label: 'FOH (5)', color: 'bg-white text-slate-700 border border-slate-300' },
                  { id: 'BOH', label: 'BOH (5)', color: 'bg-white text-slate-700 border border-slate-300' },
                  { id: 'Bar', label: 'Bar (1)', color: 'bg-white text-slate-700 border border-slate-300' },
                  { id: 'Management', label: 'Management (2)', color: 'bg-white text-slate-700 border border-slate-300' }
                ].map(dept => (
                  <Button
                    key={dept.id}
                    variant={selectedDepartment === dept.id ? "default" : "outline"}
                    size="lg"
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={selectedDepartment === dept.id ? "bg-blue-600 text-white" : ""}
                  >
                    {dept.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-slate-700 text-lg">Week of Mon, 9/22</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="lg">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card className="shadow-lg">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b-2 border-slate-200">
              <div className="grid grid-cols-8 gap-0">
                <div className="bg-slate-100 p-6 font-bold text-slate-700 text-lg border-r border-slate-200">
                  Role / Shift
                </div>
                {weekDays.map((day, index) => (
                  <div key={index} className="bg-emerald-50 p-6 text-center border-r border-slate-200 last:border-r-0">
                    <div className="font-bold text-slate-700 text-lg">
                      {formatDate(day).split(',')[0]},
                    </div>
                    <div className="text-slate-600 text-base mt-1">
                      {formatDate(day).split(',')[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Rows */}
            <div className="divide-y divide-slate-200">
              {filteredRoles.map((role, roleIndex) => {
                const shifts = role.shifts || [
                  { name: 'AM Shift', startTime: '08:30', endTime: '16:30' },
                  { name: 'PM Shift', startTime: '15:00', endTime: '23:00' }
                ];

                return shifts.map((shift, shiftIndex) => {
                  const isSelected = selectedEmployee === `${roleIndex}-${shiftIndex}`;
                  
                  return (
                    <div 
                      key={`${roleIndex}-${shiftIndex}`}
                      className={`grid grid-cols-8 gap-0 ${isSelected ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'hover:bg-slate-50'} ${getDepartmentColor(role.department)}`}
                    >
                      {/* Role/Shift Column - Sticky */}
                      <div className="sticky left-0 bg-white p-6 border-r border-slate-200 z-10">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${role.department === 'FOH' ? 'bg-blue-500' : role.department === 'BOH' ? 'bg-emerald-500' : role.department === 'Bar' ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                            <div>
                              <div className="font-semibold text-slate-800 text-lg">{role.name}</div>
                              <div className="text-slate-600 text-base">{shift.name}</div>
                              <div className="text-slate-500 text-sm mt-1">
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Day Columns */}
                      {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className="p-4 border-r border-slate-200 last:border-r-0">
                          <div className="space-y-4">
                            <input
                              type="text"
                              placeholder="Employee Name"
                              className="w-full p-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => updateScheduleData(roleIndex, shiftIndex, dayIndex, 'employee', e.target.value)}
                            />
                            <div className="flex items-center space-x-3">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600 text-sm">
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </span>
                            </div>
                            <Badge variant={getDepartmentBadgeVariant(role.department)}>
                              {role.department === 'FOH' ? 'FOH' : 
                               role.department === 'BOH' ? 'BOH' : 
                               role.department === 'Bar' ? 'BAR' : 'MGT'}
                            </Badge>
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

      {/* Selected Employee Info */}
      {selectedEmployee && (
        <Card className="border-yellow-400 bg-yellow-50 shadow-lg ring-2 ring-yellow-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-5 h-5 bg-yellow-600 rounded-full"></div>
              <span className="font-bold text-yellow-900 text-xl">
                Currently editing: {filteredRoles[parseInt(selectedEmployee.split('-')[0])]?.name} - 
                {selectedEmployee.split('-')[1] === '0' ? 'AM Shift' : 'PM Shift'}
              </span>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setSelectedEmployee(null)}
                className="ml-auto border-yellow-400 text-yellow-800 hover:bg-yellow-200"
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

