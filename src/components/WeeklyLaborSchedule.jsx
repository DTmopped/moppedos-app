import React, { useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { motion } from 'framer-motion';
import { useLaborData } from '@/contexts/LaborDataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Printer, Info, Users, Save, Building2, Filter, Clock } from 'lucide-react';
import { useToast } from './ui/use-toast.jsx';
import { LOCAL_STORAGE_KEY, ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { loadSchedule, updateSlotInSchedule, generateInitialScheduleSlots } from '@/lib/laborScheduleUtils.js';
import { startOfWeek, format, addDays } from 'date-fns';
import AdminModeToggle from './ui/AdminModeToggle.jsx';

// ===== IMPROVED: Better Badge Component with High Contrast =====
const SimpleBadge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-slate-900 text-white border-slate-700",
    secondary: "bg-slate-700 text-slate-200 border-slate-600",
    outline: "bg-white text-slate-900 border-slate-300"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ===== IMPROVED: Department Filter with Better Styling =====
const DepartmentFilter = ({ selectedDepartment, onDepartmentChange, departmentStats }) => {
  const departments = ['ALL', 'Management', 'FOH', 'Bar', 'BOH'];
  
  return (
    <Card className="glassmorphic-card no-print border border-slate-600">
      <CardHeader className="pb-3 bg-slate-800/50">
        <CardTitle className="text-lg font-semibold text-white">Department Filter</CardTitle>
      </CardHeader>
      <CardContent className="bg-slate-900/30 p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          {departments.map(dept => (
            <Button
              key={dept}
              variant={selectedDepartment === dept ? "default" : "outline"}
              size="sm"
              onClick={() => onDepartmentChange(dept)}
              className={`transition-all duration-200 font-medium ${
                selectedDepartment === dept 
                  ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700' 
                  : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
              }`}
            >
              {dept}
              {departmentStats[dept] && (
                <SimpleBadge variant="secondary" className="ml-2 bg-slate-800 text-slate-200">
                  {departmentStats[dept].roleCount}
                </SimpleBadge>
              )}
            </Button>
          ))}
        </div>
        
        {selectedDepartment !== 'ALL' && departmentStats[selectedDepartment] && (
          <div className="text-sm text-slate-300 space-y-2 bg-slate-800/50 p-3 rounded border border-slate-700">
            <div className="font-medium text-white">Department Stats:</div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Roles:</span>
                <span className="ml-1 font-semibold text-white">{departmentStats[selectedDepartment].roleCount}</span>
              </div>
              <div>
                <span className="text-slate-400">Avg Rate:</span>
                <span className="ml-1 font-semibold text-green-400">${departmentStats[selectedDepartment].avgHourlyRate.toFixed(2)}/hr</span>
              </div>
              <div>
                <span className="text-slate-400">Max Hours:</span>
                <span className="ml-1 font-semibold text-blue-400">{departmentStats[selectedDepartment].totalMaxHours}h/week</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ===== COMPLETELY REDESIGNED: Enhanced Schedule Table with High Contrast =====
const EnhancedScheduleTable = ({ 
  weekStartDate, 
  scheduleData, 
  onUpdate, 
  filteredRoles,
  selectedDepartment 
}) => {
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const shifts = ['AM', 'PM', 'SWING'];

  const renderEmployeeSlot = (date, role, shift, employee, slotIndex) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    
    return (
      <div 
        key={`${dayKey}-${role.id}-${shift}-${slotIndex}`}
        className="bg-slate-800 border border-slate-600 rounded-lg p-3 mb-2 transition-all duration-200 hover:bg-slate-700 hover:border-slate-500"
      >
        {/* Employee Name Input */}
        <input
          type="text"
          placeholder="Employee Name"
          value={employee?.name || ''}
          onChange={(e) => onUpdate(dayKey, role.name, shift, slotIndex, 'name', e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 text-sm font-medium focus:border-blue-500 focus:outline-none"
        />
        
        {/* Time Inputs */}
        <div className="flex items-center gap-2 mt-2">
          <Clock className="h-3 w-3 text-slate-400" />
          <input
            type="time"
            value={employee?.start || ''}
            onChange={(e) => onUpdate(dayKey, role.name, shift, slotIndex, 'start', e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
          />
          <span className="text-slate-400 font-medium">–</span>
          <input
            type="time"
            value={employee?.end || ''}
            onChange={(e) => onUpdate(dayKey, role.name, shift, slotIndex, 'end', e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>
        
        {/* Role Info */}
        <div className="flex items-center justify-between mt-2">
          <SimpleBadge variant="outline" className="bg-slate-700 text-slate-200 border-slate-600">
            {role.abbreviation}
          </SimpleBadge>
          <span className="text-xs text-slate-400 font-medium">{role.department}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="glassmorphic-card border border-slate-600">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600 bg-slate-800">
                <th className="p-4 text-left text-sm font-bold text-white min-w-[200px] border-r border-slate-600">
                  Role / Shift
                </th>
                {weekDates.map(date => (
                  <th key={date.toISOString()} className="p-4 text-center text-sm font-bold text-white min-w-[180px] border-r border-slate-600">
                    <div className="text-base font-bold">{format(date, 'EEE')}</div>
                    <div className="text-xs text-slate-300 font-normal">{format(date, 'MM/dd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-900">
              {filteredRoles.map(role => 
                shifts
                  .filter(shift => role.shifts.includes(shift))
                  .map(shift => (
                    <tr key={`${role.id}-${shift}`} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-white bg-slate-800/50 border-r border-slate-600">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${role.colorClass?.includes('bg-') ? role.colorClass.split(' ')[0] : 'bg-slate-600'}`}></div>
                          <div>
                            <div className="text-sm font-bold text-white">{role.name}</div>
                            <div className="text-xs text-slate-400">{shift} Shift</div>
                            <div className="text-xs text-slate-500">
                              {SHIFT_TIMES[shift]?.start} - {SHIFT_TIMES[shift]?.end}
                            </div>
                          </div>
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const dayKey = format(date, 'yyyy-MM-dd');
                        const dayData = scheduleData[dayKey] || {};
                        const shiftData = dayData[shift] || {};
                        const roleEmployees = shiftData[role.name] || [{}];
                        
                        return (
                          <td key={dayKey} className="p-3 align-top bg-slate-900/50 border-r border-slate-700">
                            {roleEmployees.map((employee, slotIndex) => 
                              renderEmployeeSlot(date, role, shift, employee, slotIndex)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== IMPROVED: Header with Better Contrast =====
const WeeklyLaborScheduleHeader = ({ onSave, onPrint, selectedDepartment, totalRoles, filteredRoles }) => (
  <Card className="glassmorphic-card no-print card-hover-glow border border-slate-600">
    <CardHeader className="pb-4 bg-slate-800/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="p-3 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Enhanced Labor Schedule
            </CardTitle>
            <CardDescription className="text-slate-300 mt-1">
              <div className="flex items-center gap-3 text-sm">
                <SimpleBadge variant="secondary" className="bg-blue-700 text-white border-blue-600">
                  <Building2 className="h-3 w-3 mr-1" />
                  Mopped Restaurant Template
                </SimpleBadge>
                <span className="text-slate-400">•</span>
                <span className="text-white font-medium">
                  Viewing: {selectedDepartment === 'ALL' ? 'All Departments' : selectedDepartment}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-400 font-medium">{filteredRoles} of {totalRoles} roles</span>
              </div>
            </CardDescription>
          </div>
        </div>
        <div className="flex space-x-3 self-start sm:self-center">
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white border-green-500" size="lg">
            <Save className="mr-2 h-5 w-5" /> Save Schedule
          </Button>
          <Button onClick={onPrint} variant="outline" size="lg" className="border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white">
            <Printer className="mr-2 h-5 w-5" /> Print / PDF
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>
);

// ===== MAIN ENHANCED COMPONENT (Same logic, better UI) =====
const WeeklyLaborSchedule = () => {
  const { forecastData } = useLaborData();
  
  // ===== State Management =====
  const [scheduleData, setScheduleData] = useState({});
  const [forecastGeneratedSchedule, setForecastGeneratedSchedule] = useState({});
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [printDate, setPrintDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  // ===== Filtered Roles by Department =====
  const filteredRoles = React.useMemo(() => {
    if (selectedDepartment === 'ALL') return ROLES;
    return ROLES.filter(role => role.department === selectedDepartment);
  }, [selectedDepartment]);

  // ===== Department Statistics =====
  const departmentStats = React.useMemo(() => {
    const stats = { ALL: { roleCount: ROLES.length, avgHourlyRate: 0, totalMaxHours: 0 } };
    
    ['Management', 'FOH', 'Bar', 'BOH'].forEach(dept => {
      const deptRoles = ROLES.filter(role => role.department === dept);
      if (deptRoles.length > 0) {
        stats[dept] = {
          roleCount: deptRoles.length,
          avgHourlyRate: deptRoles.reduce((sum, role) => sum + (role.hourlyRate || 0), 0) / deptRoles.length,
          totalMaxHours: deptRoles.reduce((sum, role) => sum + (role.maxHoursPerWeek || 0), 0)
        };
      }
    });
    
    return stats;
  }, []);

  // ===== Load Schedule Data =====
  useEffect(() => {
    setIsLoading(true);
    const generatedForecast = generateInitialScheduleSlots(forecastData || []);
    const storedSchedule = localStorage.getItem(LOCAL_STORAGE_KEY);
    const loadedSchedule = loadSchedule(forecastData || [], storedSchedule);

    setScheduleData(loadedSchedule);
    setForecastGeneratedSchedule(generatedForecast);
    setIsLoading(false);
  }, [forecastData]);

  // ===== Update Schedule =====
  const handleUpdateSchedule = (date, roleName, shift, slotIndex, field, value) => {
    setScheduleData(prev => updateSlotInSchedule(prev, date, roleName, shift, slotIndex, field, value));
  };

  // ===== Save Schedule =====
  const saveScheduleToLocalStorage = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scheduleData));
    toast({
      title: "Schedule Saved!",
      description: `Enhanced labor schedule saved. Showing ${filteredRoles.length} roles in ${selectedDepartment === 'ALL' ? 'all departments' : selectedDepartment}.`,
      action: <Save className="text-green-500" />,
    });
  };

  // ===== Print Functionality =====
  const handlePrint = () => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(new Date(currentDate).setDate(currentDate.getDate() + diffToMonday));
    const weekEnd = new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));

    const formattedPrintDate = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    const printContent = `
      <h1>Enhanced Weekly Labor Schedule - ${formattedPrintDate}</h1>
      <p><strong>Template:</strong> Mopped Restaurant (13 Roles)</p>
      <p><strong>Department:</strong> ${selectedDepartment}</p>
      <p><strong>Roles Shown:</strong> ${filteredRoles.length} of ${ROLES.length}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Enhanced Weekly Labor Schedule - Print</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e293b; }
            p { margin: 5px 0; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  // ===== Loading State =====
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-white font-medium">Loading enhanced schedule...</p>
        </div>
      </div>
    );
  }

  // ===== Main Render =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-4"
    >
      {/* Enhanced Header */}
      <WeeklyLaborScheduleHeader 
        onSave={saveScheduleToLocalStorage} 
        onPrint={handlePrint}
        selectedDepartment={selectedDepartment}
        totalRoles={ROLES.length}
        filteredRoles={filteredRoles.length}
      />

      {/* Admin Mode Toggle */}
      <div className="flex justify-end">
        <AdminModeToggle />
      </div>

      {/* Department Filter */}
      <DepartmentFilter
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        departmentStats={departmentStats}
      />

      {/* Enhanced Schedule Table */}
      <div className="printable-content printable-labor-schedule">
        {(!ROLES || ROLES.length === 0) ? (
          <Card className="glassmorphic-card no-print border border-slate-600">
            <CardContent className="pt-6 bg-slate-800/50">
              <div className="text-center text-slate-300 flex flex-col items-center py-10">
                <Info size={48} className="mb-4 text-blue-400" />
                <p className="text-lg font-semibold text-white">No Template Data</p>
                <p className="text-slate-400">Please check your laborScheduleConfig.jsx file.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EnhancedScheduleTable
            weekStartDate={weekStartDate}
            scheduleData={scheduleData}
            onUpdate={handleUpdateSchedule}
            filteredRoles={filteredRoles}
            selectedDepartment={selectedDepartment}
          />
        )}
      </div>

      {/* Template Statistics */}
      <Card className="glassmorphic-card no-print border border-slate-600">
        <CardContent className="p-6 bg-slate-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-blue-400">{ROLES.length}</div>
              <div className="text-sm text-slate-300 font-medium">Total Roles</div>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-green-400">{filteredRoles.length}</div>
              <div className="text-sm text-slate-300 font-medium">Filtered Roles</div>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-purple-400">4</div>
              <div className="text-sm text-slate-300 font-medium">Departments</div>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-2xl font-bold text-orange-400">3</div>
              <div className="text-sm text-slate-300 font-medium">Shift Types</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyLaborSchedule;
