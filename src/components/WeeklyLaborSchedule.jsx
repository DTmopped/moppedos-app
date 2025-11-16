import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save, FileText, ChevronLeft, ChevronRight, Filter, Clock, AlertCircle, Plus, X, User, 
  Calendar, DollarSign, Target, Eye, EyeOff, TrendingUp, Users, ChevronDown, ChevronUp,
  Loader2, BarChart3, PieChart, Activity, Edit3, Copy
} from 'lucide-react';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, getRolesByDepartment, SHIFT_TIMES, DEPARTMENT_MAPPING } from '@/config/laborScheduleConfig';

// Optimized Print CSS for Single Page Landscape - FIXED
const printStyles = `
  @media print {
    @page {
      size: landscape;
      margin: 0.3in;
    }
    
    /* Hide everything except the schedule */
    .no-print {
      display: none !important;
    }
    
    /* Optimize page layout */
    body {
      margin: 0;
      padding: 0;
      font-size: 9px;
      background: white !important;
      color: black !important;
      transform: scale(0.85);
      transform-origin: top left;
    }
    
    /* Schedule grid optimization for single page */
    .print-schedule {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      page-break-inside: avoid;
    }
    
    .print-header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    
    .print-header h1 {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 3px 0;
    }
    
    .print-header p {
      font-size: 12px;
      margin: 0;
    }
    
    /* Optimized table layout - SINGLE PAGE */
    .print-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8px;
    }
    
    .print-table th,
    .print-table td {
      border: 1px solid #333;
      padding: 3px;
      vertical-align: top;
      font-size: 8px;
      overflow: hidden;
    }
    
    .print-role-header {
      width: 100px;
      background: #f0f0f0 !important;
      font-weight: bold;
      text-align: center;
      font-size: 9px;
    }
    
    .print-day-header {
      background: #f8f8f8 !important;
      font-weight: bold;
      text-align: center;
      font-size: 9px;
      width: calc((100% - 100px) / 7);
    }
    
    .print-role-cell {
      background: #f5f5f5 !important;
      font-weight: bold;
      text-align: center;
      width: 100px;
      font-size: 8px;
    }
    
    .print-day-cell {
      width: calc((100% - 100px) / 7);
      min-height: 50px;
      max-height: 50px;
      overflow: hidden;
    }
    
    .print-employee {
      margin-bottom: 2px;
      padding: 2px;
      border: 1px solid #ddd;
      border-radius: 2px;
      background: #f9f9f9 !important;
      font-size: 7px;
      overflow: hidden;
    }
    
    .print-employee-name {
      font-weight: bold;
      font-size: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .print-employee-time {
      font-size: 7px;
      color: #666 !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Department colors for print */
    .print-dept-foh { background: #e3f2fd !important; }
    .print-dept-boh { background: #e8f5e8 !important; }
    .print-dept-bar { background: #f3e5f5 !important; }
    .print-dept-mgmt { background: #fff3e0 !important; }
    
    /* Force single page */
    .print-schedule {
      page-break-after: avoid;
      page-break-inside: avoid;
      height: auto;
      max-height: 100vh;
    }
    
    /* Compact everything for single page */
    .print-table tr {
      height: 50px;
      max-height: 50px;
    }
    
    /* Remove all colors for better printing */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

// Enhanced Badge Component with professional styling
const Badge = ({ children, variant = "default", size = "sm", emoji }) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full transition-all duration-200";
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };
  const variantClasses = {
    default: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    foh: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-150",
    boh: "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-150", 
    bar: "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-150",
    management: "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-150",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    danger: "bg-red-100 text-red-800 border border-red-200"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {emoji && <span className="mr-1">{emoji}</span>}
      {children}
    </span>
  );
};

// Professional Budget Row Component (Manager Only)
const BudgetRow = ({ title, scheduled, budget, color = "slate", emoji, icon: Icon }) => {
  const percentage = budget > 0 ? (scheduled / budget) * 100 : 0;
  
  const getStatusColor = (pct) => {
    if (pct <= 80) return "text-emerald-700";
    if (pct <= 100) return "text-amber-700";
    return "text-red-700";
  };

  const getProgressColor = (pct) => {
    if (pct <= 80) return "bg-emerald-500";
    if (pct <= 100) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusEmoji = (pct) => {
    if (pct <= 80) return "✅";
    if (pct <= 100) return "⚠️";
    return "🚨";
  };

  return (
    <div className="flex items-center justify-between py-4 px-5 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-5 flex-1">
        <div className="flex items-center space-x-3">
          {emoji && <span className="text-xl">{emoji}</span>}
          {Icon && <Icon className="h-5 w-5 text-slate-600" />}
          <span className="font-semibold text-slate-800 w-20">{title}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-900 font-semibold text-lg">
            ${scheduled.toLocaleString()}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-medium">
            ${budget.toLocaleString()}
          </span>
          <span className={`font-bold ${getStatusColor(percentage)} flex items-center space-x-1.5`}>
            <span>{getStatusEmoji(percentage)}</span>
            <span>({percentage.toFixed(1)}%)</span>
          </span>
        </div>
      </div>
      <div className="w-40 bg-slate-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-700 ease-out ${getProgressColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Professional Stats Card Component (Manager Only)
const QuickStatsCard = ({ title, value, subtitle, emoji, color = "blue", trend }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800",
    emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-800",
    amber: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-800"
  };

  return (
    <div className={`p-5 rounded-xl border-2 ${colorClasses[color]} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80 mb-1">{title}</div>
          <div className="text-3xl font-bold mb-1">{value}</div>
          {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
          {trend && (
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">{trend}</span>
            </div>
          )}
        </div>
        {emoji && <span className="text-3xl">{emoji}</span>}
      </div>
    </div>
  );
};

