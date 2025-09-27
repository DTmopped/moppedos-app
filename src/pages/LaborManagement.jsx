import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, Users, Calendar, TrendingUp, Settings, Clock, Target, Zap,
  AlertCircle, CheckCircle, Wifi, WifiOff, UserPlus, CalendarDays,
  BarChart3, Brain, Lightbulb, ArrowRight, Shield
} from 'lucide-react';

import { LaborDataProvider, useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Import WeeklyLaborSchedule (this one definitely exists)
import WeeklyLaborSchedule from '@/components/WeeklyLaborSchedule';

// Conditional imports for advanced components - with fallbacks
let MultiWeekScheduler, PTOManagementSystem, SmartSchedulingEngine, EmployeeOnboardingSystem;

try {
  MultiWeekScheduler = require('@/components/labor/MultiWeekScheduler').default;
} catch (e) {
  MultiWeekScheduler = () => <div className="p-8 text-center text-slate-600">Multi-Week Scheduler coming soon...</div>;
}

try {
  PTOManagementSystem = require('@/components/labor/PTOManagementSystem').default;
} catch (e) {
  PTOManagementSystem = () => <div className="p-8 text-center text-slate-600">PTO Management coming soon...</div>;
}

try {
  SmartSchedulingEngine = require('@/components/labor/SmartSchedulingEngine').default;
} catch (e) {
  SmartSchedulingEngine = () => <div className="p-8 text-center text-slate-600">AI Scheduling Engine coming soon...</div>;
}

try {
  EmployeeOnboardingSystem = require('@/components/labor/EmployeeOnboardingSystem').default;
} catch (e) {
  EmployeeOnboardingSystem = () => <div className="p-8 text-center text-slate-600">Employee Onboarding coming soon...</div>;
}

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
const EnhancedHeader = ({ isConnected, currentLocation }) => {
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
            <div className="font-semibold text-slate-900">{currentLocation?.name || 'Mopped Restaurant'}</div>
            <div className="text-sm text-slate-600">13 roles • 4 departments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Navigation Component
const EnhancedNavigation = ({ activeView, onViewChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, description: 'System dashboard and analytics', color: 'blue' },
    { id: 'schedule', label: 'Weekly Schedule', icon: Calendar, description: 'Current week scheduling', color: 'emerald' },
    { id: 'multiWeek', label: 'Multi-Week Planner', icon: CalendarDays, description: '4-week advance scheduling', color: 'purple' },
    { id: 'aiScheduling', label: 'AI Scheduling', icon: Brain, description: 'Smart scheduling engine', color: 'indigo' },
    { id: 'onboarding', label: 'Employee Management', icon: UserPlus, description: 'Staff onboarding and management', color: 'cyan' },
    { id: 'pto', label: 'PTO Management', icon: Clock, description: 'Time-off requests and approvals', color: 'amber' },
    { id: 'roles', label: 'All 13 Roles', icon: Users, description: 'Complete role breakdown', color: 'rose' }
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
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? `bg-${tab.color}-50 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={tab.description}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Overview Component
const EnhancedOverview = ({ onTabChange }) => {
  const { 
    employees, 
    ptoRequests, 
    currentTemplate, 
    isConnected, 
    getSystemStats 
  } = useLaborData();

  const systemStats = getSystemStats();

  const handleQuickAction = (action) => {
    switch (action) {
      case 'schedule':
        onTabChange('schedule');
        break;
      case 'addEmployee':
        onTabChange('onboarding');
        break;
      case 'reviewPTO':
        onTabChange('pto');
        break;
      case 'aiForecast':
        onTabChange('aiScheduling');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-blue-600 rounded-full">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{systemStats.totalEmployees}</div>
            <div className="text-sm text-blue-700">Total Employees</div>
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
        
        <Card className="border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-amber-600 rounded-full">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900">{systemStats.pendingPTO}</div>
            <div className="text-sm text-amber-700">Pending PTO</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-600 rounded-full">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">{systemStats.totalRoles}</div>
            <div className="text-sm text-purple-700">Total Roles</div>
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

      {/* Enhanced Quick Actions */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
          <CardDescription>Jump to key management functions</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center space-y-3 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
              onClick={() => handleQuickAction('schedule')}
            >
              <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Schedule Next Week</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center space-y-3 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 group"
              onClick={() => handleQuickAction('addEmployee')}
            >
              <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                <UserPlus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Add Employee</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center space-y-3 border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 group"
              onClick={() => handleQuickAction('reviewPTO')}
            >
              <div className="p-3 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                <CalendarDays className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Review PTO</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center space-y-3 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 group"
              onClick={() => handleQuickAction('aiForecast')}
            >
              <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                <Brain className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">AI Forecast</span>
            </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map(role => {
          const colors = generateDepartmentColors(role.department);
          return (
            <Card key={role.name} className={`border-2 ${colors.border} bg-white shadow-sm hover:shadow-lg transition-all duration-200`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">{role.name}</h3>
                  <Badge variant="outline" className={`${colors.accent} text-white border-transparent`}>
                    {role.department}
                  </Badge>
                </div>
                <div className={`${colors.bg} rounded-lg p-4 space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Ratio:</span>
                    <span className={`font-bold ${colors.text}`}>1:{role.ratio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Rate:</span>
                    <span className={`font-bold ${colors.text}`}>${role.hourly_rate}/hr</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
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

// Main Labor Management Content Component
function LaborManagementContent() {
  const [activeView, setActiveView] = useState('overview');
  
  const { 
    employees, 
    ptoRequests, 
    currentTemplate, 
    isConnected, 
    loading,
    error,
    getSystemStats
  } = useLaborData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading enhanced labor management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30">
      <div className="max-w-7xl mx-auto">
        <EnhancedHeader 
          isConnected={isConnected} 
          currentLocation={{ name: 'Mopped Test Site' }}
        />
        
        <EnhancedNavigation 
          activeView={activeView} 
          onViewChange={setActiveView} 
        />
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-red-50 border-l-4 border-amber-400 rounded-lg shadow-sm">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-amber-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {activeView === 'overview' && <EnhancedOverview onTabChange={setActiveView} />}
          {activeView === 'schedule' && <WeeklyLaborSchedule />}
          {activeView === 'multiWeek' && <MultiWeekScheduler />}
          {activeView === 'aiScheduling' && <SmartSchedulingEngine />}
          {activeView === 'onboarding' && <EmployeeOnboardingSystem />}
          {activeView === 'pto' && <PTOManagementSystem />}
          {activeView === 'roles' && <EnhancedRolesDisplay />}
        </div>
      </div>
    </div>
  );
}

// Wrapper component with provider
function LaborManagement() {
  return (
    <LaborDataProvider>
      <LaborManagementContent />
    </LaborDataProvider>
  );
}

export default LaborManagement;






