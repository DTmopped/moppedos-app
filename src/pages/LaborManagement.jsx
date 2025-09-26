import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, Users, Calendar, TrendingUp, Settings, Clock, Target, Zap,
  AlertCircle, CheckCircle, Wifi, WifiOff
} from 'lucide-react';

import { LaborDataProvider, useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';
import WeeklyLaborSchedule from '@/components/WeeklyLaborSchedule';

// Simple Badge component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded";
  const variantClasses = {
    default: "bg-blue-600 text-white",
    secondary: "bg-slate-600 text-slate-200",
    outline: "bg-white text-slate-900 border border-slate-300"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

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

  const systemStats = getSystemStats();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Enhanced Labor Management</h1>
                <p className="text-sm text-slate-600">Mopped Restaurant - 13 Roles Including Dishwasher</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={isConnected ? "default" : "secondary"}
              >
                {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isConnected ? 'Live Data' : 'Demo Mode'}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {currentTemplate?.name || 'Mopped Restaurant'}
                </p>
                <p className="text-xs text-slate-500">
                  {systemStats.activeEmployees} active • {systemStats.totalRoles} roles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex space-x-4">
          <Button 
            onClick={() => setActiveView('overview')}
            variant={activeView === 'overview' ? 'default' : 'outline'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button 
            onClick={() => setActiveView('schedule')}
            variant={activeView === 'schedule' ? 'default' : 'outline'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button 
            onClick={() => setActiveView('roles')}
            variant={activeView === 'roles' ? 'default' : 'outline'}
          >
            <Users className="w-4 h-4 mr-2" />
            All 13 Roles
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Enhanced Labor Overview</h2>
              <p className="text-slate-600">
                Complete Mopped Restaurant labor management with all 13 roles including Dishwasher
              </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Employees</p>
                      <p className="text-lg font-semibold text-slate-900">{systemStats.totalEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Active Employees</p>
                      <p className="text-lg font-semibold text-slate-900">{systemStats.activeEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Pending PTO</p>
                      <p className="text-lg font-semibold text-slate-900">{systemStats.pendingPTO}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Settings className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Roles</p>
                      <p className="text-lg font-semibold text-slate-900">{systemStats.totalRoles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Breakdown */}
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Department Breakdown - All 13 Roles</CardTitle>
                <CardDescription className="text-slate-600">
                  Complete role structure including the Dishwasher role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(DEPARTMENTS).map(([dept, config]) => {
                    const roles = getRolesByDepartment(dept);
                    return (
                      <div key={dept} className={`p-4 ${config.bgColor} rounded-lg border border-slate-200`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-medium ${config.textColor}`}>{config.name}</h3>
                          <Badge variant="secondary">
                            {roles.length} roles
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {roles.slice(0, 3).map(role => (
                            <p key={role.name} className={`text-sm ${config.textColor} opacity-75`}>
                              {role.name}
                            </p>
                          ))}
                          {roles.length > 3 && (
                            <p className={`text-xs ${config.textColor} opacity-50`}>
                              +{roles.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'schedule' && (
          <WeeklyLaborSchedule />
        )}

        {activeView === 'roles' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">All 13 Roles</h2>
              <p className="text-slate-600">Complete list including the Dishwasher role</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROLES.map(role => (
                <Card key={role.name} className="border-slate-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-900">{role.name}</h3>
                      <Badge className={role.colorClass}>
                        {role.abbreviation}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Department: <span className="font-medium">{role.department}</span></p>
                      <p>Ratio: <span className="font-medium">1:{role.ratio}</span></p>
                      <p>Rate: <span className="font-medium">${role.hourly_rate}/hr</span></p>
                      <p>Shifts: <span className="font-medium">{role.shifts.join(', ')}</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Main component with provider wrapper
function LaborManagement() {
  return (
    <LaborDataProvider>
      <LaborManagementContent />
    </LaborDataProvider>
  );
}

export default LaborManagement;