// Enhanced Time Selector Component with full AM/PM display
const TimeSelector = ({ value, onChange, label }) => {
  const timeOptions = [
    '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
    '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM'
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer hover:bg-slate-50 rounded px-1 text-slate-800 min-w-[70px]"
    >
      {timeOptions.map(time => (
        <option key={time} value={time}>{time}</option>
      ))}
    </select>
  );
};

// Utility functions
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
    weekday: 'short', month: 'numeric', day: 'numeric'
  });
  const parts = formatted.split(', ');
  return { day: parts[0] || 'Day', date: parts[1] || 'Date' };
};

// Enhanced time calculation with proper validation and error checking
const calculateHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const parseTime = (timeStr) => {
    try {
      // Handle various time formats and ensure AM/PM is present
      let cleanTime = timeStr.trim();
      
      // If no AM/PM, assume it's in 24-hour format or add default
      if (!cleanTime.toUpperCase().includes('AM') && !cleanTime.toUpperCase().includes('PM')) {
        const hour = parseInt(cleanTime.split(':')[0]);
        if (hour >= 0 && hour < 12) {
          cleanTime += ' AM';
        } else {
          cleanTime += ' PM';
        }
      }
      
      let timePart = cleanTime.replace(/AM|PM/gi, '').trim();
      let [hours, minutes = 0] = timePart.split(':').map(Number);
      
      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 12 || minutes < 0 || minutes >= 60) {
        console.warn(`Invalid time format: ${timeStr}`);
        return 0;
      }
      
      // Convert to 24-hour format
      if (cleanTime.toUpperCase().includes('PM') && hours !== 12) {
        hours += 12;
      } else if (cleanTime.toUpperCase().includes('AM') && hours === 12) {
        hours = 0;
      }
      
      return hours + (minutes / 60);
    } catch (error) {
      console.error(`Error parsing time: ${timeStr}`, error);
      return 0;
    }
  };
  
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  
  // Handle overnight shifts (end time is next day)
  if (end <= start) {
    end += 24;
  }
  
  const totalHours = end - start;
  
  // Validate result
  if (totalHours < 0 || totalHours > 24) {
    console.warn(`Invalid shift duration: ${startTime} to ${endTime} = ${totalHours} hours`);
    return 0;
  }
  
  return Math.max(0, Math.round(totalHours * 2) / 2); // Round to nearest 0.5 hour
};

