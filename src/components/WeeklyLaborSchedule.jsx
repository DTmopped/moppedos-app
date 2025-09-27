import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Save, FileText, Settings, Users, Clock, 
  ChevronLeft, ChevronRight, Filter, Download, AlertCircle
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    outline: "bg-white text-slate-700 border-slate-300"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Date utility functions
const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
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

// Time formatting function
const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
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

  const { 
    employees, 
    ptoRequests, 
    currentTemplate, 
    isConnected, 
    loading,
    error,
    getSystemStats
  } = useLaborData();

  // Generate week dates (Monday to Sunday)
  const getWeekDates = (startDate) => {
    const dates = [];
    const start = getStartOfWeek(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);
  const filteredRoles = selectedDepartment === 'ALL' 
    ? ROLES 
    : ROLES.filter(role => role.department === selectedDepartment);

  // Brighter department colors
  const getDepartmentColor = (dept) => {
    const colors = {
      FOH: 'bg-blue-100 border-blue-300 text-blue-800',
      BOH: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      Bar: 'bg-purple-100 border-purple-300 text-purple-800',
      Management: 'bg-orange-100 border-orange-300 text-orange-800'
    };
    return colors[dept] || colors.Management;
  };

  const handleEmployeeClick = (roleIndex, shiftIndex) => {
    const employeeId = `${roleIndex}-${shiftIndex}`;
    setSelectedEmployee(selectedEmployee === employeeId ? null : employeeId);
  };

  const handleScheduleUpdate = (roleIndex, shiftIndex, dayIndex, field, value) => {
    const key = `${roleIndex}-${shiftIndex}-${dayIndex}`;
    setScheduleData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const saveSchedule = () => {
    alert('Schedule saved successfully!');
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
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50/40 min-h-screen p-6">
      {/* Enhanced Header - Larger */}
      <Card className="border-slate-200 bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-emerald-100 border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Enhanced Labor Schedule
                </CardTitle>
                <p className="text-slate-700 text-lg">
                  📍 Mopped Restaurant Template • Viewing: {selectedDepartment === 'ALL' ? 'All Departments' : selectedDepartment} • Week of {formatDate(weekDates[0])}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant={adminMode ? "default" : "outline"}
                onClick={() => setAdminMode(!adminMode)}
                className={adminMode ? "bg-slate-700 hover:bg-slate-800 text-white px-6 py-3" : "border-slate-400 text-slate-700 hover:bg-slate-100 px-6 py-3"}
              >
                <Settings className="h-5 w-5 mr-2" />
                {adminMode ? 'Exit Admin' : 'Admin Mode'}
              </Button>
              <Button 
                variant="outline" 
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-6 py-3"
                onClick={saveSchedule}
              >
                <Save className="h-5 w-5 mr-2" />
                Save Schedule
              </Button>
              <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-100 px-6 py-3">
                <Download className="h-5 w-5 mr-2" />
                Print / PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-300 bg-red-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-700" />
              <span className="text-red-900">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Department Filter - Larger */}
      <Card className="border-slate-200 bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Filter className="h-5 w-5 mr-3" />
                Department Filter:
              </h3>
              <div className="flex space-x-3">
                <Button
                  variant={selectedDepartment === 'ALL' ? "default" : "outline"}
                  onClick={() => setSelectedDepartment('ALL')}
                  className={selectedDepartment === 'ALL' ? "bg-blue-700 hover:bg-blue-800 px-6 py-3" : "px-6 py-3"}
                >
                  ALL ({ROLES.length})
                </Button>
                {Object.entries(DEPARTMENTS).map(([deptKey, deptInfo]) => {
                  const count = getRolesByDepartment(deptKey).length;
                  const isActive = selectedDepartment === deptKey;
                  return (
                    <Button
                      key={deptKey}
                      variant={isActive ? "default" : "outline"}
                      onClick={() => setSelectedDepartment(deptKey)}
                      className={isActive ? 
                        `bg-${deptKey === 'FOH' ? 'blue' : deptKey === 'BOH' ? 'emerald' : deptKey === 'Bar' ? 'purple' : 'orange'}-700 text-white hover:opacity-90 px-6 py-3` :
                        `border-2 hover:bg-${deptKey === 'FOH' ? 'blue' : deptKey === 'BOH' ? 'emerald' : deptKey === 'Bar' ? 'purple' : 'orange'}-100 px-6 py-3`
                      }
                    >
                      {deptKey} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Week Navigation - Larger */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(newWeek.getDate() - 7);
                  setCurrentWeek(newWeek);
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-medium text-slate-800 px-4">
                Week of {formatDate(weekDates[0])}
              </span>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(newWeek.getDate() + 7);
                  setCurrentWeek(newWeek);
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Schedule Grid - Much Larger */}
      <Card className="border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="relative">
          {/* Sticky Header Row */}
          <div className="sticky top-0 z-20 bg-white border-b-3 border-slate-300 shadow-lg">
            <div className="grid grid-cols-8 gap-0">
              {/* Sticky Role/Shift Column Header */}
              <div className="bg-gradient-to-r from-slate-200 to-slate-300 p-6 border-r-3 border-slate-400 font-bold text-slate-900 sticky left-0 z-30 text-lg">
                Role / Shift
              </div>
              
              {/* Day Headers - Monday to Sunday */}
              {weekDates.map((date, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-100 to-emerald-100 p-6 text-center border-r-2 border-slate-300">
                  <div className="font-bold text-slate-900 text-lg">{formatDate(date).split(' ')[0]}</div>
                  <div className="text-base text-slate-700">{formatDate(date).split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Content with Sticky Left Column */}
          <div className="max-h-[700px] overflow-y-auto">
            {filteredRoles.map((role, roleIndex) => {
              const shifts = role.name === 'Manager' ? ['All Day'] : ['AM Shift', 'PM Shift'];
              
              return shifts.map((shift, shiftIndex) => {
                const employeeId = `${roleIndex}-${shiftIndex}`;
                const isSelected = selectedEmployee === employeeId;
                const deptColors = getDepartmentColor(role.department);
                
                return (
                  <div 
                    key={employeeId} 
                    className={`grid grid-cols-8 gap-0 border-b-2 border-slate-200 hover:bg-slate-100 transition-colors ${
                      isSelected ? 'bg-yellow-100 ring-4 ring-yellow-400 shadow-lg' : ''
                    }`}
                  >
                    {/* Sticky Role/Shift Column */}
                    <div 
                      className={`sticky left-0 z-10 p-6 border-r-3 border-slate-400 bg-white cursor-pointer ${deptColors} ${
                        isSelected ? 'ring-4 ring-yellow-400 bg-yellow-50' : ''
                      }`}
                      onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${
                          role.department === 'FOH' ? 'bg-blue-600' : 
                          role.department === 'BOH' ? 'bg-emerald-600' : 
                          role.department === 'Bar' ? 'bg-purple-600' : 'bg-orange-600'
                        }`}></div>
                        <div>
                          <div className="font-bold text-base">{role.name}</div>
                          <div className="text-sm opacity-80">{shift}</div>
                          <div className="text-sm opacity-70">
                            {shift === 'AM Shift' ? '8:30 AM - 4:30 PM' : 
                             shift === 'PM Shift' ? '3:00 PM - 11:00 PM' : '8:00 AM - 5:00 PM'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, dayIndex) => {
                      const scheduleKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                      const dayData = scheduleData[scheduleKey] || {};
                      
                      return (
                        <div key={dayIndex} className={`p-4 border-r-2 border-slate-200 ${isSelected ? 'bg-yellow-50' : ''}`}>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Employee Name"
                              value={dayData.employeeName || ''}
                              onChange={(e) => handleScheduleUpdate(roleIndex, shiftIndex, dayIndex, 'employeeName', e.target.value)}
                              className={`w-full p-3 text-base border-2 rounded-lg focus:ring-3 focus:ring-blue-400 focus:border-blue-400 ${
                                isSelected ? 'bg-white border-yellow-400' : 'bg-slate-50 border-slate-300'
                              }`}
                            />
                            <div className="flex items-center justify-center text-sm">
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="time" 
                                  className="text-sm border-2 rounded px-2 py-1" 
                                  value={dayData.startTime || (shift === 'AM Shift' ? '08:30' : shift === 'PM Shift' ? '15:00' : '08:00')}
                                  onChange={(e) => handleScheduleUpdate(roleIndex, shiftIndex, dayIndex, 'startTime', e.target.value)}
                                />
                                <span className="font-bold">-</span>
                                <input 
                                  type="time" 
                                  className="text-sm border-2 rounded px-2 py-1" 
                                  value={dayData.endTime || (shift === 'AM Shift' ? '16:30' : shift === 'PM Shift' ? '23:00' : '17:00')}
                                  onChange={(e) => handleScheduleUpdate(roleIndex, shiftIndex, dayIndex, 'endTime', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <Badge variant="outline" className="text-sm font-bold">
                                {role.department === 'FOH' ? 'FOH' : 
                                 role.department === 'BOH' ? 'BOH' : 
                                 role.department === 'Bar' ? 'BAR' : 'MGT'}
                              </Badge>
                            </div>
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
      </Card>

      {/* Selected Employee Info - More Prominent */}
      {selectedEmployee && (
        <Card className="border-yellow-400 bg-yellow-100 shadow-xl ring-2 ring-yellow-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
              <span className="font-bold text-yellow-900 text-lg">
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
