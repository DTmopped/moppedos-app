import React from 'react';

// Enhanced Mopped Restaurant Configuration
export const SPEND_PER_GUEST = 45; // Updated from 15 to 45 for Mopped Restaurant

export const SHIFT_SPLIT = { AM: 0.5, PM: 0.4, SWING: 0.1 };

export const SHIFT_TIMES = {
  AM: { start: "08:30", end: "16:30" },
  PM: { start: "15:00", end: "23:00" },
  SWING: { start: "10:00", end: "18:00" }
};

// Complete 13-role structure including Dishwasher
export const ROLES = [
  // Back of House (BOH) - 5 roles
  { name: "Meat Portioner", abbreviation: "MP", ratio: 35, shifts: ["AM", "PM"], minCount: 1, department: "BOH", hourly_rate: 18.00, colorClass: "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100 print:bg-red-100" },
  { name: "Side Portioner", abbreviation: "SP", ratio: 40, shifts: ["AM", "PM"], minCount: 1, department: "BOH", hourly_rate: 17.00, colorClass: "bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100 print:bg-orange-100" },
  { name: "Food Gopher", abbreviation: "FG", ratio: 50, shifts: ["AM", "PM"], minCount: 1, department: "BOH", hourly_rate: 16.00, colorClass: "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 print:bg-yellow-100" },
  { name: "Dishwasher", abbreviation: "DW", ratio: 50, shifts: ["AM", "PM"], minCount: 1, department: "BOH", hourly_rate: 15.50, colorClass: "bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100 print:bg-emerald-100" },
  { name: "Kitchen Swing", abbreviation: "KS", ratio: 45, shifts: ["SWING"], minCount: 1, department: "BOH", hourly_rate: 17.50, colorClass: "bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-lime-100 print:bg-lime-100" },
  
  // Front of House (FOH) - 5 roles
  { name: "Cashier", abbreviation: "CSH", ratio: 25, shifts: ["AM", "PM"], minCount: 1, department: "FOH", hourly_rate: 16.50, colorClass: "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100 print:bg-green-100" },
  { name: "Server", abbreviation: "SRV", ratio: 20, shifts: ["AM", "PM"], minCount: 1, department: "FOH", hourly_rate: 15.00, colorClass: "bg-cyan-200 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-100 print:bg-cyan-100" },
  { name: "Server Assistant", abbreviation: "SA", ratio: 35, shifts: ["AM", "PM"], minCount: 1, department: "FOH", hourly_rate: 15.50, colorClass: "bg-sky-200 text-sky-800 dark:bg-sky-700 dark:text-sky-100 print:bg-sky-100" },
  { name: "Busser", abbreviation: "BUS", ratio: 40, shifts: ["AM", "PM"], minCount: 1, department: "FOH", hourly_rate: 15.00, colorClass: "bg-teal-200 text-teal-800 dark:bg-teal-700 dark:text-teal-100 print:bg-teal-100" },
  { name: "Cashier Swing", abbreviation: "CSS", ratio: 30, shifts: ["SWING"], minCount: 1, department: "FOH", hourly_rate: 16.50, colorClass: "bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100 print:bg-blue-100" },
  
  // Bar - 1 role
  { name: "Bartender", abbreviation: "BAR", ratio: 60, shifts: ["AM", "PM"], minCount: 1, department: "Bar", hourly_rate: 18.50, colorClass: "bg-indigo-200 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100 print:bg-indigo-100" },
  
  // Management - 2 roles
  { name: "Shift Lead", abbreviation: "SL", ratio: 80, shifts: ["SWING"], minCount: 1, department: "Management", hourly_rate: 22.00, colorClass: "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-100 print:bg-purple-100" },
  { name: "Manager", abbreviation: "MGR", ratio: 150, shifts: ["AM", "PM"], minCount: 1, department: "Management", hourly_rate: 28.00, colorClass: "bg-pink-200 text-pink-800 dark:bg-pink-700 dark:text-pink-100 print:bg-pink-100" }
];

export const SHIFT_BG_CLASSES = {
  AM: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 print:bg-amber-100",
  PM: "bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100 print:bg-blue-100", 
  SWING: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 print:bg-purple-100",
};

// Department configurations
export const DEPARTMENTS = {
  "FOH": { name: "Front of House", color: "blue", bgColor: "bg-blue-50", textColor: "text-blue-700" },
  "BOH": { name: "Back of House", color: "emerald", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
  "Bar": { name: "Bar & Beverage", color: "purple", bgColor: "bg-purple-50", textColor: "text-purple-700" },
  "Management": { name: "Management", color: "slate", bgColor: "bg-slate-50", textColor: "text-slate-700" }
};

// Mopped Restaurant Template
export const MOPPED_RESTAURANT_TEMPLATE = {
  name: 'Mopped Restaurant',
  description: 'Hybrid casual sit-down model with customizable beverage service - optimized for 14% labor efficiency and $45 average spend.',
  industry_type: 'mopped_hybrid',
  spend_per_guest: 45.00,
  labor_percentage_target: 14.00,
  default_roles: ROLES,
  default_departments: ["FOH", "BOH", "Bar", "Management"]
};

export const LOCAL_STORAGE_KEY = 'editableWeeklyLaborSchedule';

// Helper functions
export const getRolesByDepartment = (department) => {
  return ROLES.filter(role => role.department === department);
};

export const getDepartmentColor = (department) => {
  return DEPARTMENTS[department] || DEPARTMENTS["FOH"];
};
