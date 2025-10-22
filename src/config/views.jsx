import React from 'react';
// ✅ Add Brain icon to the import (keep TestTube if you want to keep Order Guide Test)
// ADD Package to the end:
import { Home, FileText, Users, ShoppingBasket, BarChartBig, Calculator, ClipboardList, MailCheck, TestTube, Brain, Package } from 'lucide-react';


export const views = [
  {
    id: 'FVA_DASHBOARD',
    path: '/dashboard',
    label: 'FVA Dashboard',
    componentName: 'FvaDashboard',
    icon: <Home size={20} strokeWidth={2.5} />,
    showInNav: true,
    isDefault: true,
  },
  {
    id: 'WEEKLY_FORECAST_CENTER',
    path: '/weekly-forecast',
    label: 'Forecast Center',
    componentName: 'ForecastCenter',
    icon: <MailCheck size={20} strokeWidth={2.5} />,
    showInNav: true,
  },
  {
    id: 'PERFORMANCE_ANALYZER',
    path: '/performance-analyzer',
    label: 'Performance Analyzer',
    componentName: 'PerformanceAnalyzer',
    icon: <BarChartBig size={20} strokeWidth={2.5} />,
    showInNav: false,
  },
  {
    id: 'DAILY_SHIFT_PREP_GUIDE',
    path: '/shift-prep-guide',
    label: 'Shift Prep Guide',
    componentName: 'DailyShiftPrepGuide',
    icon: <ShoppingBasket size={20} strokeWidth={2.5} />,
    showInNav: true,
  },
  {
    id: 'WEEKLY_LABOR_SCHEDULE',
    path: '/labor-schedule',
    label: 'Labor Schedule',
    componentName: 'LaborManagement',
    icon: <Users size={20} strokeWidth={2.5} />,
    showInNav: true,
  },
  {
    id: 'DAILY_BRIEFING_BUILDER',
    path: '/daily-briefing',
    label: 'Daily Briefing',
    componentName: 'DailyBriefingBuilder',
    icon: <FileText size={20} strokeWidth={2.5} />,
    showInNav: true,
  },
  {
    id: 'WEEKLY_ORDER_GUIDE',
    path: '/weekly-order-guide',
    label: 'Order Guide',
    componentName: 'WeeklyOrderGuide',
    icon: <ClipboardList size={20} strokeWidth={2.5} />,
    showInNav: true,
  },
  {
    // CHANGE these 4 lines:
   id: 'INVENTORY_MANAGEMENT',           // was 'ORDER_GUIDE_TEST'
   path: '/inventory-management',        // was '/order-guide-test'  
   label: 'Inventory Management',        // was 'Order Guide Test'
   icon: <Package size={20} strokeWidth={2.5} />,  // was <TestTube
   showInNav: true,
  },
  {
    // ✅ ADD THIS NEW ENTRY FOR SMART ORDER DASHBOARD
    id: 'SMART_ORDER_DASHBOARD',
    path: '/smart-order-dashboard',
    label: 'Smart Order Dashboard',
    componentName: 'AIOrderDashboard',
    icon: <Brain size={20} strokeWidth={2.5} />,
    showInNav: true,
  },
  {
    id: 'SMART_PREP_GUIDE',
    path: '/full-prep-guide',
    label: 'Full Prep Guide',
    componentName: 'SmartPrepGuide',
    icon: <ShoppingBasket size={20} strokeWidth={2.5} />,
    showInNav: false,
  },
];

export const defaultViewId = views.find(v => v.isDefault)?.id || (views.length > 0 ? views[0].id : null);
export const defaultViewPath = views.find(v => v.isDefault)?.path || (views.length > 0 ? views[0].path : "/");
