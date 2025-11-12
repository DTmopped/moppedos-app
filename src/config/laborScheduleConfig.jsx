import React from 'react';

// Enhanced Mopped Restaurant Configuration
export const SPEND_PER_GUEST = 45; // Updated from 15 to 45 for Mopped Restaurant

export const SHIFT_SPLIT = { AM: 0.5, PM: 0.4, SWING: 0.1 };

// Updated to use standard 12-hour time format instead of military time
export const SHIFT_TIMES = {
  AM: { start: "8:30 AM", end: "4:30 PM", militaryStart: "08:30", militaryEnd: "16:30" },
  PM: { start: "3:00 PM", end: "11:00 PM", militaryStart: "15:00", militaryEnd: "23:00" },
  SWING: { start: "10:00 AM", end: "6:00 PM", militaryStart: "10:00", militaryEnd: "18:00" }
};

// Department mappings for standardization between config and database
export const DEPARTMENT_MAPPING = {
  'FOH': 'Front of House',
  'BOH': 'Back of House',
  'Bar': 'Bar & Beverage',
  'Management': 'Management'
};

export const REVERSE_DEPARTMENT_MAPPING = {
  'Front of House': 'FOH',
  'Back of House': 'BOH',
  'Bar & Beverage': 'Bar',
  'Management': 'Management'
};

// Enhanced Mopped Restaurant Roles with ALL shifts: AM, MID, PM
export const ROLES = [
  {
    name: 'Busser',
    abbreviation: 'BUS',
    department: 'FOH',
    ratio: 50,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Meat Portioner',
    abbreviation: 'MP',
    department: 'BOH',
    ratio: 75,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Side Portioner',
    abbreviation: 'SP',
    department: 'BOH',
    ratio: 75,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Food Runner',
    abbreviation: 'FR',
    department: 'FOH',
    ratio: 50,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Food Gopher',
    abbreviation: 'FG',
    department: 'BOH',
    ratio: 75,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Kitchen Swing',
    abbreviation: 'KS',
    department: 'BOH',
    ratio: 75,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 2 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 2 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 2 }
    ]
  },
  {
    name: 'Dishwasher',
    abbreviation: 'DW',
    department: 'BOH',
    ratio: 100,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Cashier',
    abbreviation: 'CSH',
    department: 'FOH',
    ratio: 50,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 2 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 2 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 2 }
    ]
  },
  {
    name: 'Server',
    abbreviation: 'SRV',
    department: 'FOH',
    ratio: 40,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 2, max: 6 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 2, max: 6 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 2, max: 6 }
    ]
  },
  {
    name: 'Line Cook',
    abbreviation: 'LC',
    department: 'BOH',
    ratio: 75,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 3 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 3 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 3 }
    ]
  },
  {
    name: 'Bartender',
    abbreviation: 'BAR',
    department: 'Bar',
    ratio: 60,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 2 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 2 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 2 }
    ]
  },
  {
    name: 'Shift Lead',
    abbreviation: 'SL',
    department: 'Management',
    ratio: 150,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 2 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 2 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 2 }
    ]
  },
  {
    name: 'Manager',
    abbreviation: 'MGR',
    department: 'Management',
    ratio: 150,
    shifts: [
      { type: 'AM', start: '6:00 AM', end: '2:00 PM', min: 1, max: 2 },
      { type: 'MID', start: '10:00 AM', end: '6:00 PM', min: 1, max: 2 },
      { type: 'PM', start: '2:00 PM', end: '10:00 PM', min: 1, max: 2 }
    ]
  }
];

// Helper function to get roles by department
export const getRolesByDepartment = (department) => {
  if (department === 'ALL') return ROLES;
  return ROLES.filter(role => role.department === department);
};

// Helper function to get role by name
export const getRoleByName = (name) => {
  return ROLES.find(role => role.name === name);
};

// Helper function to get all unique departments
export const getDepartments = () => {
  const depts = [...new Set(ROLES.map(role => role.department))];
  return ['ALL', ...depts];
};
