// ============================================================================
// MOPPED OS - DINNER-ONLY CASUAL DINING CONFIGURATION
// ============================================================================
// This matches the backend staffing_rules for a casual dining dinner restaurant
// Service: 5pm-10pm, 7 days/week
// ============================================================================

export const SPEND_PER_GUEST = 65; // Check average for casual dining

export const SHIFT_SPLIT = { LUNCH: 0, DINNER: 1.0 }; // Dinner only

// Dinner service times (5pm-10pm + prep/cleanup)
export const SHIFT_TIMES = {
  LUNCH: { start: "11:00 AM", end: "3:00 PM", militaryStart: "11:00", militaryEnd: "15:00" }, // Not used
  DINNER: { start: "3:00 PM", end: "11:00 PM", militaryStart: "15:00", militaryEnd: "23:00" }  // Main shift
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

// Helper function to convert military time to standard 12-hour format
export const formatTimeToStandard = (militaryTime) => {
  if (!militaryTime) return '';
  
  const [hours, minutes] = militaryTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${standardHour}:${minutes} ${ampm}`;
};

// Helper function to convert standard time to military format for database storage
export const formatTimeToMilitary = (standardTime) => {
  if (!standardTime) return '';
  
  const [time, period] = standardTime.split(' ');
  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

// ============================================================================
// DINNER-ONLY CASUAL DINING ROLES
// Matches backend staffing_rules exactly
// ============================================================================

export const ROLES = [
  // ============================================================================
  // BACK OF HOUSE (BOH) - 7 roles
  // ============================================================================
  
  { 
    name: "Meat Portioner", 
    abbreviation: "MP", 
    ratio: 35, 
    shifts: [
      { type: 'DINNER', start: '3:00 PM', end: '11:00 PM', min: 1, max: 1 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 20.00, 
    colorClass: "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100 print:bg-red-100" 
  },
  { 
    name: "Side Portioner", 
    abbreviation: "SP", 
    ratio: 35, 
    shifts: [
      { type: 'DINNER', start: '3:00 PM', end: '11:00 PM', min: 1, max: 1 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 20.00, 
    colorClass: "bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100 print:bg-orange-100" 
  },
  { 
    name: "Food Gopher", 
    abbreviation: "FG", 
    ratio: 35, 
    shifts: [
      { type: 'DINNER', start: '3:00 PM', end: '11:00 PM', min: 1, max: 1 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 20.00, 
    colorClass: "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 print:bg-yellow-100" 
  },
  { 
    name: "Garde Manger", 
    abbreviation: "GM", 
    ratio: 35, 
    shifts: [
      { type: 'DINNER', start: '3:00 PM', end: '11:00 PM', min: 1, max: 1 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 20.00, 
    colorClass: "bg-lime-200 text-lime-800 dark:bg-lime-700 dark:text-lime-100 print:bg-lime-100" 
  },
  { 
    name: "Expo", 
    abbreviation: "EXP", 
    ratio: 35, 
    shifts: [
      { type: 'DINNER', start: '3:00 PM', end: '11:00 PM', min: 1, max: 1 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 20.00, 
    colorClass: "bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100 print:bg-emerald-100" 
  },
  { 
    name: "Prep Cook", 
    abbreviation: "PC", 
    ratio: 50, 
    shifts: [
      { type: 'DINNER', start: '1:00 PM', end: '9:00 PM', min: 1, max: 2 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 15.00, 
    colorClass: "bg-teal-200 text-teal-800 dark:bg-teal-700 dark:text-teal-100 print:bg-teal-100" 
  },
  { 
    name: "Dishwasher (PM)", 
    abbreviation: "DW", 
    ratio: 50, 
    shifts: [
      { type: 'DINNER', start: '4:00 PM', end: '12:00 AM', min: 1, max: 2 }
    ],
    minCount: 1, 
    department: "BOH", 
    hourly_rate: 15.00, 
    colorClass: "bg-cyan-200 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-100 print:bg-cyan-100" 
  },
  
  // ============================================================================
  // FRONT OF HOUSE (FOH) - 4 roles
  // ============================================================================
  
  { 
    name: "Server", 
    abbreviation: "SRV", 
    ratio: 20, 
    shifts: [
      { type: 'DINNER', start: '4:00 PM', end: '11:00 PM', min: 3, max: 8 }
    ],
    minCount: 3, 
    department: "FOH", 
    hourly_rate: 11.00, 
    colorClass: "bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100 print:bg-blue-100" 
  },
  { 
    name: "Host", 
    abbreviation: "HST", 
    ratio: 60, 
    shifts: [
      { type: 'DINNER', start: '4:00 PM', end: '10:00 PM', min: 1, max: 2 }
    ],
    minCount: 1, 
    department: "FOH", 
    hourly_rate: 18.00, 
    colorClass: "bg-indigo-200 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100 print:bg-indigo-100" 
  },
  { 
    name: "Busser", 
    abbreviation: "BUS", 
    ratio: 30, 
    shifts: [
      { type: 'DINNER', start: '4:30 PM', end: '11:00 PM', min: 2, max: 4 }
    ],
    minCount: 2, 
    department: "FOH", 
    hourly_rate: 15.00, 
    colorClass: "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-100 print:bg-purple-100" 
  },
  { 
    name: "Food Runner", 
    abbreviation: "FR", 
    ratio: 30, 
    shifts: [
      { type: 'DINNER', start: '4:30 PM', end: '10:30 PM', min: 1, max: 3 }
    ],
    minCount: 1, 
    department: "FOH", 
    hourly_rate: 11.00, 
    colorClass: "bg-pink-200 text-pink-800 dark:bg-pink-700 dark:text-pink-100 print:bg-pink-100" 
  },
  
  // ============================================================================
  // BAR - 1 role
  // ============================================================================
  
  { 
    name: "Bartender", 
    abbreviation: "BAR", 
    ratio: 40, 
    shifts: [
      { type: 'DINNER', start: '4:00 PM', end: '11:00 PM', min: 1, max: 2 }
    ],
    minCount: 1, 
    department: "Bar", 
    hourly_rate: 11.00, 
    colorClass: "bg-violet-200 text-violet-800 dark:bg-violet-700 dark:text-violet-100 print:bg-violet-100" 
  },
  
  // ============================================================================
  // MANAGEMENT - 1 role (Shift Lead only on Wed/Fri)
  // ============================================================================
  
  { 
    name: "Shift Lead", 
    abbreviation: "SL", 
    ratio: 80, 
    shifts: [
      { type: 'DINNER', start: '3:00 PM', end: '11:00 PM', min: 0, max: 1 }
    ],
    minCount: 0, // Only on Wed/Fri
    department: "Management", 
    hourly_rate: 25.00, 
    colorClass: "bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-100 print:bg-amber-100" 
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getRolesByDepartment = (department) => {
  if (department === 'ALL') return ROLES;
  return ROLES.filter(role => role.department === department);
};

export const getRoleByName = (name) => {
  return ROLES.find(role => role.name === name);
};

export const SHIFT_TYPES = ['DINNER']; // Only dinner service

// ============================================================================
// MOPPED RESTAURANT TEMPLATE (for reference)
// ============================================================================

export const MOPPED_RESTAURANT_TEMPLATE = {
  name: "Mopped Test Site",
  type: "Casual Dining",
  service: "Dinner Only",
  hours: "5:00 PM - 10:00 PM",
  days: 7,
  avgCheck: 65,
  weeklyRevenue: 76923,
  laborTarget: 0.32, // 32% all-in
  roles: ROLES.length,
  departments: ['BOH', 'FOH', 'Bar', 'Management']
};
