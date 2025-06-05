import { supabase } from '@/supabaseClient';
import { SPEND_PER_GUEST, SHIFT_SPLIT, SHIFT_TIMES, ROLES } from '@/config/laborScheduleConfig';

const createDefaultScheduleStructure = () => {
  const defaultStructure = {};
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i); 
    const dateString = date.toISOString().split('T')[0];
    defaultStructure[dateString] = [];
    ROLES.forEach(role => {
      role.shifts.forEach(shift => {
        const defaultTimes = SHIFT_TIMES[shift] || { start: "", end: "" };
        const count = role.name === "Shift Lead" && shift === "SWING" ? 1 : (role.minCount || 1);
        for (let j = 0; j < count; j++) {
          defaultStructure[dateString].push({
            role: role.name,
            shift: shift,
            slotIndex: j,
            employeeName: "",
            startTime: defaultTimes.start,
            endTime: defaultTimes.end,
            colorClass: role.colorClass,
          });
        }
      });
    });
     defaultStructure[dateString].sort((a,b) => {
        const roleAIndex = ROLES.findIndex(r => r.name === a.role);
        const roleBIndex = ROLES.findIndex(r => r.name === b.role);
        if(roleAIndex !== roleBIndex) return roleAIndex - roleBIndex;
        if(a.shift !== b.shift) return a.shift.localeCompare(b.shift);
        return a.slotIndex - b.slotIndex;
    });
  }
  return defaultStructure;
};


export const generateInitialScheduleSlots = (forecastData) => {
  if (!forecastData || forecastData.length === 0) {
    return createDefaultScheduleStructure();
  }

  const newSchedule = {};
  forecastData.forEach(day => {
    const guests = (day.forecastSales || 0) / SPEND_PER_GUEST;
    newSchedule[day.date] = [];

    ROLES.forEach(role => {
      role.shifts.forEach(shift => {
        const portion = SHIFT_SPLIT[shift] || 0;
        const shiftGuests = guests * portion;
        let count = Math.max(role.minCount || 1, Math.ceil(shiftGuests / role.ratio));
        if (role.name === "Shift Lead" && shift === "SWING") {
            count = 1; 
        }
        
        const defaultTimes = SHIFT_TIMES[shift] || { start: "", end: "" };
        for (let i = 0; i < count; i++) {
          newSchedule[day.date].push({
            role: role.name,
            shift: shift,
            slotIndex: i,
            employeeName: "",
            startTime: defaultTimes.start,
            endTime: defaultTimes.end,
            colorClass: role.colorClass,
          });
        }
      });
    });
     newSchedule[day.date].sort((a,b) => {
        const roleAIndex = ROLES.findIndex(r => r.name === a.role);
        const roleBIndex = ROLES.findIndex(r => r.name === b.role);
        if(roleAIndex !== roleBIndex) return roleAIndex - roleBIndex;
        if(a.shift !== b.shift) return a.shift.localeCompare(b.shift);
        return a.slotIndex - b.slotIndex;
    });
  });

  const forecastDates = forecastData.map(d => d.date);
  const defaultStructure = createDefaultScheduleStructure();
  Object.keys(defaultStructure).forEach(dateKey => {
    if (!forecastDates.includes(dateKey)) {
      newSchedule[dateKey] = defaultStructure[dateKey];
    }
  });
  
  return newSchedule;
};


