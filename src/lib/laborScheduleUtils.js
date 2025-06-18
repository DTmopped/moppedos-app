// laborScheduleUtils.js

import { supabase } from '@/supabaseClient';
import { SPEND_PER_GUEST, SHIFT_SPLIT, SHIFT_TIMES, ROLES } from '@/config/laborScheduleConfig';

const createDefaultScheduleStructure = () => {
  const defaultStructure = {};
  const today = new Date();

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday as start of week

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    defaultStructure[dateString] = [];

    ROLES.forEach(role => {
      role.shifts.forEach(shift => {
        const defaultTimes = SHIFT_TIMES[shift] || { start: '', end: '' };
        const count = role.name === 'Shift Lead' && shift === 'SWING' ? 1 : (role.minCount || 1);

        for (let j = 0; j < count; j++) {
          defaultStructure[dateString].push({
            role: role.name,
            shift: shift,
            slotIndex: j,
            employeeName: '',
            startTime: defaultTimes.start,
            endTime: defaultTimes.end,
            colorClass: role.colorClass,
          });
        }
      });
    });

    defaultStructure[dateString].push({
      role: 'Manager',
      shift: 'AM',
      slotIndex: 0,
      employeeName: '',
      startTime: SHIFT_TIMES.AM.start,
      endTime: SHIFT_TIMES.AM.end,
      colorClass: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white',
    });

    defaultStructure[dateString].sort((a, b) => {
      const roleAIndex = ROLES.findIndex(r => r.name === a.role);
      const roleBIndex = ROLES.findIndex(r => r.name === b.role);
      if (roleAIndex !== roleBIndex) return roleAIndex - roleBIndex;
      if (a.shift !== b.shift) return a.shift.localeCompare(b.shift);
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
        if (role.name === 'Shift Lead' && shift === 'SWING') {
          count = 1;
        }

        const defaultTimes = SHIFT_TIMES[shift] || { start: '', end: '' };
        for (let i = 0; i < count; i++) {
          newSchedule[day.date].push({
            role: role.name,
            shift: shift,
            slotIndex: i,
            employeeName: '',
            startTime: defaultTimes.start,
            endTime: defaultTimes.end,
            colorClass: role.colorClass,
          });
        }
      });
    });

    newSchedule[day.date].push({
      role: 'Manager',
      shift: 'AM',
      slotIndex: 0,
      employeeName: '',
      startTime: SHIFT_TIMES.AM.start,
      endTime: SHIFT_TIMES.AM.end,
      colorClass: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white',
    });

    newSchedule[day.date].sort((a, b) => {
      const roleAIndex = ROLES.findIndex(r => r.name === a.role);
      const roleBIndex = ROLES.findIndex(r => r.name === b.role);
      if (roleAIndex !== roleBIndex) return roleAIndex - roleBIndex;
      if (a.shift !== b.shift) return a.shift.localeCompare(b.shift);
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
  const generatedSchedule = generateInitialScheduleSlots(forecastData);
  if (!storedScheduleJSON) return generatedSchedule;

  const storedSchedule = JSON.parse(storedScheduleJSON);
  const initialSchedule = { ...generatedSchedule };

  Object.keys(initialSchedule).forEach(date => {
    if (storedSchedule[date]) {
      initialSchedule[date].forEach(newSlot => {
        const oldSlot = storedSchedule[date].find(
          s =>
            s.role === newSlot.role &&
            s.shift === newSlot.shift &&
            s.slotIndex === newSlot.slotIndex
        );
        if (oldSlot) {
          newSlot.employeeName = oldSlot.employeeName || '';
          newSlot.startTime = oldSlot.startTime || newSlot.startTime;
          newSlot.endTime = oldSlot.endTime || newSlot.endTime;
        }
      });
    }
  });

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

export const fetchForecastData = async () => {
  const { data, error } = await supabase.from('weekly_forecast').select('*');
  if (error) {
    console.error('Error fetching forecast:', error);
    return [];
  }
  return data;
};

export const calculateOptimalStaffing = (guestCount, roleRatio) => {
  return Math.ceil(guestCount / roleRatio);
};

export const autoAssignEmployees = (schedule, employeeList) => {
  const updatedSchedule = { ...schedule };
  Object.keys(updatedSchedule).forEach(date => {
    updatedSchedule[date] = updatedSchedule[date].map((slot, idx) => ({
      ...slot,
      employeeName: employeeList[idx % employeeList.length] || '',
    }));
  });
  return updatedSchedule;
};

export const calculateLaborCost = (schedule, hourlyRate = 18) => {
  let totalHours = 0;
  Object.values(schedule).forEach(day => {
    day.forEach(slot => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const duration = ((endHour + endMin / 60) - (startHour + startMin / 60));
      totalHours += Math.max(duration, 0);
    });
  });
  return totalHours * hourlyRate;
};


