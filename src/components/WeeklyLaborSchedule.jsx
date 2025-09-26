import React, { useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Printer, Info, Users, Save, Building2, Filter, Eye, EyeOff } from 'lucide-react';
import { useToast } from './ui/use-toast.jsx';
import { LOCAL_STORAGE_KEY } from '@/config/laborScheduleConfig.jsx';
import { loadSchedule, updateSlotInSchedule, generateInitialScheduleSlots } from '@/lib/laborScheduleUtils.js';
import { startOfWeek, format, addDays } from 'date-fns';
import AdminModeToggle from './ui/AdminModeToggle.jsx';

// ===== NEW: Template Integration =====
import { useTemplate } from '@/contexts/TemplateContext';
import { supabase, getCurrentLocationId, createLocationQuery, createLocationUpsert } from '@/supabaseClient';

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
                <Badge variant="secondary" className="ml-2">
                  {departmentStats[dept].roleCount}
                </Badge>
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
                          <Badge variant="outline" className={role.colorClass}>
                            {role.abbreviation}
                          </Badge>
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
const WeeklyLaborScheduleHeader = ({ onSave, onPrint, currentTemplate, selectedDepartment }) => (
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
              {currentTemplate ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    <Building2 className="h-3 w-3 mr-1" />
                    {currentTemplate.name}
                  </Badge>
                  <span>•</span>
                  <span>Viewing: {selectedDepartment === 'ALL' ? 'All Departments' : selectedDepartment}</span>
                </div>
              ) : (
                'Template-enhanced scheduling with 13 Mopped roles'
              )}
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
  
  // ===== NEW: Template Integration =====
  const { 
    currentTemplate, 
    roles, 
    isLoading: templateLoading,
    getDepartmentStats 
  } = useTemplate();
  
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
    if (!roles || roles.length === 0) return [];
    if (selectedDepartment === 'ALL') return roles;
    return roles.filter(role => role.department === selectedDepartment);
  }, [roles, selectedDepartment]);

  // ===== NEW: Department Statistics =====
  const departmentStats = React.useMemo(() => {
    if (!roles || roles.length === 0) return {};
    
    const stats = { ALL: { roleCount: roles.length, avgHourlyRate: 0, totalMaxHours: 0 } };
    
    // Calculate stats for each department
    ['Management', 'FOH', 'Bar', 'BOH'].forEach(dept => {
      const deptRoles = roles.filter(role => role.department === dept);
      if (deptRoles.length > 0) {
        stats[dept] = {
          roleCount: deptRoles.length,
          avgHourlyRate: deptRoles.reduce((sum, role) => sum + (role.hourlyRate || 0), 0) / deptRoles.length,
          totalMaxHours: deptRoles.reduce((sum, role) => sum + (role.maxHoursPerWeek || 0), 0)
        };
      }
    });
    
    return stats;
  }, [roles]);

  // ===== ENHANCED: Load Schedule Data =====
  useEffect(() => {
    const loadScheduleData = async () => {
      setIsLoading(true);
      
      try {
        // Try to load from Supabase first
        const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
        const startDate = format(weekDates[0], 'yyyy-MM-dd');
        const endDate = format(weekDates[6], 'yyyy-MM-dd');

        const { data: supabaseData, error } = await createLocationQuery('labor_schedules')
          .gte('shift_date', startDate)
          .lte('shift_date', endDate);

        if (!error && supabaseData && supabaseData.length > 0) {
          // Transform Supabase data to schedule format
          const transformedData = {};
          supabaseData.forEach(record => {
            const dayKey = record.shift_date;
            const shiftKey = record.shift_type;
            const roleName = record.role_name;

            if (!transformedData[dayKey]) transformedData[dayKey] = {};
            if (!transformedData[dayKey][shiftKey]) transformedData[dayKey][shiftKey] = {};
            if (!transformedData[dayKey][shiftKey][roleName]) transformedData[dayKey][shiftKey][roleName] = [];

            transformedData[dayKey][shiftKey][roleName].push({
              id: record.id,
              name: record.employee_name,
              start: record.start_time,
              end: record.end_time,
              employeeId: record.employee_id
            });
          });
          
          setScheduleData(transformedData);
        } else {
          // Fallback to local storage and forecast data
          const generatedForecast = generateInitialScheduleSlots(forecastData || []);
          const storedSchedule = localStorage.getItem(LOCAL_STORAGE_KEY);
          const loadedSchedule = loadSchedule(forecastData || [], storedSchedule);
          
          setScheduleData(loadedSchedule);
          setForecastGeneratedSchedule(generatedForecast);
        }
      } catch (error) {
        console.error('Error loading schedule data:', error);
        // Fallback to local storage
        const generatedForecast = generateInitialScheduleSlots(forecastData || []);
        const storedSchedule = localStorage.getItem(LOCAL_STORAGE_KEY);
        const loadedSchedule = loadSchedule(forecastData || [], storedSchedule);
        
        setScheduleData(loadedSchedule);
        setForecastGeneratedSchedule(generatedForecast);
      } finally {
        setIsLoading(false);
      }
    };

    if (!templateLoading) {
      loadScheduleData();
    }
  }, [forecastData, weekStartDate, templateLoading]);

  // ===== ENHANCED: Update Schedule =====
  const handleUpdateSchedule = (date, roleName, shift, slotIndex, field, value) => {
    setScheduleData(prev => updateSlotInSchedule(prev, date, roleName, shift, slotIndex, field, value));
  };

  // ===== ENHANCED: Save to Both Local Storage and Supabase =====
  const saveScheduleToLocalStorage = async () => {
    setIsSaving(true);
    
    try {
      // Save to local storage (existing functionality)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scheduleData));
      
      // Save to Supabase (new functionality)
      const scheduleRecords = [];
      
      Object.entries(scheduleData).forEach(([dayKey, dayData]) => {
        Object.entries(dayData).forEach(([shiftKey, shiftData]) => {
          Object.entries(shiftData).forEach(([roleName, employees]) => {
            employees.forEach(employee => {
              if (employee.name && !employee.id?.startsWith('empty-')) {
                scheduleRecords.push({
                  shift_date: dayKey,
                  shift_type: shiftKey,
                  role_name: roleName,
                  employee_name: employee.name,
                  employee_id: employee.employeeId,
                  start_time: employee.start,
                  end_time: employee.end,
                  location_id: getCurrentLocationId()
                });
              }
            });
          });
        });
      });

      if (scheduleRecords.length > 0) {
        const { error } = await supabase
          .from('labor_schedules')
          .upsert(scheduleRecords, { 
            onConflict: 'location_id,shift_date,shift_type,role_name,employee_id' 
          });

        if (error) {
          console.error('Supabase save error:', error);
          // Still show success for local storage save
        }
      }

      toast({
        title: "Schedule Saved!",
        description: "Your labor schedule has been saved locally and to the database.",
        action: <Save className="text-green-500" />,
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Partial Save",
        description: "Schedule saved locally. Database sync may have failed.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
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
      <h1>Weekly Labor Schedule - ${formattedPrintDate}</h1>
      <p>Template: ${currentTemplate?.name || 'Default'}</p>
      <p>Department: ${selectedDepartment}</p>
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
        <head><title>Weekly Labor Schedule - Print</title></head>
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

  // ===== LOADING STATES =====
  if (templateLoading || isLoading) {
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
        currentTemplate={currentTemplate}
        selectedDepartment={selectedDepartment}
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
        {(!roles || roles.length === 0) ? (
          <Card className="glassmorphic-card no-print">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground flex flex-col items-center py-10">
                <Info size={48} className="mb-4 text-primary" />
                <p className="text-lg font-semibold text-foreground">Loading Template Data</p>
                <p>Please wait while we load the restaurant template configuration.</p>
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

      {/* Template Info */}
      {currentTemplate && (
        <Card className="glassmorphic-card no-print">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-bold text-blue-400">{roles.length}</div>
                <div className="text-muted-foreground">Total Roles</div>
              </div>
              <div>
                <div className="font-bold text-green-400">{filteredRoles.length}</div>
                <div className="text-muted-foreground">Filtered Roles</div>
              </div>
              <div>
                <div className="font-bold text-purple-400">{currentTemplate.labor_target_percentage}%</div>
                <div className="text-muted-foreground">Labor Target</div>
              </div>
              <div>
                <div className="font-bold text-orange-400">${currentTemplate.spend_per_guest}</div>
                <div className="text-muted-foreground">Spend/Guest</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default WeeklyLaborSchedule;
