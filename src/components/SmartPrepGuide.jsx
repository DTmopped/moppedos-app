import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChefHat, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Flame,
  Package,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { useSmartPrepLogic } from '@/hooks/useSmartPrepLogic';
import PrepStationView from './prep/PrepStationView';
import RethermSchedule from './prep/RethermSchedule';
import FinancialImpactDashboard from './prep/FinancialImpactDashboard';

const SmartPrepGuide = () => {
  const {
    prepSchedule,
    financialImpact,
    loading,
    refreshData,
    selectedDate,
    setSelectedDate
  } = useSmartPrepLogic();

  const [activeTab, setActiveTab] = useState('prep-guide');
  const [selectedStation, setSelectedStation] = useState('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Prep Guide</h1>
                <p className="text-sm text-gray-500">
                  Mopped BBQ Restaurant • Logic-based prep planning
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Selector */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />

            <Button
              variant="outline"
              onClick={refreshData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expected Guests</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {prepSchedule?.expected_guests || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Prep Cost</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${financialImpact?.total_prep_cost?.toFixed(0) || 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Food Cost %</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {financialImpact?.food_cost_percentage?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-gray-500">Target: 30%</p>
                </div>
                {financialImpact?.food_cost_percentage <= 30 ? (
                  <TrendingDown className="h-8 w-8 text-green-600 opacity-50" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Smart Factor</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {prepSchedule?.adjustment_factor?.toFixed(2) || 1.0}x
                  </p>
                  <p className="text-xs text-gray-500">
                    {prepSchedule?.adjustment_factor > 1.1 ? 'High demand' : 
                     prepSchedule?.adjustment_factor < 0.9 ? 'Low demand' : 'Normal'}
                  </p>
                </div>
                <Flame className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="prep-guide">Prep Guide</TabsTrigger>
            <TabsTrigger value="retherm-schedule">Retherm Schedule</TabsTrigger>
            <TabsTrigger value="financial">Financial Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="prep-guide">
            <PrepStationView 
              schedule={prepSchedule}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
            />
          </TabsContent>

          <TabsContent value="retherm-schedule">
            <RethermSchedule schedule={prepSchedule} />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialImpactDashboard 
              impact={financialImpact}
              selectedDate={selectedDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SmartPrepGuide;
