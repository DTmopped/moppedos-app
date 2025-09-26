import React, { useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Printer, Info, Users, Save, Building2, Filter } from 'lucide-react';
import { useToast } from './ui/use-toast.jsx';
import { LOCAL_STORAGE_KEY, ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.jsx';
import { loadSchedule, updateSlotInSchedule, generateInitialScheduleSlots } from '@/lib/laborScheduleUtils.js';
import { startOfWeek, format, addDays } from 'date-fns';
import AdminModeToggle from './ui/AdminModeToggle.jsx';

// ===== NEW: Simple Badge Component (since yours doesn't exist) =====
const SimpleBadge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded";
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background text-foreground"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ===== NEW: Department Filter Component =====
const DepartmentFilter = ({ selectedDepartment, onDepartmentChange, departmentStats }) => {
  const departments = ['ALL', 'Management', 'FOH', 'Bar', 'BOH'];
  
  return (
    <Card className="glassmorphic-card no-print">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Department Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {departments.map(dept => (
            <Button
              key={dept}
              variant={selectedDepartment === dept ? "default" : "outline"}
              size="sm"
              onClick={() => onDepartmentChange(dept)}
              className="transition-all duration-200"
            >
              {dept}
              {departmentStats[dept] && (
                <SimpleBadge variant="secondary" className="ml-2">
                  {departmentStats[dept].roleCount}
                </SimpleBadge>
              )}
            </Button>
          ))}
        </div>
        
        {selectedDepartment !== 'ALL' && departmentStats[selectedDepartment] && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Roles: {departmentStats[selectedDepartment].roleCount}</div>
            <div>Avg Rate: ${departmentStats[selectedDepartment].avgHourlyRate.toFixed(2)}/hr</div>
            <div>Max Hours: {departmentStats[selectedDepartment].totalMaxHours}h/week</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ===== NEW: Enhanced Schedule Table =====
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
        className={`p-2 mb-1 rounded text-xs border transition-all duration-200 ${
          role.colorClass || 'bg-slate-700 text-white border-slate-600'
        }`}
      >
        <input
          type="text"
          placeholder="Employee Name"
          value={employee?.name || ''}
          onChange={(e) => onUpdate(dayKey, role.name, shift, slotIndex, 'name', e.target.value)}
          className="w-full bg-transparent border-none text-white placeholder-slate-300 text-xs font-medium"
        />
        <div className="flex gap-1 mt-1">
          <input
            type="time"
            value={employee?.start || ''}
            onChange={(e) => onUpdate(dayKey, role.name, shift, slotIndex, 'start', e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-200 text-xs"
          />
          <span className="text-slate-300">-</span>
          <input
            type="time"
            value={employee?.end || ''}
            onChange={(e) => onUpdate(dayKey, role.name, shift, slotIndex, 'end', e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-200 text-xs"
          />
        </div>
        <div className="text-xs text-slate-300 mt-1 flex justify-between">
          <span>{role.abbreviation}</span>
          <span>{role.department}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="glassmorphic-card">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-left text-sm font-medium text-slate-300 min-w-[150px]">
                  Role / Shift
                </th>
                {weekDates.map(date => (
                  <th key={date.toISOString()} className="p-3 text-center text-sm font-medium text-slate-300 min-w-[140px]">
                    <div>{format(date, 'EEE')}</div>
                    <div className="text-xs text-slate-400">{format(date, 'MM/dd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(role => 
                shifts
                  .filter(shift => role.shifts.includes(shift))
                  .map(shift => (
                    <tr key={`${role.id}-${shift}`} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="p-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <SimpleBadge variant="outline" className={role.colorClass}>
                            {role.abbreviation}
                          </SimpleBadge>
                          <div>
                            <div className="text-sm">{role.name}</div>
                            <div className="text-xs text-slate-400">{shift} Shift</div>
                          </div>
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const dayKey = format(date, 'yyyy-MM-dd');
                        const dayData = scheduleData[dayKey] || {};
                        const shiftData = dayData[shift] || {};
                        const roleEmployees = shiftData[role.name] || [{}];
                        
                        return (
                          <td key={dayKey} className="p-2 align-top bg-slate-900/30">
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

// ===== ENHANCED: Header with Template Info =====
const WeeklyLaborScheduleHeader = ({ onSave, onPrint, selectedDepartment, totalRoles, filteredRoles }) => (
  <Card className="glassmorphic-card no-print card-hover-glow">
    <CardHeader className="pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="p-3 rounded-full bg-gradient-to-tr from-primary to-purple-600 shadow-lg">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold gradient-text">
              Enhanced Labor Schedule
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              <div className="flex items-center gap-2 mt-1">
                <SimpleBadge variant="secondary">
                  <Building2 className="h-3 w-3 mr-1" />
                  Mopped Restaurant Template
                </SimpleBadge>
                <span>•</span>
                <span>Viewing: {selectedDepartment === 'ALL' ? 'All Departments' : selectedDepartment}</span>
                <span>•</span>
                <span>{filteredRoles} of {totalRoles} roles</span>
              </div>
            </CardDescription>
          </div>
        </div>
        <div className="flex space-x-3 self-start sm:self-center">
          <Button onClick={onSave} variant="gradient" size="lg">
            <Save className="mr-2 h-5 w-5" /> Save Schedule
          </Button>
          <Button onClick={onPrint} variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
            <Printer className="mr-2 h-5 w-5" /> Print / PDF
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>
);

// ===== MAIN ENHANCED COMPONENT =====
const WeeklyLaborSchedule = () => {
  const { forecastData } = useData();
  
  // ===== ENHANCED: State Management =====
  const [scheduleData, setScheduleData] = useState({});
  const [forecastGeneratedSchedule, setForecastGeneratedSchedule] = useState({});
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [printDate, setPrintDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  // ===== NEW: Filtered Roles by Department =====
  const filteredRoles = React.useMemo(() => {
    if (selectedDepartment === 'ALL') return ROLES;
    return ROLES.filter(role => role.department === selectedDepartment);
  }, [selectedDepartment]);

  // ===== NEW: Department Statistics =====
  const departmentStats = React.useMemo(() => {
    const stats = { ALL: { roleCount: ROLES.length, avgHourlyRate: 0, totalMaxHours: 0 } };
    
    // Calculate stats for each department
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

  // ===== ENHANCED: Load Schedule Data =====
  useEffect(() => {
    setIsLoading(true);
    const generatedForecast = generateInitialScheduleSlots(forecastData || []);
    const storedSchedule = localStorage.getItem(LOCAL_STORAGE_KEY);
    const loadedSchedule = loadSchedule(forecastData || [], storedSchedule);

    setScheduleData(loadedSchedule);
    setForecastGeneratedSchedule(generatedForecast);
    setIsLoading(false);
  }, [forecastData]);

  // ===== ENHANCED: Update Schedule =====
  const handleUpdateSchedule = (date, roleName, shift, slotIndex, field, value) => {
    setScheduleData(prev => updateSlotInSchedule(prev, date, roleName, shift, slotIndex, field, value));
  };

  // ===== ENHANCED: Save Schedule =====
  const saveScheduleToLocalStorage = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scheduleData));
    toast({
      title: "Schedule Saved!",
      description: `Your enhanced labor schedule has been saved locally. Showing ${filteredRoles.length} roles in ${selectedDepartment === 'ALL' ? 'all departments' : selectedDepartment}.`,
      action: <Save className="text-green-500" />,
    });
  };

  // ===== EXISTING: Print Functionality =====
  const handlePrint = () => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(new Date(currentDate).setDate(currentDate.getDate() + diffToMonday));
    const weekEnd = new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));

    const formattedPrintDate = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    setPrintDate(formattedPrintDate);

    // Create a simple printable version
    const printContent = `
      <h1>Enhanced Weekly Labor Schedule - ${formattedPrintDate}</h1>
      <p>Template: Mopped Restaurant (13 Roles)</p>
      <p>Department: ${selectedDepartment}</p>
      <p>Roles Shown: ${filteredRoles.length} of ${ROLES.length}</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
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
        <head><title>Enhanced Weekly Labor Schedule - Print</title></head>
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

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">Loading enhanced schedule...</p>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
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
          <Card className="glassmorphic-card no-print">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground flex flex-col items-center py-10">
                <Info size={48} className="mb-4 text-primary" />
                <p className="text-lg font-semibold text-foreground">No Template Data</p>
                <p>Please check your laborScheduleConfig.jsx file.</p>
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
      <Card className="glassmorphic-card no-print">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-blue-400">{ROLES.length}</div>
              <div className="text-muted-foreground">Total Roles</div>
            </div>
            <div>
              <div className="font-bold text-green-400">{filteredRoles.length}</div>
              <div className="text-muted-foreground">Filtered Roles</div>
            </div>
            <div>
              <div className="font-bold text-purple-400">4</div>
              <div className="text-muted-foreground">Departments</div>
            </div>
            <div>
              <div className="font-bold text-orange-400">3</div>
              <div className="text-muted-foreground">Shift Types</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyLaborSchedule;
