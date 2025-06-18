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

    // Add Manager AM row manually if not already present
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


export {
  loadSchedule,
  updateSlotInSchedule,
  generateInitialScheduleSlots,
  fetchForecastData,
  calculateOptimalStaffing,
  autoAssignEmployees,
  calculateLaborCost
};
