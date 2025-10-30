import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useFinancialData } from '@/hooks/useFinancialData';

const FinancialImpactDashboard = ({ impact, selectedDate }) => {
  const [timeRange, setTimeRange] = useState('daily');
  const { 
    dailyData, 
    weeklyData, 
    monthlyData,
    loading 
  } = useFinancialData(selectedDate, timeRange);

  const data = timeRange === 'daily' ? dailyData : 
               timeRange === 'weekly' ? weeklyData : monthlyData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <SummaryCard
          title="Total Prep Cost"
          value={`$${impact?.total_prep_cost?.toFixed(0) || 0}`}
          change={impact?.cost_variance}
          icon={DollarSign}
          color="blue"
        />
        <SummaryCard
          title="Food Cost %"
          value={`${impact?.food_cost_percentage?.toFixed(1) || 0}%`}
          target="Target: 30%"
          change={impact?.food_cost_percentage - 30}
          icon={BarChart3}
          color={impact?.food_cost_percentage <= 30 ? 'green' : 'orange'}
          isPercentage
        />
        <SummaryCard
          title="Potential Savings"
          value={`$${impact?.potential_savings?.toFixed(0) || 0}`}
          subtitle="By following smart schedule"
          icon={TrendingDown}
          color="green"
        />
      </div>

      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={setTimeRange}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          <DailyView data={dailyData} impact={impact} />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6 mt-6">
          <WeeklyView data={weeklyData} />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6 mt-6">
          <MonthlyView data={monthlyData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SummaryCard = ({ title, value, change, target, subtitle, icon: Icon, color, isPercentage }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-600',
    green: 'border-green-200 bg-green-50 text-green-600',
    orange: 'border-orange-200 bg-orange-50 text-orange-600',
    red: 'border-red-200 bg-red-50 text-red-600'
  };

  const isPositive = change < 0; // For costs, negative is good
  const showChange = change !== undefined && change !== null;

  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            {target && (
              <p className="text-xs text-gray-500">{target}</p>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
            {showChange && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change).toFixed(1)}{isPercentage ? '%' : ''} vs target
                </span>
              </div>
            )}
          </div>
          <Icon className={`h-10 w-10 opacity-50`} />
        </div>
      </CardContent>
    </Card>
  );
};

const DailyView = ({ data, impact }) => {
  if (!impact) return null;

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CostBreakdownRow
              label="Proteins"
              amount={impact.protein_cost}
              percentage={(impact.protein_cost / impact.total_prep_cost) * 100}
              color="red"
            />
            <CostBreakdownRow
              label="Sides"
              amount={impact.sides_cost}
              percentage={(impact.sides_cost / impact.total_prep_cost) * 100}
              color="green"
            />
            <CostBreakdownRow
              label="Desserts"
              amount={impact.desserts_cost}
              percentage={(impact.desserts_cost / impact.total_prep_cost) * 100}
              color="pink"
            />
            <CostBreakdownRow
              label="Misc"
              amount={impact.misc_cost}
              percentage={(impact.misc_cost / impact.total_prep_cost) * 100}
              color="gray"
            />
            <div className="pt-4 border-t border-gray-200">
              <CostBreakdownRow
                label="Total"
                amount={impact.total_prep_cost}
                percentage={100}
                color="blue"
                isBold
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost vs Target Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Expected Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${impact.expected_revenue?.toFixed(0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Food Cost %</p>
                <p className={`text-2xl font-bold ${
                  impact.food_cost_percentage <= 30 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {impact.food_cost_percentage?.toFixed(1)}%
                </p>
              </div>
            </div>

            {impact.food_cost_percentage > 30 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 mb-1">
                      Food Cost Above Target
                    </p>
                    <p className="text-sm text-orange-700">
                      Your food cost is {(impact.food_cost_percentage - 30).toFixed(1)}% above the 30% target.
                      Consider adjusting portion sizes or reviewing prep quantities.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {impact.food_cost_percentage <= 30 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 mb-1">
                      On Target! 🎯
                    </p>
                    <p className="text-sm text-green-700">
                      Your food cost is within the target range. Great job managing prep efficiently!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Waste & Shortage Risk */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="font-medium text-orange-900">Waste Risk</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                ${impact.potential_waste?.toFixed(0) || 0}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                If overprepped
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-900">Shortage Risk</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                ${impact.potential_shortage?.toFixed(0) || 0}
              </p>
              <p className="text-xs text-red-700 mt-1">
                Lost profit if underprepped
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const WeeklyView = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-gray-500">No weekly data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Weekly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Prep Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="prep_cost" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Prep Cost"
              />
              <Line 
                type="monotone" 
                dataKey="target_cost" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target Cost"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Prep Cost</p>
              <p className="text-2xl font-bold text-blue-600">
                ${data.reduce((sum, d) => sum + d.prep_cost, 0).toFixed(0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg Food Cost %</p>
              <p className="text-2xl font-bold text-green-600">
                {(data.reduce((sum, d) => sum + d.food_cost_pct, 0) / data.length).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Guests</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.reduce((sum, d) => sum + d.guests, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MonthlyView = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-gray-500">No monthly data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Food Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="prep_cost" fill="#3b82f6" name="Prep Cost" />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Prep Cost</p>
              <p className="text-2xl font-bold text-blue-600">
                ${data.reduce((sum, d) => sum + d.prep_cost, 0).toFixed(0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${data.reduce((sum, d) => sum + d.revenue, 0).toFixed(0)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg Food Cost %</p>
              <p className="text-2xl font-bold text-orange-600">
                {(data.reduce((sum, d) => sum + d.food_cost_pct, 0) / data.length).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Guests</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.reduce((sum, d) => sum + d.guests, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CostBreakdownRow = ({ label, amount, percentage, color, isBold }) => {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    pink: 'bg-pink-500',
    gray: 'bg-gray-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} text-gray-900`}>
            {label}
          </span>
          <span className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} text-gray-900`}>
            ${amount?.toFixed(0)} ({percentage?.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default FinancialImpactDashboard;
