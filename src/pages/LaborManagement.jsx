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
import WeeklyLaborSchedule from '@/components/WeeklyLaborSchedule';

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
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Labor Management</h1>
            <p className="text-slate-600">
              Mopped Restaurant - 13 Roles Including Dishwasher
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
        </div>
      </div>
    </div>
  );
};

// Enhanced Navigation Component
const EnhancedNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, description: 'System dashboard and analytics' },
    { id: 'schedule', label: 'Weekly Schedule', icon: Calendar, description: 'Current week scheduling' },
    { id: 'employees', label: 'Employee Management', icon: UserPlus, description: 'Staff management' },
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

  const handleQuickAction = (action) => {
    switch (action) {
      case 'schedule':
        alert('Opening schedule creator...');
        break;
      case 'employee':
        alert('Opening employee onboarding...');
        break;
      case 'pto':
        alert('Opening PTO management...');
        break;
      case 'forecast':
        alert('Opening AI forecast...');
        break;
      default:
        break;
    }
  };

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

      {/* Department Breakdown */}
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
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => handleQuickAction('schedule')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Schedule Next Week</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => handleQuickAction('employee')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-sm">Add Employee</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => handleQuickAction('pto')}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-sm">Review PTO</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => handleQuickAction('forecast')}
            >
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-900">{role.name}</h3>
                <Badge variant="secondary">
                  {role.department}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Ratio: <span className="font-medium">1:{role.ratio}</span></p>
                <p>Rate: <span className="font-medium">${role.hourly_rate}/hr</span></p>
                <p className="text-xs text-slate-500">{role.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Employee Management Component
const EmployeeManagement = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useLaborData();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Employee Management</h3>
        <Button onClick={() => setShowAddForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(employee => (
          <Card key={employee.id} className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{employee.name}</h4>
                <Badge variant={employee.status === 'active' ? 'success' : 'secondary'}>
                  {employee.status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Role: <span className="font-medium">{employee.role}</span></p>
                <p>Department: <span className="font-medium">{employee.department}</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Main Labor Management Content Component
function LaborManagementContent() {
  const [activeTab, setActiveTab] = useState('overview');
  
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading labor management system...</p>
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
          currentLocation={{ name: 'Mopped Test Site' }}
        />
        
        {/* Enhanced Navigation */}
        <EnhancedNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {/* Main Content Area */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-amber-800">{error}</span>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && <EnhancedOverview />}
          {activeTab === 'schedule' && <WeeklyLaborSchedule />}
          {activeTab === 'employees' && <EmployeeManagement />}
          {activeTab === 'roles' && <EnhancedRolesDisplay />}
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