// Enhanced time formatting to ensure AM/PM is always shown
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // If already has AM/PM, return as is
  if (timeString.toUpperCase().includes('AM') || timeString.toUpperCase().includes('PM')) {
    return timeString;
  }
  
  // Parse and add AM/PM
  let hours, minutes;
  if (timeString.includes(':')) {
    [hours, minutes] = timeString.split(':');
  } else {
    return timeString; // Return as is if can't parse
  }

  const hour = parseInt(hours);
  const min = minutes || '00';
  
  if (isNaN(hour)) return timeString;

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${min} ${ampm}`;
};

// Time validation helper
const validateTimeRange = (startTime, endTime) => {
  const hours = calculateHours(startTime, endTime);
  if (hours === 0) return { valid: false, error: 'Invalid time format' };
  if (hours > 16) return { valid: false, error: 'Shift too long (>16h)' };
  if (hours < 0.5) return { valid: false, error: 'Shift too short (<30min)' };
  return { valid: true, hours };
};

// Copy Day Selector Component
const CopyDaySelector = ({ currentDayIndex, weekDays, onCopy, onCancel }) => {
  const [selectedDays, setSelectedDays] = useState([]);

  const toggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const handleCopy = () => {
    if (selectedDays.length > 0) {
      onCopy(selectedDays);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium text-slate-700 mb-3">Select days to copy to:</div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {weekDays.map((day, index) => {
          const isCurrentDay = index === currentDayIndex;
          const isSelected = selectedDays.includes(index);
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
          const dayDate = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <button
              key={index}
              disabled={isCurrentDay}
              onClick={() => toggleDay(index)}
              className={`p-3 rounded-md border-2 transition-all duration-200 ${
                isCurrentDay
                  ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                  : isSelected
                  ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="font-bold text-sm">{dayName}</div>
              <div className="text-xs mt-1">{dayDate}</div>
              {isCurrentDay && <div className="text-xs mt-1">(Current)</div>}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCopy}
          disabled={selectedDays.length === 0}
          className={`flex-1 ${
            selectedDays.length > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          Copy to {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'}
        </Button>
      </div>
    </div>
  );
};

const WeeklyLaborSchedule = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showManagerView, setShowManagerView] = useState(true);
  const [budgetCollapsed, setBudgetCollapsed] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [shiftToCopy, setShiftToCopy] = useState(null);

  const contextData = useLaborData();
  const employees = contextData?.employees || [];
  const loading = contextData?.loading || false;
  const error = contextData?.error || null;
  const saveSchedule = contextData?.saveSchedule;
  const convertTimeToStandard = contextData?.convertTimeToStandard;

  const weekStart = getStartOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const filteredRoles = ROLES.filter(
    role => selectedDepartment === 'ALL' || role.department === selectedDepartment
  );

  const getFilteredEmployees = () => {
    if (!employees || !Array.isArray(employees)) return [];
    let filtered = employees.filter(emp => emp.is_active !== false);
    if (selectedDepartment !== 'ALL') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  // Calculate department stats (excluding Management from totals)
  const getDepartmentStats = (department) => {
    const assignments = Object.values(scheduleData).reduce((acc, day) => {
      const deptEmployees = (day.employees || []).filter(emp => 
        department === 'ALL' ? emp.department !== 'Management' : emp.department === department
      );
      return acc.concat(deptEmployees);
    }, []);

    const totalCost = assignments.reduce((sum, emp) => sum + (emp.hourly_rate * emp.hours), 0);
    const totalHours = assignments.reduce((sum, emp) => sum + emp.hours, 0);

    // Enhanced budget data with realistic targets
    const budgets = {
      'FOH': { budget: 1200, target: 1000 },
      'BOH': { budget: 1800, target: 1500 },
      'Bar': { budget: 600, target: 500 },
      'ALL': { budget: 3600, target: 3000 } // FOH + BOH + Bar (excluding Management)
    };

    return {
      scheduled: Math.round(totalCost),
      budget: budgets[department]?.budget || 0,
      target: budgets[department]?.target || 0,
      hours: Math.round(totalHours),
      employeeCount: assignments.length
    };
  };

  // Enhanced color functions with professional gradients
  const getDepartmentColor = (department) => {
    switch (department) {
      case 'FOH': return 'bg-blue-50 border-blue-300';
      case 'BOH': return 'bg-emerald-50 border-emerald-300';
      case 'Bar': return 'bg-purple-50 border-purple-300';
      case 'Management': return 'bg-amber-50 border-amber-300';
      default: return 'bg-slate-50 border-slate-300';
    }
  };

  const getDepartmentFilterStyle = (deptId, isSelected) => {
    const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-sm text-sm";
    if (isSelected) {
      switch (deptId) {
        case 'FOH': return `${baseStyle} bg-blue-600 text-white shadow-lg transform scale-105`;
        case 'BOH': return `${baseStyle} bg-emerald-600 text-white shadow-lg transform scale-105`;
        case 'Bar': return `${baseStyle} bg-purple-600 text-white shadow-lg transform scale-105`;
        case 'Management': return `${baseStyle} bg-amber-600 text-white shadow-lg transform scale-105`;
        default: return `${baseStyle} bg-slate-700 text-white shadow-lg transform scale-105`;
      }
    }
    return `${baseStyle} bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md`;
  };

  const getDepartmentEmoji = (department) => {
    switch (department) {
      case 'FOH': return '🍽️';
      case 'BOH': return '👨‍🍳';
      case 'Bar': return '🍸';
      case 'Management': return '👔';
      default: return '👥';
    }
  };

  // Event handlers
  const handleAddEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    
    const shift = shiftIndex === 0 ? 'AM' : 'PM';
    const shiftTimes = SHIFT_TIMES[shift] || { start: '9:00 AM', end: '5:00 PM' };

    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
    const currentAssignments = scheduleData[scheduleKey]?.employees || [];

    if (currentAssignments.find(emp => emp.id === employeeId)) return;

    const startTime = formatTime(shiftTimes.start);
    const endTime = formatTime(shiftTimes.end);

    const newEmployee = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      hourly_rate: employee.hourly_rate,
      start: startTime,
      end: endTime,
      hours: calculateHours(startTime, endTime)
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
  };

  const handleRemoveEmployee = (roleIndex, shiftIndex, dayIndex, employeeId) => {
    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
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

  const handleUpdateEmployee = (roleIndex, shiftIndex, dayIndex, employeeId, field, value) => {
    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);
    const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${dayIndex}`;
    const currentAssignments = scheduleData[scheduleKey]?.employees || [];
    
    const updatedEmployees = currentAssignments.map(emp => {
      if (emp.id === employeeId) {
        const updated = { ...emp, [field]: value };
        // Recalculate hours if time changed
        if (field === 'start' || field === 'end') {
          const validation = validateTimeRange(updated.start, updated.end);
          if (validation.valid) {
            updated.hours = validation.hours;
          } else {
            console.warn(`Time validation error: ${validation.error}`);
            // Keep the old hours if validation fails
          }
        }
        return updated;
      }
      return emp;
    });

    setScheduleData(prev => ({
      ...prev,
      [scheduleKey]: {
        ...prev[scheduleKey],
        employees: updatedEmployees
      }
    }));

    setHasUnsavedChanges(true);
  };

  const handleSaveSchedule = async () => {
    try {
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (saveSchedule) {
        await saveSchedule(weekKey, scheduleData);
        setHasUnsavedChanges(false);
        alert('✅ Schedule saved successfully!');
      } else {
        localStorage.setItem('weeklyLaborSchedule', JSON.stringify(scheduleData));
        setHasUnsavedChanges(false);
        alert('💾 Schedule saved to local storage!');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('❌ Error saving schedule. Please try again.');
    }
  };

  const handleCopyShift = (roleIndex, shiftIndex, dayIndex, employee) => {
    setShiftToCopy({
      roleIndex,
      shiftIndex,
      dayIndex,
      employee
    });
    setCopyModalOpen(true);
  };

  const handlePasteShift = (targetDays) => {
    if (!shiftToCopy) return;

    const { roleIndex, shiftIndex, employee } = shiftToCopy;
    const actualRole = filteredRoles[roleIndex];
    const actualRoleIndex = ROLES.findIndex(role => role.name === actualRole.name);

    targetDays.forEach(targetDayIndex => {
      const scheduleKey = `${actualRoleIndex}-${shiftIndex}-${targetDayIndex}`;
      const currentAssignments = scheduleData[scheduleKey]?.employees || [];

      // Check if employee is already assigned to this slot
      if (currentAssignments.find(emp => emp.id === employee.id)) {
        return; // Skip if already assigned
      }

      // Copy the employee with same times
      const newEmployee = {
        ...employee,
        id: employee.id
      };

      setScheduleData(prev => ({
        ...prev,
        [scheduleKey]: {
          ...prev[scheduleKey],
          employees: [...currentAssignments, newEmployee]
        }
      }));
    });

    setHasUnsavedChanges(true);
    setCopyModalOpen(false);
    setShiftToCopy(null);
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const getAssignedEmployees = (roleIndex, shiftIndex, dayIndex) => {
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

  // Print function
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-6" />
          <p className="text-slate-600 text-lg">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-6" />
          <p className="text-red-600 text-lg">Error loading schedule: {error}</p>
        </div>
      </div>
    );
  }

  const fohStats = getDepartmentStats('FOH');
  const bohStats = getDepartmentStats('BOH');
  const barStats = getDepartmentStats('Bar');
  const totalStats = getDepartmentStats('ALL');

  return (
    <>
      {/* Inject print styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-full mx-auto space-y-6">
          {/* Professional Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-slate-800 flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span>Weekly Schedule</span>
              </h1>
              <Button
                onClick={() => setShowManagerView(!showManagerView)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                {showManagerView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showManagerView ? 'Employee View' : 'Manager View'}</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <Calendar className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-700">
                  Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)} className="bg-white shadow-sm hover:shadow-md">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateWeek(1)} className="bg-white shadow-sm hover:shadow-md">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Stats (Manager View Only) */}
          {showManagerView && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
              <QuickStatsCard 
                title="Total Labor Cost" 
                value={`$${totalStats.scheduled.toLocaleString()}`}
                subtitle={`Target: $${totalStats.target.toLocaleString()}`}
                emoji="💰"
                color="blue"
                trend="+5.2% vs last week"
              />
              <QuickStatsCard 
                title="Total Hours" 
                value={totalStats.hours}
                subtitle="Scheduled this week"
                emoji="⏰"
                color="emerald"
                trend="Within target range"
              />
              <QuickStatsCard 
                title="Staff Assigned" 
                value={getTotalAssignments()}
                subtitle={`${filteredEmployees.length} available`}
                emoji="👥"
                color="purple"
                trend="Optimal coverage"
              />
              <QuickStatsCard 
                title="Budget Status" 
                value={`${((totalStats.scheduled / totalStats.budget) * 100).toFixed(0)}%`}
                subtitle="of weekly budget"
                emoji={totalStats.scheduled <= totalStats.target ? "✅" : "⚠️"}
                color="amber"
                trend={totalStats.scheduled <= totalStats.target ? "Under budget" : "Over budget"}
              />
            </div>
          )}

          {/* Enhanced Budget Section (Manager View Only) */}
          {showManagerView && (
            <Card className="border-slate-300 shadow-lg bg-white no-print">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-6 w-6 text-slate-600" />
                    <h3 className="text-xl font-bold text-slate-800">💼 Labor Budget vs Actual</h3>
                    <Badge variant="default" emoji="📊" size="sm">Live Tracking</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBudgetCollapsed(!budgetCollapsed)}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    {budgetCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
                
                {!budgetCollapsed && (
                  <div className="space-y-3">
                    <BudgetRow 
                      title="FOH" 
                      scheduled={fohStats.scheduled} 
                      budget={fohStats.budget} 
                      color="blue" 
                      emoji="🍽️"
                    />
                    <BudgetRow 
                      title="BOH" 
                      scheduled={bohStats.scheduled} 
                      budget={bohStats.budget} 
                      color="emerald" 
                      emoji="👨‍🍳"
                    />
                    <BudgetRow 
                      title="Bar" 
                      scheduled={barStats.scheduled} 
                      budget={barStats.budget} 
                      color="purple" 
                      emoji="🍸"
                    />
                    <div className="border-t-2 border-slate-200 pt-3 mt-4">
                      <BudgetRow 
                        title="Total" 
                        scheduled={totalStats.scheduled} 
                        budget={totalStats.budget} 
                        color="slate" 
                        emoji="📈"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enhanced Department Filter & Stats */}
          <Card className="border-slate-300 shadow-lg bg-white no-print">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-slate-600" />
                    <span className="font-bold text-slate-700">Department Filter:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ALL', label: `All (${ROLES.length})`, emoji: '👥' },
                      { id: 'FOH', label: `FOH (${getRolesByDepartment('FOH').length})`, emoji: '🍽️' },
                      { id: 'BOH', label: `BOH (${getRolesByDepartment('BOH').length})`, emoji: '👨‍🍳' },
                      { id: 'Bar', label: `Bar (${getRolesByDepartment('Bar').length})`, emoji: '🍸' },
                      { id: 'Management', label: `Mgmt (${getRolesByDepartment('Management').length})`, emoji: '👔' }
                    ].map(dept => (
                      <Button
                        key={dept.id}
                        size="sm"
                        onClick={() => setSelectedDepartment(dept.id)}
                        className={getDepartmentFilterStyle(dept.id, selectedDepartment === dept.id)}
                      >
                        <span>{dept.emoji}</span>
                        <span>{dept.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-slate-600 font-medium">Available:</span>
                    <Badge variant="default" size="sm">{filteredEmployees.length}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-slate-600 font-medium">Assigned:</span>
                    <Badge variant="default" size="sm">{getTotalAssignments()}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print Header (Only visible when printing) */}
          <div className="print-header" style={{ display: 'none' }}>
            <h1>Weekly Staff Schedule</h1>
            <p>Week of {formatDateHeader(weekStart).day}, {formatDateHeader(weekStart).date}</p>
          </div>

          {/* FINAL OPTIMIZED Schedule Grid - Perfect Proportions & Single Page Print */}
          <Card className="border-slate-300 shadow-lg bg-white print-schedule">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Optimized Print Table (Hidden on screen) - SINGLE PAGE FIXED */}
                <table className="print-table" style={{ display: 'none' }}>
                  <thead>
                    <tr>
                      <th className="print-role-header">Role / Shift</th>
                      {weekDays.map((day, index) => {
                        const { day: dayName, date } = formatDateHeader(day);
                        return (
                          <th key={index} className="print-day-header">
                            {dayName} {date}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map((role, roleIndex) => {
                      return [0, 1].map(shiftIndex => {
                        const shift = shiftIndex === 0 ? 'AM' : 'PM';
                        return (
                          <tr key={`${roleIndex}-${shiftIndex}`}>
                            <td className="print-role-cell">
                              <div>{getDepartmentEmoji(role.department)} {role.name}</div>
                              <div>{shift} Shift</div>
                              <div>{role.department}</div>
                            </td>
                            {weekDays.map((day, dayIndex) => {
                              const assignedEmployees = getAssignedEmployees(roleIndex, shiftIndex, dayIndex);
                              return (
                                <td key={dayIndex} className={`print-day-cell print-dept-${role.department.toLowerCase()}`}>
                                  {assignedEmployees.map((emp, empIndex) => (
                                    <div key={empIndex} className="print-employee">
                                      <div className="print-employee-name">{emp.name}</div>
                                      <div className="print-employee-time">{emp.start} - {emp.end} ({emp.hours}h)</div>
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>

                {/* Screen Display - OPTIMIZED PROPORTIONS */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[1800px]"> {/* Increased for wider day columns */}
                    <div className="flex">
                      {/* SMALLER Role Header - Optimized Width */}
                      <div className="w-48 flex-shrink-0 sticky left-0 bg-white z-10 pr-3"> {/* Reduced from w-72 to w-48 */}
                        <div className="text-center font-bold text-slate-800 py-4 bg-slate-100 rounded-lg border-2 border-slate-300 h-16 flex items-center justify-center text-sm">
                          📋 Role / Shift
                        </div>
                      </div>
                      {/* WIDER Date Headers - More Space */}
                      <div className="flex-1 grid grid-cols-7 gap-3">
                        {weekDays.map((day, index) => {
                          const { day: dayName, date } = formatDateHeader(day);
                          const isToday = day.toDateString() === new Date().toDateString();
                          return (
                            <div key={index} className={`text-center py-4 rounded-lg border-2 font-bold h-16 flex flex-col justify-center min-w-[220px] text-base ${isToday ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
                              <div className="text-sm font-bold">
                                {dayName} {isToday && '📅'}
                              </div>
                              <div className="text-xs font-semibold opacity-75">
                                {date}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Excel-Style Schedule Rows - WIDER CELLS */}
                    <div className="mt-6 space-y-4">
                      {filteredRoles.map((role, roleIndex) => {
                        return [0, 1].map(shiftIndex => {
                          const shift = shiftIndex === 0 ? 'AM' : 'PM';
                          
                          return (
                            <div key={`${roleIndex}-${shiftIndex}`} className="flex">
                              {/* SMALLER Role Column - EXACT SAME WIDTH */}
                              <div className="w-48 flex-shrink-0 sticky left-0 bg-white z-10 pr-3"> {/* Matches header exactly */}
                                <div className={`p-3 rounded-lg border-2 ${getDepartmentColor(role.department)} h-28 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow duration-200`}>
                                  <div className="text-center space-y-1">
                                    <div className="text-xl">{getDepartmentEmoji(role.department)}</div>
                                    <div className="font-bold text-slate-900 text-sm">{role.name}</div>
                                    <div className="text-slate-800 text-xs font-bold flex items-center justify-center space-x-1">
                                      <span>{shift === 'AM' ? '🌅' : '🌙'}</span>
                                      <span>{shift} Shift</span>
                                    </div>
                                    {/* DEPARTMENT BADGE - Compact */}
                                    <Badge variant={role.department.toLowerCase()} size="sm" emoji={getDepartmentEmoji(role.department)}>
                                      <span className="font-bold text-xs">{role.department}</span>
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* WIDER Day Cells - MORE SPACE FOR TIME */}
                              <div className="flex-1 grid grid-cols-7 gap-3">
                                {weekDays.map((day, dayIndex) => {
                                  const assignedEmployees = getAssignedEmployees(roleIndex, shiftIndex, dayIndex);
                                  const dropdownKey = `${roleIndex}-${shiftIndex}-${dayIndex}`;
                                  const isToday = day.toDateString() === new Date().toDateString();
                                  
                                  return (
                                    <div key={dayIndex} className={`border-2 rounded-lg h-28 p-3 min-w-[220px] ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-300'} hover:shadow-md transition-all duration-200 print-cell ${role.department === 'FOH' ? 'print-dept-foh' : role.department === 'BOH' ? 'print-dept-boh' : role.department === 'Bar' ? 'print-dept-bar' : 'print-dept-mgmt'}`}>
                                      {assignedEmployees.length > 0 ? (
                                        <div className="space-y-2 h-full overflow-y-auto">
                                          {assignedEmployees.map((emp, empIndex) => {
                                            const timeValidation = validateTimeRange(emp.start, emp.end);
                                            return (
                                              <div key={empIndex} className={`p-2 rounded-md border ${getDepartmentColor(emp.department)} group hover:shadow-sm transition-all duration-200 relative print-employee ${!timeValidation.valid ? 'border-red-300 bg-red-50' : ''}`}>
                                                {/* Excel-Style Employee Cell: WIDER FOR TIME */}
                                                <div className="space-y-1">
                                                  {/* Employee Name - Editable & BOLD */}
                                                  <div className="flex items-center justify-between">
                                                    <input
                                                      type="text"
                                                      value={emp.name}
                                                      onChange={(e) => handleUpdateEmployee(roleIndex, shiftIndex, dayIndex, emp.id, 'name', e.target.value)}
                                                      className="font-bold text-sm bg-transparent border-none outline-none w-full text-slate-900 pr-2"
                                                      placeholder="Employee Name"
                                                    />
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 no-print">
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleCopyShift(roleIndex, shiftIndex, dayIndex, emp)}
                                                        className="h-4 w-4 p-0 text-slate-400 hover:text-blue-500 transition-all duration-200 flex-shrink-0"
                                                        title="Copy to other days"
                                                      >
                                                        <Copy className="h-3 w-3" />
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveEmployee(roleIndex, shiftIndex, dayIndex, emp.id)}
                                                        className="h-4 w-4 p-0 text-slate-400 hover:text-red-500 transition-all duration-200 flex-shrink-0"
                                                      >
                                                        <X className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Time Range - WIDER SPACE & WRAPPING */}
                                                  <div className="flex flex-wrap items-center gap-1 text-xs">
                                                    <TimeSelector
                                                      value={emp.start}
                                                      onChange={(value) => handleUpdateEmployee(roleIndex, shiftIndex, dayIndex, emp.id, 'start', value)}
                                                    />
                                                    <span className="font-bold text-slate-700">-</span>
                                                    <TimeSelector
                                                      value={emp.end}
                                                      onChange={(value) => handleUpdateEmployee(roleIndex, shiftIndex, dayIndex, emp.id, 'end', value)}
                                                    />
                                                    <span className={`font-bold whitespace-nowrap ${timeValidation.valid ? 'text-slate-900' : 'text-red-600'}`}>
                                                      ({emp.hours}h)
                                                    </span>
                                                  </div>
                                                  
                                                  {/* Time Validation Error */}
                                                  {!timeValidation.valid && (
                                                    <div className="text-xs text-red-600 font-medium">
                                                      ⚠️ {timeValidation.error}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="h-full flex items-center justify-center no-print">
                                          <div className="relative">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setShowDropdown(showDropdown === dropdownKey ? null : dropdownKey)}
                                              className="text-slate-700 hover:bg-slate-50 border-dashed border-slate-400 text-xs px-3 py-2 flex items-center space-x-2 font-medium"
                                            >
                                              <Plus className="h-3 w-3" />
                                              <span>Add Employee</span>
                                            </Button>
                                            
                                            {showDropdown === dropdownKey && (() => {
                                              // Filter employees by THIS role's department
                                              // Convert role department abbreviation (e.g., 'BOH') to full name (e.g., 'Back of House')
                                              const roleDepartmentFullName = DEPARTMENT_MAPPING[role.department] || role.department;
                                              const roleEmployees = employees.filter(emp => 
                                                emp.is_active !== false && 
                                                emp.department === roleDepartmentFullName
                                              );
                                              return (
                                              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-300 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                                {roleEmployees.length > 0 ? (
                                                  roleEmployees.map(employee => (
                                                    <button
                                                      key={employee.id}
                                                      onClick={() => handleAddEmployee(roleIndex, shiftIndex, dayIndex, employee.id)}
                                                      className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors duration-150"
                                                    >
                                                      <div className="flex items-center space-x-3">
                                                        <span className="text-lg">👤</span>
                                                        <div className="flex-1">
                                                          <div className="font-bold text-sm text-slate-900">{employee.name}</div>
                                                          <div className="text-xs text-slate-600 flex items-center space-x-3 mt-1 font-medium">
                                                            <span>💼 {employee.role}</span>
                                                            <span>•</span>
                                                            <span>🏢 {employee.department}</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </button>
                                                  ))
                                                ) : (
                                                  <div className="px-4 py-3 text-sm text-slate-600 text-center font-medium">
                                                    <span>😔 No employees available</span>
                                                  </div>
                                                )}
                                              </div>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Action Bar */}
          <Card className="border-slate-300 shadow-lg bg-white no-print">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="text-sm text-slate-600">
                  {hasUnsavedChanges ? (
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">⚠️ You have unsaved changes</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <span className="font-medium">✅ All changes saved</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handlePrint} className="bg-white shadow-sm hover:shadow-md" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    🖨️ Print Schedule
                  </Button>
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={!hasUnsavedChanges}
                    size="sm"
                    className={hasUnsavedChanges ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg' : 'bg-slate-300 text-slate-500'}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {hasUnsavedChanges ? '💾 Save Schedule' : '✅ Saved'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Shift Modal */}
          {copyModalOpen && shiftToCopy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">📋 Copy Shift to Other Days</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCopyModalOpen(false);
                      setShiftToCopy(null);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-900">Copying:</div>
                  <div className="text-sm text-blue-800 mt-1">
                    <div className="font-bold">{shiftToCopy.employee.name}</div>
                    <div>{shiftToCopy.employee.start} - {shiftToCopy.employee.end} ({shiftToCopy.employee.hours}h)</div>
                  </div>
                </div>

                <CopyDaySelector
                  currentDayIndex={shiftToCopy.dayIndex}
                  weekDays={weekDays}
                  onCopy={handlePasteShift}
                  onCancel={() => {
                    setCopyModalOpen(false);
                    setShiftToCopy(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Click outside to close dropdown */}
          {showDropdown && (
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default WeeklyLaborSchedule;
