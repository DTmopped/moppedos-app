import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, Users, Calendar, TrendingUp, Settings, Clock, Target, Zap,
  AlertCircle, CheckCircle, Wifi, WifiOff
} from 'lucide-react';

import { LaborDataProvider, useLaborData } from '@/contexts/LaborDataContext';
import { DEPARTMENTS, ROLES, getRolesByDepartment } from '@/config/laborScheduleConfig';

// Import your existing labor components (these will use the new data context)
// Update these import paths to match your actual component locations
import WeeklyLaborSchedule from '@/components/WeeklyLaborSchedule'; // Your existing component

function LaborManagementContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showWelcome, setShowWelcome] = useState(true);
  
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
                <h1 className="text-xl font-bold text-slate-900">Labor Management</h1>
                <p className="text-sm text-slate-600">Mopped Restaurant Operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant="outline" 
                className={`${
                  isConnected 
                    ? 'text-emerald-600 border-emerald-200 bg-emerald-50' 
                    : 'text-amber-600 border-amber-200 bg-amber-50'
                }`}
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

      {/* Error Alert */}
      {error && (
        <Alert className="mx-4 mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-slate-100">
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2 data-[state=active]:bg-slate-100">
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2 data-[state=active]:bg-slate-100">
              <Users className="w-4 h-4" />
              <span>Roles</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Labor Management Overview</h2>
              <p className="text-slate-600">
                Complete Mopped Restaurant labor management with 13 roles and 14% efficiency target
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
                <CardTitle className="text-slate-900">Department Breakdown</CardTitle>
                <CardDescription className="text-slate-600">
                  13 roles across 4 departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(DEPARTMENTS).map(([dept, config]) => {
                    const roles = getRolesByDepartment(dept);
                    return (
                      <div key={dept} className={`p-4 ${config.bgColor} rounded-lg border ${config.borderColor || 'border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-medium ${config.textColor}`}>{config.name}</h3>
                          <Badge variant="secondary" className="text-xs">
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
          </TabsContent>

          {/* Schedule Tab - Your existing component */}
          <TabsContent value="schedule">
            <WeeklyLaborSchedule />
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">All Roles</h2>
              <p className="text-slate-600">Complete list of all 13 Mopped Restaurant roles</p>
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
          </TabsContent>
        </Tabs>
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
