import React from 'react';

export const SPEND_PER_GUEST = 15;

export const SHIFT_SPLIT = { AM: 0.5, PM: 0.4, SWING: 0.1 };

export const SHIFT_TIMES = {
  AM: { start: "08:30", end: "16:30" },
  PM: { start: "15:00", end: "23:00" },
  SWING: { start: "10:00", end: "18:00" }
};

export const ROLES = [
  { name: "Meat Portioner", abbreviation: "MP", ratio: 50, shifts: ["AM", "PM"], minCount: 1, colorClass: "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100 print:bg-red-100" },
  { name: "Side Portioner", abbreviation: "SP", ratio: 50, shifts: ["AM", "PM"], minCount: 1, colorClass: "bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100 print:bg-orange-100" },
  { name: "Food Gopher", abbreviation: "FG", ratio: 125, shifts: ["AM", "PM"], minCount: 1, colorClass: "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 print:bg-yellow-100" },
  { name: "Kitchen Swing", abbreviation: "KS", ratio: 75, shifts: ["SWING"], minCount: 1, colorClass: "bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-lime-100 print:bg-lime-100" },
  { name: "Cashier", abbreviation: "CSH", ratio: 75, shifts: ["AM", "PM"], minCount: 1, colorClass: "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100 print:bg-green-100" },
  { name: "Cashier Swing", abbreviation: "CSS", ratio: 75, shifts: ["SWING"], minCount: 1, colorClass: "bg-teal-200 text-teal-800 dark:bg-teal-700 dark:text-teal-100 print:bg-teal-100" },
  { name: "Shift Lead", abbreviation: "SL", ratio: 150, shifts: ["SWING"], minCount: 1, colorClass: "bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100 print:bg-blue-100" },
  { name: "Bartender", abbreviation: "BAR", ratio: 150, shifts: ["AM", "PM"], minCount: 1, colorClass: "bg-indigo-200 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100 print:bg-indigo-100" }
]; // ✅ <-- this bracket was missing

export const SHIFT_BG_CLASSES = {
  AM: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 print:bg-amber-100",
  PM: "bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100 print:bg-blue-100", 
  SWING: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 print:bg-purple-100",
};

export const LOCAL_STORAGE_KEY = 'editableWeeklyLaborSchedule';
