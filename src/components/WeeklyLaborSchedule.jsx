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
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'numeric', 
    day: 'numeric' 
  });
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

  // Generate week dates
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

  // Department colors for consistency
  const getDepartmentColor = (dept) => {
    const colors = {
      FOH: 'bg-blue-50 border-blue-200 text-blue-700',
      BOH: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      Bar: 'bg-purple-50 border-purple-200 text-purple-700',
      Management: 'bg-slate-50 border-slate-200 text-slate-700'
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
    // Save schedule logic here
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
    <div className="space-y-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 min-h-screen p-4">
      {/* Enhanced Header */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Enhanced Labor Schedule
                </CardTitle>
                <p className="text-slate-600">
                  📍 Mopped Restaurant Template • Viewing: {selectedDepartment === 'ALL' ? 'All Departments' : selectedDepartment} • Week of {formatDate(weekDates[0])}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant={adminMode ? "default" : "outline"}
                onClick={() => setAdminMode(!adminMode)}
                className={adminMode ? "bg-slate-600 hover:bg-slate-700 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}
              >
                <Settings className="h-4 w-4 mr-2" />
                {adminMode ? 'Exit Admin' : 'Admin Mode'}
              </Button>
              <Button 
                variant="outline" 
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={saveSchedule}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </Button>
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Download className="h-4 w-4 mr-2" />
                Print / PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Department Filter */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Department Filter:
              </h3>
              <div className="flex space-x-2">
                <Button
                  variant={selectedDepartment === 'ALL' ? "default" : "outline"}
                  onClick={() => setSelectedDepartment('ALL')}
                  className={selectedDepartment === 'ALL' ? "bg-blue-600 hover:bg-blue-700" : ""}
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
                        `bg-${deptKey === 'FOH' ? 'blue' : deptKey === 'BOH' ? 'emerald' : deptKey === 'Bar' ? 'purple' : 'slate'}-600 text-white hover:opacity-90` :
                        `border-2 hover:bg-${deptKey === 'FOH' ? 'blue' : deptKey === 'BOH' ? 'emerald' : deptKey === 'Bar' ? 'purple' : 'slate'}-50`
                      }
                    >
                      {deptKey} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(newWeek.getDate() - 7);
                  setCurrentWeek(newWeek);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-slate-700 px-3">
                Week of {formatDate(weekDates[0])}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(newWeek.getDate() + 7);
                  setCurrentWeek(newWeek);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Schedule Grid with Sticky Headers */}
      <Card className="border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="relative">
          {/* Sticky Header Row */}
          <div className="sticky top-0 z-20 bg-white border-b-2 border-slate-200 shadow-sm">
            <div className="grid grid-cols-8 gap-0">
              {/* Sticky Role/Shift Column Header */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-4 border-r-2 border-slate-300 font-bold text-slate-900 sticky left-0 z-30">
                Role / Shift
              </div>
              
              {/* Day Headers */}
              {weekDates.map((date, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 text-center border-r border-slate-200">
                  <div className="font-bold text-slate-900">{formatDate(date).split(' ')[0]}</div>
                  <div className="text-sm text-slate-600">{formatDate(date).split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Content with Sticky Left Column */}
          <div className="max-h-[600px] overflow-y-auto">
            {filteredRoles.map((role, roleIndex) => {
              // Generate shifts for each role (AM, PM, etc.)
              const shifts = role.name === 'Manager' ? ['All Day'] : ['AM Shift', 'PM Shift'];
              
              return shifts.map((shift, shiftIndex) => {
                const employeeId = `${roleIndex}-${shiftIndex}`;
                const isSelected = selectedEmployee === employeeId;
                const deptColors = getDepartmentColor(role.department);
                
                return (
                  <div 
                    key={employeeId} 
                    className={`grid grid-cols-8 gap-0 border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                    }`}
                  >
                    {/* Sticky Role/Shift Column */}
                    <div 
                      className={`sticky left-0 z-10 p-4 border-r-2 border-slate-300 bg-white cursor-pointer ${deptColors} ${
                        isSelected ? 'ring-2 ring-blue-300' : ''
                      }`}
                      onClick={() => handleEmployeeClick(roleIndex, shiftIndex)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          role.department === 'FOH' ? 'bg-blue-500' : 
                          role.department === 'BOH' ? 'bg-emerald-500' : 
                          role.department === 'Bar' ? 'bg-purple-500' : 'bg-slate-500'
                        }`}></div>
                        <div>
                          <div className="font-semibold text-sm">{role.name}</div>
                          <div className="text-xs opacity-75">{shift}</div>
                          <div className="text-xs opacity-60">
                            {shift === 'AM Shift' ? '08:30 - 16:30' : 
                             shift === 'PM Shift' ? '15:00 - 23:00' : '08:00 - 17:00'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, dayIndex) => {
                      const scheduleKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                      const dayData = scheduleData[scheduleKey] || {};
                      
                      return (
                        <div key={dayIndex} className={`p-2 border-r border-slate-200 ${isSelected ? 'bg-blue-50' : ''}`}>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Employee Name"
                              value={dayData.employeeName || ''}
                              onChange={(e) => handleScheduleUpdate(roleIndex, shiftIndex, dayIndex, 'employeeName', e.target.value)}
                              className={`w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-300 ${
                                isSelected ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'
                              }`}
                            />
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex space-x-1">
                                <input 
                                  type="time" 
                                  className="text-xs border rounded px-1" 
                                  value={dayData.startTime || (shift === 'AM Shift' ? '08:30' : shift === 'PM Shift' ? '15:00' : '08:00')}
                                  onChange={(e) => handleScheduleUpdate(roleIndex, shiftIndex, dayIndex, 'startTime', e.target.value)}
                                />
                                <span>-</span>
                                <input 
                                  type="time" 
                                  className="text-xs border rounded px-1" 
                                  value={dayData.endTime || (shift === 'AM Shift' ? '16:30' : shift === 'PM Shift' ? '23:00' : '17:00')}
                                  onChange={(e) => handleScheduleUpdate(roleIndex, shiftIndex, dayIndex, 'endTime', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {role.department === 'FOH' ? 'FOH' : 
                                 role.department === 'BOH' ? 'BOH' : 
                                 role.department === 'Bar' ? 'BAR' : 'MGT'}
                              </Badge>
                              <span className="text-xs text-slate-500">${role.hourly_rate}/hr</span>
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

      {/* Selected Employee Info */}
      {selectedEmployee && (
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-900">
                Currently editing: {filteredRoles[parseInt(selectedEmployee.split('-')[0])]?.name} - 
                {selectedEmployee.split('-')[1] === '0' ? 'AM Shift' : 'PM Shift'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedEmployee(null)}
                className="ml-auto"
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
