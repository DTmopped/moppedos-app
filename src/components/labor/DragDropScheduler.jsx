
import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { format, addDays, startOfWeek } from 'date-fns';
import { supabase } from 'supabaseClient.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, Save, Printer, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { SPEND_PER_GUEST } from '@/config/laborScheduleConfig.jsx';
import { useSchedulerDataManagement } from '@/components/labor/hooks/useSchedulerDataManagement';
import { useShiftDragHandler } from '@/components/labor/hooks/useShiftDragHandler';
import { 
  fetchForecastData, 
  calculateOptimalStaffing, 
  autoAssignEmployees,
  calculateLaborCost 
} from '@/lib/laborScheduleUtils.jsx';
import PrintableLaborSchedule from '@/components/labor/PrintableLaborSchedule.jsx';
import UnassignedEmployeesPanel from '@/components/labor/UnassignedEmployeesPanel.jsx';
import DailyScheduleCard from '@/components/labor/DailyScheduleCard.jsx';

const DragDropScheduler = ({ initialWeekStartDate = new Date() }) => {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(initialWeekStartDate, { weekStartsOn: 1 }));
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const [forecastData, setForecastData] = useState([]);  // Initialize as empty array instead of null
  const [optimalStaffing, setOptimalStaffing] = useState({});
  const [laborCosts, setLaborCosts] = useState({});
  const [isProcessingDay, setIsProcessingDay] = useState(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(true);

  const {
    scheduleData,
    setScheduleData,
    employees,
    isLoading: isSchedulerLoading,
    scheduleId,
    localCurrentWeekDates,
    fetchShiftsAndFormatForUI,
  } = useSchedulerDataManagement(weekStartDate, toast);

  const { handleDragEnd } = useShiftDragHandler(
    scheduleId,
    employees,
    localCurrentWeekDates,
    toast,
    fetchShiftsAndFormatForUI, 
    setScheduleData 
  );
  
  useEffect(() => {
    if (scheduleData && employees.length > 0) {
      const assignedEmployeeIds = new Set();
      Object.values(scheduleData).forEach(daySlots => {
        Object.values(daySlots).forEach(shiftSlots => {
          Object.values(shiftSlots).forEach(roleSlots => {
            roleSlots.forEach(emp => {
              if (emp.id && !emp.id.startsWith('empty-')) { 
                assignedEmployeeIds.add(emp.id);
              }
            });
          });
        });
      });
      setUnassignedEmployees(employees.filter(emp => !assignedEmployeeIds.has(emp.id)));
    } else if (employees.length > 0) {
      setUnassignedEmployees([...employees]);
    } else {
      setUnassignedEmployees([]);
    }
  }, [scheduleData, employees]);

  useEffect(() => {
    const loadForecastData = async () => {
      setIsLoadingForecast(true);
      try {
        const weekStart = format(weekStartDate, 'yyyy-MM-dd');
        const weekEnd = format(addDays(weekStartDate, 6), 'yyyy-MM-dd');
        
        const data = await fetchForecastData(weekStart, weekEnd);
        setForecastData(data || []); // Ensure we always have an array
        
        if (data) {
          const optimal = {};
          const currentWeekDays = localCurrentWeekDates();
          currentWeekDays.forEach(date => {
            optimal[date] = calculateOptimalStaffing(data, date);
          });
          setOptimalStaffing(optimal);
        }
      } catch (error) {
        console.error('Error loading forecast data:', error);
        toast({
          title: "Error loading forecast data",
          description: "Using default staffing levels",
          variant: "destructive"
        });
        setForecastData([]); // Set empty array as fallback
      } finally {
        setIsLoadingForecast(false);
      }
    };
    
    loadForecastData();
  }, [weekStartDate, localCurrentWeekDates, toast]);

  useEffect(() => {
    const calculateAllLaborCosts = async () => {
      if (!scheduleId) return;
      
      try {
        const costs = {};
        const currentWeekDays = localCurrentWeekDates();
        
        for (const date of currentWeekDays) {
          const forecastForDate = (forecastData || []).find(f => f.date === date);
          const projectedSales = forecastForDate 
            ? (forecastForDate.projectedGuests || 0) * SPEND_PER_GUEST
            : 0;
          
          const cost = await calculateLaborCost(scheduleId, date, projectedSales);
          if (cost) {
            costs[date] = cost;
          }
        }
        
        setLaborCosts(costs);
      } catch (error) {
        console.error('Error calculating labor costs:', error);
        toast({
          title: "Error calculating labor costs",
          description: "Some cost calculations may be incomplete",
          variant: "destructive"
        });
      }
    };
    
    if (scheduleData && Object.keys(scheduleData).length > 0) {
      calculateAllLaborCosts();
    }
  }, [scheduleData, forecastData, scheduleId, localCurrentWeekDates, toast]);

  const handleTimeChange = async (shiftIdToUpdate, field, value) => {
    try {
      setScheduleData(prev => {
        if (!prev) return prev; // Add null check
        const newSchedule = JSON.parse(JSON.stringify(prev));
        let found = false;
        for (const date of Object.keys(newSchedule)) {
          if (found) break;
          for (const shiftType of Object.keys(newSchedule[date])) {
            if (found) break;
            for (const roleName of Object.keys(newSchedule[date][shiftType])) {
              if (found) break;
              const empIndex = newSchedule[date][shiftType][roleName].findIndex(emp => emp.shift_id === shiftIdToUpdate);
              if (empIndex !== -1) {
                newSchedule[date][shiftType][roleName][empIndex][field] = value;
                found = true; 
              }
            }
          }
        }
        return newSchedule;
      });

      const { error } = await supabase
        .from('shifts')
        .update({ [field]: value })
        .eq('id', shiftIdToUpdate);

      if (error) throw error;

      toast({ 
        title: "Time Updated", 
        description: "Shift time saved successfully." 
      });

      if (scheduleId) {
        const updatedShifts = await fetchShiftsAndFormatForUI(scheduleId, employees, localCurrentWeekDates());
        setScheduleData(updatedShifts);
      }
    } catch (error) {
      console.error('Error updating time:', error);
      toast({ 
        title: "Error updating time", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const publishSchedule = async () => { 
    if (!scheduleId) {
      toast({ 
        title: "Cannot publish", 
        description: "Schedule ID is missing.", 
        variant: "destructive" 
      });
      return;
    }

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'published', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', scheduleId);
      
      if (error) throw error;

      toast({ 
        title: "Schedule Published!", 
        description: "The schedule has been marked as published.", 
        className: "bg-green-500 text-white" 
      });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      toast({ 
        title: "Error publishing schedule", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  const printSchedule = () => {
    window.print();
  };
  
  const changeWeek = (direction) => {
    setWeekStartDate(prev => addDays(prev, direction * 7));
  };
  
  const handleAutoSchedule = async (date) => {
    if (!scheduleId) {
      toast({
        title: "Cannot auto-schedule",
        description: "Missing schedule information.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessingDay(date);
    try {
      const optimal = calculateOptimalStaffing(forecastData, date);
      if (!optimal) {
        throw new Error("No forecast data available for this date.");
      }
          
      const assignments = await autoAssignEmployees(scheduleId, date, optimal);
      
      if (assignments && assignments.length > 0) {
        toast({
          title: "Auto-scheduling complete",
          description: `${assignments.length} shifts have been updated/assigned automatically.`,
        });
        
        const updatedShifts = await fetchShiftsAndFormatForUI(scheduleId, employees, localCurrentWeekDates());
        setScheduleData(updatedShifts);
      } else {
        toast({
          title: "No changes made",
          description: "Could not find suitable assignments or no changes needed.",
          variant: "default", 
        });
      }
    } catch (error) {
      console.error('Error in auto-scheduling:', error);
      toast({
        title: "Auto-scheduling failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingDay(null);
    }
  };

  if (isSchedulerLoading || isLoadingForecast) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-slate-900/50 rounded-lg">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
        <p className="ml-4 text-lg text-slate-300">Loading Schedule...</p>
      </div>
    );
  }

  // Add null check for scheduleData
  if (!scheduleData) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-slate-900/50 rounded-lg">
        <p className="text-lg text-slate-300">No schedule data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 no-print">
      <Card className="glassmorphic-card bg-slate-800/80 border-slate-700 shadow-2xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between pb-2 p-4 space-y-3 md:space-y-0">
          <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Weekly Schedule
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => changeWeek(-1)} 
              variant="outline" 
              size="sm" 
              className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-purple-300"
            >
              Prev
            </Button>
            <span className="text-md md:text-lg font-semibold text-slate-300 whitespace-nowrap">
              {format(weekStartDate, 'MMM dd')} - {format(addDays(weekStartDate, 6), 'MMM dd, yyyy')}
            </span>
            <Button 
              onClick={() => changeWeek(1)} 
              variant="outline" 
              size="sm" 
              className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-pink-300"
            >
              Next
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={publishSchedule} 
              variant="default" 
              disabled={isPublishing || isSchedulerLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
            <Button 
              onClick={printSchedule} 
              variant="outline" 
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row gap-4">
              <UnassignedEmployeesPanel 
                unassignedEmployees={unassignedEmployees}
                employees={employees}
              />
             <LaborScheduleGrid 
               scheduleData={scheduleData} 
               weekDates={localCurrentWeekDates()}
               isManager={true} // or false depending on current user's access
              />
                    key={date}
                    date={date}
                    scheduleDataForDay={scheduleData[date] || {}}  // Add null check with default empty object
                    laborCostForDay={laborCosts[date]}
                    optimalStaffingForDay={optimalStaffing[date]}
                    handleAutoSchedule={handleAutoSchedule}
                    handleTimeChange={handleTimeChange}
                    isProcessingDay={isProcessingDay}
                    isSchedulerLoading={isSchedulerLoading}
                  />
                ))}
              </div>
            </div>
          </DragDropContext>
        </CardContent>
      </Card>

      <div className="print-visible hidden">
        <PrintableLaborSchedule 
          scheduleData={scheduleData} 
          weekStartDate={weekStartDate} 
          employees={employees} 
        />
      </div>
    </div>
  );
};

export default DragDropScheduler;
