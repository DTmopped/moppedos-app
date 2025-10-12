import React, { useState, useContext, useMemo } from 'react';
import { LaborContext } from '../contexts/LaborContext';

const WeeklyLaborSchedule = () => {
  const { 
    employees, 
    roles, 
    assignments, 
    addAssignment, 
    removeAssignment, 
    updateAssignment,
    currentWeek,
    setCurrentWeek 
  } = useContext(LaborContext);

  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [isManagerView, setIsManagerView] = useState(true);

  // Time calculation helper
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    try {
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours + (minutes || 0) / 60;
      };

      const start = parseTime(startTime);
      const end = parseTime(endTime);
      
      let hours = end - start;
      if (hours < 0) hours += 24; // Handle overnight shifts
      
      return Math.max(0, Math.round(hours * 2) / 2); // Round to nearest 0.5
    } catch (error) {
      return 0;
    }
  };

  // Generate time options
  const timeOptions = useMemo(() => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        let displayHour = hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour === 0) displayHour = 12;
        else if (hour > 12) displayHour = hour - 12;
        
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        times.push(displayTime);
      }
    }
    return times;
  }, []);

  // Get current week dates
  const getWeekDates = () => {
    const startDate = new Date(currentWeek);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Get today's date for highlighting
  const today = new Date();
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  // Filter roles by department
  const filteredRoles = roles.filter(role => {
    if (selectedDepartment === 'All') return true;
    return role.department === selectedDepartment;
  });

  // Group roles by department for printing
  const rolesByDepartment = useMemo(() => {
    const departments = {};
    roles.forEach(role => {
      if (!departments[role.department]) {
        departments[role.department] = [];
      }
      departments[role.department].push(role);
    });
    return departments;
  }, [roles]);

  // Calculate budget statistics
  const calculateBudgetStats = () => {
    let totalCost = 0;
    let totalHours = 0;
    let assignedCount = 0;

    assignments.forEach(assignment => {
      const employee = employees.find(emp => emp.id === assignment.employeeId);
      if (employee) {
        const hours = calculateHours(assignment.startTime, assignment.endTime);
        totalCost += hours * employee.hourlyRate;
        totalHours += hours;
        assignedCount++;
      }
    });

    return { totalCost, totalHours, assignedCount };
  };

  const { totalCost, totalHours, assignedCount } = calculateBudgetStats();
  const weeklyBudget = 3600; // Example budget
  const budgetPercentage = (totalCost / weeklyBudget) * 100;

  const getBudgetStatus = () => {
    if (budgetPercentage <= 80) return { color: 'text-green-600', bg: 'bg-green-100', status: 'Under Budget' };
    if (budgetPercentage <= 100) return { color: 'text-amber-600', bg: 'bg-amber-100', status: 'Near Budget' };
    return { color: 'text-red-600', bg: 'bg-red-100', status: 'Over Budget' };
  };

  const budgetStatus = getBudgetStatus();

  // Department colors
  const getDepartmentColor = (department) => {
    const colors = {
      'FOH': 'bg-blue-50 border-blue-200 text-blue-800',
      'BOH': 'bg-emerald-50 border-emerald-200 text-emerald-800',
      'Bar': 'bg-purple-50 border-purple-200 text-purple-800',
      'Management': 'bg-amber-50 border-amber-200 text-amber-800'
    };
    return colors[department] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getDepartmentEmoji = (department) => {
    const emojis = {
      'FOH': '🍽️',
      'BOH': '👨‍🍳',
      'Bar': '🍸',
      'Management': '👔'
    };
    return emojis[department] || '👥';
  };

  // Get assignments for a specific role and day
  const getAssignments = (roleId, dayIndex) => {
    return assignments.filter(assignment => 
      assignment.roleId === roleId && assignment.dayIndex === dayIndex
    );
  };

  // Add new assignment
  const handleAddEmployee = (roleId, dayIndex) => {
    const newAssignment = {
      id: Date.now(),
      roleId,
      dayIndex,
      employeeId: null,
      startTime: '9:00 AM',
      endTime: '5:00 PM'
    };
    addAssignment(newAssignment);
  };

  // Update assignment
  const handleUpdateAssignment = (assignmentId, field, value) => {
    updateAssignment(assignmentId, { [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          /* Hide everything by default */
          * {
            visibility: hidden;
          }
          
          /* Show only print content */
          .print-only, .print-only * {
            visibility: visible;
          }
          
          /* Hide screen content */
          .no-print {
            display: none !important;
          }
          
          /* Print layout */
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          /* Page setup */
          @page {
            size: landscape;
            margin: 0.5in;
          }
          
          /* Department page breaks */
          .print-department {
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .print-department:last-child {
            page-break-after: auto;
          }
          
          /* Print table styling */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 20px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            vertical-align: top;
          }
          
          .print-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .print-role-cell {
            background-color: #e8f5e8;
            font-weight: bold;
            width: 120px;
          }
          
          .print-day-cell {
            width: calc((100% - 120px) / 7);
            min-height: 60px;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 15px;
            font-size: 14px;
            font-weight: bold;
          }
          
          .print-department-title {
            font-size: 12px;
            margin-bottom: 10px;
            font-weight: bold;
          }
        }
      `}</style>

      {/* Screen Content */}
      <div className="no-print">
        {/* Budget Section - Manager View Only */}
        {isManagerView && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                💰 Weekly Labor Budget
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Live Tracking
                </span>
              </h2>
              <button 
                onClick={() => setIsManagerView(!isManagerView)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                {isManagerView ? '👁️ Employee View' : '👔 Manager View'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">💵 Total Cost</p>
                    <p className="text-2xl font-bold text-blue-800">${totalCost.toFixed(0)}</p>
                  </div>
                  <div className="text-blue-500">📊</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">⏱️ Total Hours</p>
                    <p className="text-2xl font-bold text-emerald-800">{totalHours}h</p>
                  </div>
                  <div className="text-emerald-500">🕐</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">👥 Staff Assigned</p>
                    <p className="text-2xl font-bold text-purple-800">{assignedCount}</p>
                  </div>
                  <div className="text-purple-500">📋</div>
                </div>
              </div>
              
              <div className={`bg-gradient-to-r p-4 rounded-lg border ${budgetStatus.bg} ${budgetStatus.color.replace('text-', 'border-')}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">📈 Budget Status</p>
                    <p className="text-lg font-bold">{budgetPercentage.toFixed(1)}%</p>
                    <p className="text-xs">{budgetStatus.status}</p>
                  </div>
                  <div className="text-2xl">
                    {budgetPercentage <= 80 ? '✅' : budgetPercentage <= 100 ? '⚠️' : '🚨'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Department Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-slate-700 font-medium">🔍 Department Filter:</span>
              <div className="flex gap-2">
                {['All', 'FOH', 'BOH', 'Bar', 'Management'].map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDepartment === dept
                        ? 'bg-slate-800 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dept === 'All' ? '👥' : getDepartmentEmoji(dept)} {dept} 
                    {dept !== 'All' && `(${roles.filter(r => r.department === dept).length})`}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-200 rounded-full"></span>
                <span className="text-slate-600">👥 Available: {employees.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                <span className="text-slate-600">✅ Assigned: {assignedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                📅 Weekly Staff Schedule
                <span className="text-lg text-slate-600 font-normal">
                  Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
                </span>
              </h1>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsManagerView(!isManagerView)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {isManagerView ? '👁️ Employee View' : '👔 Manager View'}
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  💾 Save Schedule
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  🖨️ Print Schedule
                </button>
              </div>
            </div>

            {/* Schedule Grid Container */}
            <div className="overflow-x-auto">
              <div className="min-w-[1800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 gap-6 mb-4">
                  <div className="w-48 bg-slate-100 rounded-lg p-4 text-center border border-slate-200">
                    <span className="text-slate-700 font-bold">📋 Role / Shift</span>
                  </div>
                  
                  {weekDates.map((date, index) => (
                    <div 
                      key={index}
                      className={`min-w-[220px] rounded-lg p-4 text-center border-2 transition-all ${
                        isToday(date) 
                          ? 'bg-blue-100 border-blue-300 shadow-lg' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-slate-800">
                        {isToday(date) ? '📅' : '📆'} {dayNames[index]}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {date.getMonth() + 1}/{date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Schedule Rows */}
                {filteredRoles.map(role => (
                  <div key={role.id} className="grid grid-cols-8 gap-6 mb-4">
                    {/* Role Column */}
                    <div className={`w-48 rounded-lg p-4 border-2 ${getDepartmentColor(role.department)}`}>
                      <div className="text-center">
                        <div className="text-lg mb-2">{getDepartmentEmoji(role.department)}</div>
                        <div className="font-bold text-base mb-2">{role.name}</div>
                        <div className="text-sm mb-3">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-60">
                            🌅 {role.shift}
                          </span>
                        </div>
                        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-80">
                          {getDepartmentEmoji(role.department)} {role.department}
                        </div>
                      </div>
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, dayIndex) => (
                      <div 
                        key={dayIndex}
                        className={`min-w-[220px] min-h-[128px] rounded-lg border-2 p-3 ${
                          isToday(date) 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="space-y-2">
                          {getAssignments(role.id, dayIndex).map(assignment => {
                            const employee = employees.find(emp => emp.id === assignment.employeeId);
                            const hours = calculateHours(assignment.startTime, assignment.endTime);
                            
                            return (
                              <div key={assignment.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-2">
                                  <select
                                    value={assignment.employeeId || ''}
                                    onChange={(e) => handleUpdateAssignment(assignment.id, 'employeeId', e.target.value)}
                                    className="w-full text-base font-bold text-slate-900 bg-transparent border-none focus:outline-none"
                                  >
                                    <option value="">Select Employee</option>
                                    {employees
                                      .filter(emp => emp.departments.includes(role.department))
                                      .map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                          {emp.name} ({emp.departments.join(', ')})
                                        </option>
                                      ))
                                    }
                                  </select>
                                  
                                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
                                    <select
                                      value={assignment.startTime}
                                      onChange={(e) => handleUpdateAssignment(assignment.id, 'startTime', e.target.value)}
                                      className="bg-transparent border-none focus:outline-none font-bold"
                                    >
                                      {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                      ))}
                                    </select>
                                    
                                    <span>-</span>
                                    
                                    <select
                                      value={assignment.endTime}
                                      onChange={(e) => handleUpdateAssignment(assignment.id, 'endTime', e.target.value)}
                                      className="bg-transparent border-none focus:outline-none font-bold"
                                    >
                                      {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                      ))}
                                    </select>
                                    
                                    <span className="text-slate-600">({hours}h)</span>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => removeAssignment(assignment.id)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs flex items-center justify-center transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                          
                          <button
                            onClick={() => handleAddEmployee(role.id, dayIndex)}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors font-medium"
                          >
                            + Add Employee
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-Only Content */}
      <div className="print-only">
        {Object.entries(rolesByDepartment).map(([department, departmentRoles]) => (
          <div key={department} className="print-department">
            <div className="print-header">
              <div>Weekly Staff Schedule</div>
              <div>Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}</div>
              <div className="print-department-title">
                {getDepartmentEmoji(department)} {department} Department
              </div>
            </div>
            
            <table className="print-table">
              <thead>
                <tr>
                  <th className="print-role-cell">Role / Shift</th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="print-day-cell">
                      {isToday(date) ? '📅' : '📆'} {dayNames[index]}<br/>
                      {date.getMonth() + 1}/{date.getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentRoles.map(role => (
                  <tr key={role.id}>
                    <td className="print-role-cell">
                      <div>{getDepartmentEmoji(role.department)} {role.name}</div>
                      <div style={{fontSize: '8px'}}>{role.shift}</div>
                    </td>
                    {weekDates.map((date, dayIndex) => (
                      <td key={dayIndex} className="print-day-cell">
                        {getAssignments(role.id, dayIndex).map(assignment => {
                          const employee = employees.find(emp => emp.id === assignment.employeeId);
                          const hours = calculateHours(assignment.startTime, assignment.endTime);
                          
                          return employee ? (
                            <div key={assignment.id} style={{marginBottom: '4px', fontSize: '9px'}}>
                              <div style={{fontWeight: 'bold'}}>{employee.name}</div>
                              <div>{assignment.startTime} - {assignment.endTime}</div>
                              <div>({hours}h)</div>
                            </div>
                          ) : null;
                        })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyLaborSchedule;