export const loadSchedule = (forecastData, storedScheduleJSON) => {
  let initialSchedule;
  const generatedSchedule = generateInitialScheduleSlots(forecastData);

  if (storedScheduleJSON) {
    const storedSchedule = JSON.parse(storedScheduleJSON);
    initialSchedule = { ...generatedSchedule }; 

    Object.keys(initialSchedule).forEach(date => {
      if (storedSchedule[date]) {
        initialSchedule[date].forEach(newSlot => {
          const oldSlot = storedSchedule[date].find(
            s => s.role === newSlot.role && s.shift === newSlot.shift && s.slotIndex === newSlot.slotIndex
          );
          if (oldSlot) {
            newSlot.employeeName = oldSlot.employeeName || "";
            newSlot.startTime = oldSlot.startTime || SHIFT_TIMES[newSlot.shift]?.start || "";
            newSlot.endTime = oldSlot.endTime || SHIFT_TIMES[newSlot.shift]?.end || "";
          }
        });
        
        storedSchedule[date].forEach(storedSlot => {
            const existsInInitial = initialSchedule[date].some(
                s => s.role === storedSlot.role && s.shift === storedSlot.shift && s.slotIndex === storedSlot.slotIndex
            );
            if (!existsInInitial) {
                 const roleConfig = ROLES.find(r => r.name === storedSlot.role);
                 if (roleConfig) { 
                    initialSchedule[date].push({
                        ...storedSlot,
                        startTime: storedSlot.startTime || SHIFT_TIMES[storedSlot.shift]?.start || "",
                        endTime: storedSlot.endTime || SHIFT_TIMES[storedSlot.shift]?.end || "",
                        colorClass: roleConfig.colorClass,
                    });
                 }
            }
        });

         initialSchedule[date].sort((a,b) => {
            const roleAIndex = ROLES.findIndex(r => r.name === a.role);
            const roleBIndex = ROLES.findIndex(r => r.name === b.role);
            if(roleAIndex !== roleBIndex) return roleAIndex - roleBIndex;
            if(a.shift !== b.shift) return a.shift.localeCompare(b.shift);
            return a.slotIndex - b.slotIndex;
        });

      }
    });
  } else {
    initialSchedule = generatedSchedule;
  }
  return initialSchedule;
};

export const updateSlotInSchedule = (currentSchedule, date, roleName, shift, slotIndex, field, value) => {
  const daySchedule = currentSchedule[date] || [];
  const updatedDaySchedule = daySchedule.map(slot => {
    if (slot.role === roleName && slot.shift === shift && slot.slotIndex === slotIndex) {
      return { ...slot, [field]: value };
    }
    return slot;
  });
  return { ...currentSchedule, [date]: updatedDaySchedule };
};

export const fetchForecastData = async (startDate, endDate) => {
  const forecastData = localStorage.getItem('forecastData');
  
  if (forecastData) {
    try {
      return JSON.parse(forecastData);
    } catch (error) {
      console.error('Error parsing forecast data:', error);
      return null;
    }
  }
  
  return null;
};

const getShiftPercentage = (shiftType) => {
  return SHIFT_SPLIT[shiftType] || 0;
};

export const calculateOptimalStaffing = (forecastData, date) => {
  if (!forecastData) return null;
  
  const dateForecast = forecastData.find(f => f.date === date);
  if (!dateForecast) return null;
  
  const projectedGuests = dateForecast.projectedGuests || 0;
  const projectedSales = projectedGuests * SPEND_PER_GUEST;
  
  const optimalStaffing = {};
  
  ROLES.forEach(role => {
    const guestsPerStaff = role.ratio;
    const requiredStaff = Math.ceil(projectedGuests / guestsPerStaff);
    
    role.shifts.forEach(shiftType => {
      const shiftPercentage = getShiftPercentage(shiftType);
      const staffForShift = Math.max(role.minCount || 1, Math.round(requiredStaff * shiftPercentage));
      
      if (!optimalStaffing[role.name]) {
        optimalStaffing[role.name] = {};
      }
      
      optimalStaffing[role.name][shiftType] = staffForShift;
    });
  });
  
  return {
    date,
    projectedGuests,
    projectedSales,
    optimalStaffing
  };
};

