import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, Users, Calendar, TrendingUp, Settings, Clock, Target, Zap,
  AlertCircle, CheckCircle, Wifi, WifiOff, UserPlus, CalendarDays,
  BarChart3, Brain, Lightbulb, ArrowRight, Shield, Bell
} from 'lucide-react';

import { LaborDataProvider, useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Import WeeklyLaborSchedule (this one definitely exists)
import WeeklyLaborSchedule from '@/components/WeeklyLaborSchedule';

// Import the new scheduling components
import ScheduleRequestManager from '@/components/labor/ScheduleRequestManager';
import EmployeeRequestForm from '@/components/labor/EmployeeRequestForm';

// FIXED: Direct ES6 imports instead of conditional require()
import MultiWeekScheduler from '@/components/labor/MultiWeekScheduler';
import PTOManagementSystem from '@/components/labor/PTOManagementSystem';
import SmartSchedulingEngine from '@/components/labor/SmartSchedulingEngine';
import EmployeeOnboardingSystem from '@/components/labor/EmployeeOnboardingSystem';

// ============================================================================
// 🔥 NEW: Import VenueConfiguration
// ============================================================================
import VenueConfiguration from '@/components/settings/VenueConfiguration';

// Enhanced color scheme functions (inline since import might be causing issues)
const generateDepartmentColors = (deptKey) => {
  const colorMap = {
    FOH: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      accent: 'bg-blue-600'
    },
    BOH: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200', 
      text: 'text-emerald-700',
      accent: 'bg-emerald-600'
    },
    Bar: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      accent: 'bg-purple-600'
    },
    Management: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      accent: 'bg-slate-600'
    }
  };
  return colorMap[deptKey] || colorMap.Management;
};

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    outline: "bg-white text-slate-700 border-slate-300"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Enhanced Header Component
const EnhancedHeader = ({ isConnected, currentLocation, pendingCount }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border-b border-slate-200 p-6 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-emerald-700 bg-clip-text text-transparent">
              Enhanced Labor Management
            </h1>
            <p className="text-slate-600">
              Mopped Restaurant - 13 Roles Including Dishwasher
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Pending Notifications */}
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <Bell className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-600" />
                <Badge variant="success">Live Data</Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-amber-600" />
                <Badge variant="warning">Demo Mode</Badge>
              </>
            )}
          </div>
          
          <div className="text-right">
            <div className="font-semibold text-slate-900">{currentLocation?.name || 'Mopped Test Site'}</div>
            <div className="text-sm text-slate-600">13 roles • 4 departments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Navigation Component
