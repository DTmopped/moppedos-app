// Enhanced On-Brand Color Scheme for Mopped OS Labor Management
// Based on the professional blue/slate theme from FVA Dashboard

export const MOPPED_COLORS = {
  // Primary Brand Colors (from Mopped OS)
  primary: {
    50: '#eff6ff',   // Very light blue
    100: '#dbeafe',  // Light blue
    200: '#bfdbfe',  // Lighter blue
    300: '#93c5fd',  // Medium light blue
    400: '#60a5fa',  // Medium blue
    500: '#3b82f6',  // Primary blue
    600: '#2563eb',  // Darker blue
    700: '#1d4ed8',  // Dark blue
    800: '#1e40af',  // Very dark blue
    900: '#1e3a8a'   // Darkest blue
  },

  // Neutral Colors (Professional slate-based)
  neutral: {
    50: '#f8fafc',   // Almost white
    100: '#f1f5f9',  // Very light grey
    200: '#e2e8f0',  // Light grey
    300: '#cbd5e1',  // Medium light grey
    400: '#94a3b8',  // Medium grey
    500: '#64748b',  // Neutral grey
    600: '#475569',  // Dark grey
    700: '#334155',  // Darker grey
    800: '#1e293b',  // Very dark grey
    900: '#0f172a'   // Almost black
  },

  // Success Colors (for approvals, saves)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  // Warning Colors (for pending, alerts)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  // Error Colors (for rejections, errors)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  }
};

// Component-specific color mappings
export const UI_COLORS = {
  // Main backgrounds
  pageBackground: MOPPED_COLORS.neutral[50],
  cardBackground: '#ffffff',
  headerBackground: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  
  // Schedule table colors
  tableHeader: MOPPED_COLORS.neutral[100],
  tableHeaderText: MOPPED_COLORS.neutral[800],
  tableRow: '#ffffff',
  tableRowHover: MOPPED_COLORS.neutral[50],
  tableBorder: MOPPED_COLORS.neutral[200],
  
  // Employee slots (much lighter)
  employeeSlot: '#ffffff',
  employeeSlotHover: MOPPED_COLORS.neutral[50],
  employeeSlotBorder: MOPPED_COLORS.neutral[200],
  
  // Input fields
  inputBackground: '#ffffff',
  inputBorder: MOPPED_COLORS.neutral[300],
  inputBorderFocus: MOPPED_COLORS.primary[500],
  inputText: MOPPED_COLORS.neutral[900],
  inputPlaceholder: MOPPED_COLORS.neutral[500],
  
  // Buttons
  primaryButton: MOPPED_COLORS.primary[600],
  primaryButtonHover: MOPPED_COLORS.primary[700],
  secondaryButton: '#ffffff',
  secondaryButtonHover: MOPPED_COLORS.neutral[50],
  secondaryButtonBorder: MOPPED_COLORS.neutral[300],
  
  // Department colors (on-brand)
  departments: {
    FOH: {
      background: MOPPED_COLORS.primary[50],
      text: MOPPED_COLORS.primary[700],
      border: MOPPED_COLORS.primary[200]
    },
    BOH: {
      background: MOPPED_COLORS.success[50],
      text: MOPPED_COLORS.success[700],
      border: MOPPED_COLORS.success[200]
    },
    Bar: {
      background: '#faf5ff', // Purple tint
      text: '#7c3aed',
      border: '#e9d5ff'
    },
    Management: {
      background: MOPPED_COLORS.neutral[100],
      text: MOPPED_COLORS.neutral[700],
      border: MOPPED_COLORS.neutral[300]
    }
  },
  
  // Status indicators
  connected: MOPPED_COLORS.success[600],
  disconnected: MOPPED_COLORS.warning[600],
  pending: MOPPED_COLORS.warning[500],
  approved: MOPPED_COLORS.success[500],
  rejected: MOPPED_COLORS.error[500],
  
  // Text colors
  textPrimary: MOPPED_COLORS.neutral[900],
  textSecondary: MOPPED_COLORS.neutral[600],
  textMuted: MOPPED_COLORS.neutral[500],
  textLight: MOPPED_COLORS.neutral[400]
};

// CSS class generators for Tailwind
export const generateTailwindClasses = () => ({
  // Backgrounds
  pageBackground: 'bg-slate-50',
  cardBackground: 'bg-white',
  headerGradient: 'bg-gradient-to-r from-slate-50 to-slate-100',
  
  // Schedule table
  tableHeader: 'bg-slate-100',
  tableHeaderText: 'text-slate-800',
  tableRow: 'bg-white',
  tableRowHover: 'hover:bg-slate-50',
  tableBorder: 'border-slate-200',
  
  // Employee slots (lightened)
  employeeSlot: 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  
  // Inputs
  input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
  
  // Buttons
  primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
  secondaryButton: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
  
  // Department badges
  departmentFOH: 'bg-blue-50 text-blue-700 border-blue-200',
  departmentBOH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  departmentBar: 'bg-purple-50 text-purple-700 border-purple-200',
  departmentManagement: 'bg-slate-100 text-slate-700 border-slate-300',
  
  // Status badges
  statusConnected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  statusDemo: 'bg-amber-50 text-amber-700 border-amber-200',
  statusPending: 'bg-amber-50 text-amber-700 border-amber-200',
  statusApproved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  statusRejected: 'bg-red-50 text-red-700 border-red-200',
  
  // Text
  textPrimary: 'text-slate-900',
  textSecondary: 'text-slate-600',
  textMuted: 'text-slate-500',
  textLight: 'text-slate-400'
});

// Role color mappings (enhanced for better visibility)
export const ROLE_COLORS = {
  // BOH Roles
  "Meat Portioner": "bg-red-100 text-red-800 border-red-200",
  "Side Portioner": "bg-orange-100 text-orange-800 border-orange-200", 
  "Food Gopher": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Dishwasher": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Kitchen Swing": "bg-lime-100 text-lime-800 border-lime-200",
  
  // FOH Roles
  "Cashier": "bg-green-100 text-green-800 border-green-200",
  "Server": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Server Assistant": "bg-sky-100 text-sky-800 border-sky-200",
  "Busser": "bg-teal-100 text-teal-800 border-teal-200",
  "Cashier Swing": "bg-blue-100 text-blue-800 border-blue-200",
  
  // Bar Role
  "Bartender": "bg-indigo-100 text-indigo-800 border-indigo-200",
  
  // Management Roles
  "Shift Lead": "bg-purple-100 text-purple-800 border-purple-200",
  "Manager": "bg-pink-100 text-pink-800 border-pink-200"
};

export default {
  MOPPED_COLORS,
  UI_COLORS,
  generateTailwindClasses,
  ROLE_COLORS
};