export const autoAssignEmployees = async (scheduleId, date, optimalStaffingData) => {
  if (!optimalStaffingData || !optimalStaffingData.optimalStaffing) {
    console.error('Invalid optimal staffing data provided to autoAssignEmployees');
    return null; 
  }
  
  const { data: allEmployees, error: employeesError } = await supabase
    .from('employees')
    .select('*');
  
  if (employeesError) {
    console.error('Error fetching employees for auto-assign:', employeesError);
    return null;
  }
  if (!allEmployees) {
    console.warn('No employees found in database for auto-assignment.');
    return null;
  }

  const { data: existingShifts, error: shiftsError } = await supabase
    .from('shifts')
    .select('*')
    .eq('schedule_id', scheduleId)
    .eq('day', date);
  
  if (shiftsError) {
    console.error('Error fetching existing shifts for auto-assign:', shiftsError);
    return null;
  }

  const employeesByRole = {};
  allEmployees.forEach(employee => {
    if (employee.role) {
      if (!employeesByRole[employee.role]) {
        employeesByRole[employee.role] = [];
      }
      employeesByRole[employee.role].push(employee);
    }
  });
  
  const assignments = [];
  
  Object.entries(optimalStaffingData.optimalStaffing).forEach(([roleName, shiftCounts]) => {
    Object.entries(shiftCounts).forEach(([shiftType, count]) => {
      const roleShifts = (existingShifts || []).filter(s => 
        s.role === roleName && s.shift_type === shiftType && !s.employee_id 
      );
      
      const availableEmployees = (employeesByRole[roleName] || []).filter(emp => 
        !(existingShifts || []).some(es => es.employee_id === emp.id && es.day === date)
      );
      
      for (let i = 0; i < Math.min(count, roleShifts.length); i++) {
        if (i < availableEmployees.length) {
          assignments.push({
            shiftId: roleShifts[i].id,
            employeeId: availableEmployees[i].id
          });
          
          const assignedEmployeeIndex = employeesByRole[roleName].findIndex(e => e.id === availableEmployees[i].id);
          if(assignedEmployeeIndex !== -1) {
           
          }
        }
      }
    });
  });
  
  let updatesMade = 0;
  for (const assignment of assignments) {
    const { error } = await supabase
      .from('shifts')
      .update({ employee_id: assignment.employeeId })
      .eq('id', assignment.shiftId);
    
    if (error) {
      console.error('Error assigning employee to shift:', error);
    } else {
      updatesMade++;
    }
  }
  
  console.log(`Auto-assignment attempted. ${updatesMade} shifts updated.`);
  return assignments; 
};


export const calculateLaborCost = async (scheduleId, date, projectedSales) => {
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('*, employees(*)')
    .eq('schedule_id', scheduleId)
    .eq('day', date);
  
  if (error) {
    console.error('Error fetching shifts for labor cost calculation:', error);
    return null;
  }
  
  let totalHours = 0;
  let totalLaborCost = 0;
  const averageHourlyRate = 15; 
  
  (shifts || []).forEach(shift => {
    if (shift.employee_id && shift.start_time && shift.end_time) {
      try {
        const startTimeParts = shift.start_time.split(':');
        const endTimeParts = shift.end_time.split(':');

        const startDate = new Date(0);
        startDate.setUTCHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), parseInt(startTimeParts[2] || '0', 10));
        
        const endDate = new Date(0);
        endDate.setUTCHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), parseInt(endTimeParts[2] || '0', 10));

        if (endDate < startDate) { 
          endDate.setDate(endDate.getDate() + 1);
        }
        
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        
        if (durationHours > 0) {
          totalHours += durationHours;
          totalLaborCost += durationHours * averageHourlyRate;
        }
      } catch (e) {
        console.error("Error parsing shift times:", shift.start_time, shift.end_time, e);
      }
    }
  });
  
  const laborCostPercentage = projectedSales > 0 
    ? (totalLaborCost / projectedSales) * 100 
    : 0;
  
  const targetPercentageValue = 18;

  return {
    totalHours: parseFloat(totalHours.toFixed(2)),
    totalLaborCost: parseFloat(totalLaborCost.toFixed(2)),
    laborCostPercentage: parseFloat(laborCostPercentage.toFixed(2)),
    projectedSales: projectedSales,
    targetPercentage: targetPercentageValue, 
    isOverTarget: laborCostPercentage > targetPercentageValue
  };
};