const EnhancedNavigation = ({ activeView, onViewChange, pendingCount }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, description: 'System dashboard and analytics', color: 'blue' },
    { id: 'schedule', label: 'Weekly Schedule', icon: Calendar, description: 'Current week scheduling', color: 'emerald' },
    { id: 'multiWeek', label: 'Multi-Week Planner', icon: CalendarDays, description: '4-week advance scheduling', color: 'purple' },
    { id: 'aiScheduling', label: 'Smart Scheduling Assistant', icon: Brain, description: 'Logic-based scheduling helper', color: 'indigo' },
    { id: 'onboarding', label: 'Employee Management', icon: UserPlus, description: 'Staff onboarding and management', color: 'cyan' },
    { 
      id: 'pto', 
      label: `PTO Management${pendingCount > 0 ? ` (${pendingCount})` : ''}`, 
      icon: Clock, 
      description: 'Time-off requests and approvals', 
      color: 'amber',
      hasPending: pendingCount > 0
    },
    { id: 'roles', label: 'All 13 Roles', icon: Users, description: 'Complete role breakdown', color: 'rose' },
    // ============================================================================
    // 🔥 NEW: Add Venue Settings tab
    // ============================================================================
    { id: 'settings', label: 'Venue Settings', icon: Settings, description: 'Configure venues and time blocks', color: 'slate' }
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="flex space-x-1 p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
                isActive
                  ? `bg-${tab.color}-50 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={tab.description}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.hasPending && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Overview Component (UPDATED - Functional Cards, No Quick Actions)
const EnhancedOverview = ({ onTabChange }) => {
  const { 
    employees, 
    ptoRequests, 
    currentTemplate, 
    isConnected, 
    getSystemStats,
    getPendingRequestsCount
  } = useLaborData();

  const systemStats = getSystemStats();
  const pendingCount = getPendingRequestsCount ? getPendingRequestsCount() : 0;

  // Handle stat card clicks
  const handleStatCardClick = (cardType) => {
    switch (cardType) {
      case 'employees':
        onTabChange('onboarding');
        break;
      case 'pto':
        onTabChange('pto');
        break;
      case 'roles':
        onTabChange('roles');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards - NOW CLICKABLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          onClick={() => handleStatCardClick('employees')}
        >
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-blue-600 rounded-full">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{systemStats.totalEmployees}</div>
            <div className="text-sm text-blue-700">Total Employees</div>
            <div className="text-xs text-blue-600 mt-1">Click to manage</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-emerald-600 rounded-full">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-900">{systemStats.activeEmployees}</div>
            <div className="text-sm text-emerald-700">Active Staff</div>
          </CardContent>
        </Card>
        
        <Card 
          className="border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105 relative"
          onClick={() => handleStatCardClick('pto')}
        >
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-amber-600 rounded-full">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900">{pendingCount}</div>
            <div className="text-sm text-amber-700">Pending PTO</div>
            <div className="text-xs text-amber-600 mt-1">Click to review</div>
            {pendingCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
            )}
          </CardContent>
        </Card>
        
        <Card 
          className="border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
          onClick={() => handleStatCardClick('roles')}
        >
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-600 rounded-full">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">{systemStats.totalRoles}</div>
            <div className="text-sm text-purple-700">Total Roles</div>
            <div className="text-xs text-purple-600 mt-1">Click to view</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Department Breakdown */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Department Breakdown - All 13 Roles
          </CardTitle>
          <CardDescription>
            Complete role structure including the Dishwasher role with enhanced department organization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(DEPARTMENTS).map(([deptKey, deptInfo]) => {
              const deptRoles = getRolesByDepartment(deptKey);
              const colors = generateDepartmentColors(deptKey);
              
              return (
                <div key={deptKey} className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 hover:shadow-lg transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-bold ${colors.text} text-lg`}>{deptInfo.name}</h4>
                    <Badge variant="outline" className={`${colors.accent} text-white border-transparent`}>
                      {deptRoles.length} roles
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {deptRoles.slice(0, 3).map(role => (
                      <div key={role.name} className="bg-white/70 rounded-lg p-2">
                        <span className={`font-semibold ${colors.text} block`}>{role.name}</span>
                        <div className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">${role.hourly_rate}/hr</span> • 
                          <span className="ml-1">1:{role.ratio} ratio</span>
                        </div>
                      </div>
                    ))}
                    {deptRoles.length > 3 && (
                      <div className={`text-sm ${colors.text} font-medium text-center py-2`}>
                        +{deptRoles.length - 3} more roles
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Roles Display Component
const EnhancedRolesDisplay = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const filteredRoles = selectedDepartment === 'all' 
    ? ROLES 
    : ROLES.filter(role => role.department === selectedDepartment);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Filter by Department:</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedDepartment('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              selectedDepartment === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({ROLES.length})
          </button>
          {Object.entries(DEPARTMENTS).map(([deptKey, deptInfo]) => {
            const count = getRolesByDepartment(deptKey).length;
            const colors = generateDepartmentColors(deptKey);
            return (
              <button
                key={deptKey}
                onClick={() => setSelectedDepartment(deptKey)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedDepartment === deptKey
                    ? `${colors.accent} text-white shadow-md`
                    : `${colors.bg} ${colors.text} hover:shadow-sm`
                }`}
              >
                {deptKey} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRoles.map((role, index) => {
          const colors = generateDepartmentColors(role.department);
          return (
            <Card key={index} className={`${colors.bg} border-2 ${colors.border} shadow-sm hover:shadow-lg transition-all duration-200`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-3 h-3 rounded-full ${colors.accent}`}></div>
                  <Badge variant="outline" className={`${colors.accent} text-white border-transparent`}>
                    {role.department}
                  </Badge>
                </div>
                <h4 className={`font-bold ${colors.text} text-lg mb-2`}>{role.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hourly Rate:</span>
                    <span className={`font-semibold ${colors.text}`}>${role.hourly_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guest Ratio:</span>
                    <span className={`font-semibold ${colors.text}`}>1:{role.ratio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shift Type:</span>
                    <span className={`font-semibold ${colors.text}`}>{role.shift_type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Main Labor Management Component
const LaborManagementContent = () => {
  const [activeView, setActiveView] = useState('overview');
  const [scheduleData, setScheduleData] = useState({});
  
  const { 
    isConnected, 
    currentLocation,
    locationUuid,
    getPendingRequestsCount 
  } = useLaborData();

  const pendingCount = getPendingRequestsCount ? getPendingRequestsCount() : 2;

  const handleScheduleChange = (newScheduleData) => {
    setScheduleData(newScheduleData);
    console.log('Schedule updated:', newScheduleData);
  };

  // ============================================================================
  // 🔥 UPDATED: Add 'settings' case to renderContent
  // ============================================================================
  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <EnhancedOverview onTabChange={setActiveView} />;
      case 'schedule':
        return <WeeklyLaborSchedule />;
      case 'multiWeek':
        return <MultiWeekScheduler />;
      case 'aiScheduling':
        return <SmartSchedulingEngine />;
      case 'onboarding':
        return <EmployeeOnboardingSystem />;
      case 'pto':
        return <PTOManagementSystem />;
      case 'roles':
        return <EnhancedRolesDisplay />;
      case 'settings':
        return <VenueConfiguration locationId={locationUuid} />;
      default:
        return <EnhancedOverview onTabChange={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl border-0 rounded-xl overflow-hidden">
          <EnhancedHeader 
            isConnected={isConnected}
            currentLocation={currentLocation}
            pendingCount={pendingCount}
          />
          <EnhancedNavigation 
            activeView={activeView}
            onViewChange={setActiveView}
            pendingCount={pendingCount}
          />
          <div className="p-6 bg-slate-50">
            {renderContent()}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Wrapper component with provider
const LaborManagement = () => {
  return (
    <LaborDataProvider>
      <LaborManagementContent />
    </LaborDataProvider>
  );
};

export default LaborManagement;
