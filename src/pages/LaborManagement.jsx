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
import { generateTailwindClasses } from './enhanced-color-scheme';

// Import all the advanced components
import MultiWeekScheduler from './MultiWeekScheduler';
import PTOManagementSystem from './PTOManagementSystem';
import SmartSchedulingEngine from './SmartSchedulingEngine';
import EmployeeOnboardingSystem from './EmployeeOnboardingSystem';

// Enhanced Badge Component with new color scheme
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
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enhanced Labor Management</h1>
            <p className="text-slate-600">
              Complete enterprise solution with AI-powered scheduling and workforce optimization
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
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
          
          {/* Location Info */}
          <div className="text-right">
            <div className="font-semibold text-slate-900">{currentLocation?.name || 'Mopped Restaurant'}</div>
            <div className="text-sm text-slate-600">13 roles • 4 departments</div>
          </div>
          
          {/* Admin Button - Repositioned */}
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Navigation Component
const EnhancedNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, description: 'System dashboard and analytics' },
    { id: 'schedule', label: 'Multi-Week Schedule', icon: Calendar, description: '4-week advance scheduling' },
    { id: 'smart-scheduling', label: 'AI Scheduling', icon: Brain, description: 'Forecast-based optimization' },
    { id: 'employees', label: 'Employee Management', icon: UserPlus, description: 'Onboarding and profiles' },
    { id: 'pto', label: 'PTO Management', icon: CalendarDays, description: 'Time-off requests and approvals' },
    { id: 'roles', label: 'All 13 Roles', icon: Users, description: 'Complete role breakdown' }
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex space-x-1 p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={tab.description}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'smart-scheduling' && (
                <Badge variant="info" className="ml-1">
                  <Lightbulb className="h-2 w-2 mr-1" />
                  AI
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Overview Dashboard
const EnhancedOverview = () => {
  const { 
    employees, 
    ptoRequests, 
    currentTemplate, 
    isConnected, 
    getSystemStats 
  } = useLaborData();

  const systemStats = getSystemStats();

  const features = [
    {
      title: '4-Week Advance Scheduling',
      description: 'Plan current week plus 4 weeks ahead with auto-population from previous schedules',
      icon: Calendar,
      status: 'active',
      benefits: ['Reduce planning time by 75%', 'Ensure consistent staffing', 'Handle seasonal variations']
    },
    {
      title: 'AI-Powered Forecasting',
      description: 'Smart scheduling based on sales projections, weather, and historical patterns',
      icon: Brain,
      status: 'beta',
      benefits: ['Optimize labor costs', 'Predict guest counts', 'Adjust for events automatically']
    },
    {
      title: 'Complete PTO Workflow',
      description: 'Full request, approval, and schedule integration system',
      icon: CalendarDays,
      status: 'active',
      benefits: ['Streamlined approvals', 'Automatic schedule blocking', 'Coverage planning']
    },
    {
      title: 'Employee Onboarding',
      description: 'Comprehensive employee management with availability tracking',
      icon: UserPlus,
      status: 'active',
      benefits: ['3-step onboarding process', 'Availability management', 'Role-based defaults']
    }
  ];

  return (
    <div className="space-y-6">
      {/* System Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{systemStats.totalEmployees}</div>
            <div className="text-sm text-slate-600">Total Employees</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{systemStats.activeEmployees}</div>
            <div className="text-sm text-slate-600">Active Staff</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{systemStats.pendingPTO}</div>
            <div className="text-sm text-slate-600">Pending PTO</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{systemStats.totalRoles}</div>
            <div className="text-sm text-slate-600">Total Roles</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Features */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-blue-600" />
            Enterprise Features
          </CardTitle>
          <CardDescription>
            Advanced labor management capabilities for optimal workforce efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-slate-900">{feature.title}</h4>
                        <Badge variant={feature.status === 'beta' ? 'warning' : 'success'}>
                          {feature.status === 'beta' ? 'Beta' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{feature.description}</p>
                      <ul className="space-y-1">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-xs text-slate-500 flex items-center">
                            <CheckCircle className="h-3 w-3 text-emerald-500 mr-1" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown - Enhanced */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Department Breakdown - All 13 Roles
          </CardTitle>
          <CardDescription>
            Complete role structure including the Dishwasher role with department organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(DEPARTMENTS).map(([deptKey, deptInfo]) => {
              const deptRoles = getRolesByDepartment(deptKey);
              return (
                <div key={deptKey} className={`${deptInfo.bgColor} border ${deptInfo.textColor.replace('text-', 'border-').replace('-700', '-200')} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold ${deptInfo.textColor}`}>{deptInfo.name}</h4>
                    <Badge variant="secondary">{deptRoles.length} roles</Badge>
                  </div>
                  <div className="space-y-2">
                    {deptRoles.slice(0, 3).map(role => (
                      <div key={role.name} className="text-sm">
                        <span className={`font-medium ${deptInfo.textColor}`}>{role.name}</span>
                        <div className="text-xs opacity-75">
                          ${role.hourly_rate}/hr • 1:{role.ratio}
                        </div>
                      </div>
                    ))}
                    {deptRoles.length > 3 && (
                      <div className="text-xs opacity-75">
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

      {/* Quick Actions */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Schedule Next Week</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              <UserPlus className="h-5 w-5" />
              <span className="text-sm">Add Employee</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              <CalendarDays className="h-5 w-5" />
              <span className="text-sm">Review PTO</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              <Brain className="h-5 w-5" />
              <span className="text-sm">AI Forecast</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Roles Display
const EnhancedRolesDisplay = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const filteredRoles = selectedDepartment === 'all' 
    ? ROLES 
    : ROLES.filter(role => role.department === selectedDepartment);

  return (
    <div className="space-y-6">
      {/* Department Filter */}
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-slate-900">Filter by Department:</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedDepartment('all')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              selectedDepartment === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({ROLES.length})
          </button>
          {Object.entries(DEPARTMENTS).map(([deptKey, deptInfo]) => {
            const count = getRolesByDepartment(deptKey).length;
            return (
              <button
                key={deptKey}
                onClick={() => setSelectedDepartment(deptKey)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  selectedDepartment === deptKey
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {deptKey} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(role => (
          <Card key={role.name} className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">{role.name}</h4>
                <Badge className={role.colorClass}>
                  {role.abbreviation}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Department:</span>
                  <Badge className={DEPARTMENTS[role.department]?.bgColor + ' ' + DEPARTMENTS[role.department]?.textColor + ' border-' + DEPARTMENTS[role.department]?.color + '-200'}>
                    {role.department}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Guest Ratio:</span>
                  <span className="font-medium text-slate-900">1:{role.ratio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hourly Rate:</span>
                  <span className="font-medium text-slate-900">${role.hourly_rate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shifts:</span>
                  <span className="font-medium text-slate-900">{role.shifts.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Min Count:</span>
                  <span className="font-medium text-slate-900">{role.minCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Summary */}
      <Card className="border-blue-200 bg-blue-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Complete Role Coverage</h4>
              <p className="text-sm text-blue-700 mt-1">
                All 13 roles are now included, including the previously missing <strong>Dishwasher</strong> role. 
                Each role has optimized guest ratios, competitive hourly rates, and appropriate shift assignments 
                for maximum operational efficiency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Enhanced Labor Management Component
function EnhancedLaborManagementContent() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    employees, 
    currentTemplate, 
    isConnected, 
    loading,
    error
  } = useLaborData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading enhanced labor management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <EnhancedHeader 
          isConnected={isConnected}
          currentLocation={{ name: 'Mopped Restaurant' }}
        />

        {/* Enhanced Navigation */}
        <EnhancedNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <div className="p-6">
          {error && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-800">System Notice</h4>
                    <p className="text-sm text-amber-700">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && <EnhancedOverview />}
          {activeTab === 'schedule' && <MultiWeekScheduler />}
          {activeTab === 'smart-scheduling' && <SmartSchedulingEngine />}
          {activeTab === 'employees' && <EmployeeOnboardingSystem />}
          {activeTab === 'pto' && <PTOManagementSystem />}
          {activeTab === 'roles' && <EnhancedRolesDisplay />}
        </div>
      </div>
    </div>
  );
}

// Main component with provider wrapper
function EnhancedLaborManagement() {
  return (
    <LaborDataProvider>
      <EnhancedLaborManagementContent />
    </LaborDataProvider>
  );
}

export default EnhancedLaborManagement;

