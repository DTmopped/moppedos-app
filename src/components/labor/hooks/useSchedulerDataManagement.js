
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { ROLES, SHIFT_TIMES } from '@/config/laborScheduleConfig.js';

const initializeEmptyScheduleDataForUI = (weekDates) => {
  const newSchedule = {};
  weekDates.forEach(date => {
    newSchedule[date] = {};
    Object.keys(SHIFT_TIMES).forEach(shiftKey => {
      newSchedule[date][shiftKey] = {};
      ROLES.forEach(role => {
        newSchedule[date][shiftKey][role.name] = [];
      });
    });
  });
  return newSchedule;
};

export const useSchedulerDataManagement = (weekStartDate, toast) => {
  const [scheduleData, setScheduleDataState] = useState(() => {
    // Initialize with empty schedule data structure
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekStartDate, i), 'yyyy-MM-dd')
    );
    return initializeEmptyScheduleDataForUI(dates);
  });
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleId, setScheduleId] = useState(null);

  const localCurrentWeekDates = useCallback(() =>
    Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekStartDate, i), 'yyyy-MM-dd')
    ), [weekStartDate]);

  const fetchShiftsAndFormatForUI = useCallback(async (currentScheduleIdToFetch, allEmployees, weekDatesToFormat) => {
    try {
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*, employees(*)')
        .eq('schedule_id', currentScheduleIdToFetch);

      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        toast({ title: "Error fetching shifts", description: shiftsError.message, variant: "destructive" });
        return initializeEmptyScheduleDataForUI(weekDatesToFormat);
      }

      const formattedSchedule = initializeEmptyScheduleDataForUI(weekDatesToFormat);

      (shiftsData || []).forEach(shift => {
        const dateKey = format(parseISO(shift.day), 'yyyy-MM-dd');
        if (formattedSchedule[dateKey]?.[shift.shift_type]?.[shift.role]) {
          if (shift.employees) {
            formattedSchedule[dateKey][shift.shift_type][shift.role].push({
              ...shift.employees,
              shift_id: shift.id,
              startTime: shift.start_time,
              endTime: shift.end_time,
            });
          } else {
            formattedSchedule[dateKey][shift.shift_type][shift.role].push({
              id: `empty-${shift.id}`,
              shift_id: shift.id,
              name: "Empty Slot",
              role: shift.role,
              startTime: shift.start_time,
              endTime: shift.end_time,
            });
          }
        }
      });

      return formattedSchedule;
    } catch (error) {
      console.error('Error in fetchShiftsAndFormatForUI:', error);
      toast({ 
        title: "Error formatting schedule data", 
        description: "Failed to process schedule information", 
        variant: "destructive" 
      });
      return initializeEmptyScheduleDataForUI(weekDatesToFormat);
    }
  }, [toast]);

  const initializeEmptyScheduleWithSlots = useCallback(async (newScheduleId, weekDatesToInit, currentEmployees) => {
    try {
      const shiftsToCreate = [];
      weekDatesToInit.forEach(date => {
        ROLES.forEach(role => {
          (role.shifts || Object.keys(SHIFT_TIMES)).forEach(shiftType => {
            shiftsToCreate.push({
              schedule_id: newScheduleId,
              role: role.name,
              shift_type: shiftType,
              day: date,
              start_time: SHIFT_TIMES[shiftType]?.start || "00:00",
              end_time: SHIFT_TIMES[shiftType]?.end || "00:00",
              employee_id: null,
            });
          });
        });
      });

      if (shiftsToCreate.length > 0) {
        const { error } = await supabase.from('shifts').insert(shiftsToCreate);
        if (error) {
          console.error('Error creating default shift slots:', error);
          toast({ title: "Error creating default shifts", description: error.message, variant: "destructive" });
          return initializeEmptyScheduleDataForUI(weekDatesToInit);
        }
      }

      const newScheduleData = await fetchShiftsAndFormatForUI(newScheduleId, currentEmployees, weekDatesToInit);
      setScheduleDataState(newScheduleData);
      return newScheduleData;
    } catch (error) {
      console.error('Error in initializeEmptyScheduleWithSlots:', error);
      toast({ 
        title: "Error initializing schedule", 
        description: "Failed to create initial schedule structure", 
        variant: "destructive" 
      });
      return initializeEmptyScheduleDataForUI(weekDatesToInit);
    }
  }, [toast, fetchShiftsAndFormatForUI]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const weekDates = localCurrentWeekDates();
        const weekStart = weekDates[0];

        // Initialize with empty schedule structure
        const emptySchedule = initializeEmptyScheduleDataForUI(weekDates);
        setScheduleDataState(emptySchedule);

        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('*');

        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          toast({ title: "Error fetching employees", description: employeesError.message, variant: "destructive" });
          setEmployees([]);
        } else {
          setEmployees(employeesData || []);
        }

        // Fetch or create schedule
        const { data: scheduleEntry, error: scheduleFetchError } = await supabase
          .from('schedules')
          .select('id, status')
          .eq('week_start_date', weekStart)
          .single();

        if (scheduleFetchError && scheduleFetchError.code !== 'PGRST116') {
          console.error('Error fetching schedule entry:', scheduleFetchError);
          toast({ title: "Error fetching schedule", description: scheduleFetchError.message, variant: "destructive" });
        } else if (scheduleEntry) {
          setScheduleId(scheduleEntry.id);
          const scheduleUIData = await fetchShiftsAndFormatForUI(scheduleEntry.id, employeesData || [], weekDates);
          setScheduleDataState(scheduleUIData);
        } else {
          const { data: newSchedule, error: createError } = await supabase
            .from('schedules')
            .insert([{ week_start_date: weekStart, status: 'draft' }])
            .select('id, status')
            .single();

          if (createError) {
            console.error('Error creating schedule:', createError);
            toast({ title: "Error creating schedule", description: createError.message, variant: "destructive" });
          } else if (newSchedule) {
            setScheduleId(newSchedule.id);
            await initializeEmptyScheduleWithSlots(newSchedule.id, weekDates, employeesData || []);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({ 
          title: "Error loading schedule", 
          description: "Failed to load schedule data", 
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [weekStartDate, toast, localCurrentWeekDates, initializeEmptyScheduleWithSlots, fetchShiftsAndFormatForUI]);

  return {
    scheduleData,
    setScheduleData: setScheduleDataState,
    employees,
    isLoading,
    scheduleId,
    localCurrentWeekDates,
    fetchShiftsAndFormatForUI,
  };
};
