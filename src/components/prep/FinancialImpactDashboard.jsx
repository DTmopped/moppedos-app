import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const FinancialImpactDashboard = ({ financialImpact, prepSchedule }) => {
  const [timeRange, setTimeRange] = useState('daily');

  // Use financialImpact prop (not "impact")
  const impact = financialImpact || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Total Prep Cost</p>
              <p className="text-3xl font-bold text-blue-600">
                ${impact?.total_prep_cost?.toFixed(0) || 0}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className={`border-2 rounded-lg p-6 ${
          (impact?.food_cost_percentage || 0) <= 30 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Food Cost %</p>
              <p className={`text-3xl font-bold ${
                (impact?.food_cost_percentage || 0) <= 30 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {impact?.food_cost_percentage?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Target: 30%</p>
              {impact?.food_cost_percentage && (
                <div className="flex items-center gap-1 mt-2">
                  {impact.food_cost_percentage <= 30 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {Math.abs(impact.food_cost_percentage - 30).toFixed(1)}% below target
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {(impact.food_cost_percentage - 30).toFixed(1)}% above target
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Potential Savings</p>
              <p className="text-3xl font-bold text-green-600">
                ${impact?.potential_savings?.toFixed(0) || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">By following smart schedule</p>
            </div>
            <TrendingDown className="h-10 w-10 text-green-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTimeRange('daily')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setTimeRange('weekly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setTimeRange('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Daily View */}
      {timeRange === 'daily' && (
        <div className="space-y-6">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Cost Breakdown</h3>
            <div className="space-y-4">
              <CostBreakdownRow
                label="Proteins"
                amount={impact.protein_cost || 0}
                percentage={impact.total_prep_cost ? (impact.protein_cost / impact.total_prep_cost) * 100 : 0}
                color="red"
              />
              <CostBreakdownRow
                label="Sides"
                amount={impact.sides_cost || 0}
                percentage={impact.total_prep_cost ? (impact.sides_cost / impact.total_prep_cost) * 100 : 0}
                color="green"
              />
              <CostBreakdownRow
                label="Desserts"
                amount={impact.desserts_cost || 0}
                percentage={impact.total_prep_cost ? (impact.desserts_cost / impact.total_prep_cost) * 100 : 0}
                color="pink"
              />
              <CostBreakdownRow
                label="Misc"
                amount={impact.misc_cost || 0}
                percentage={impact.total_prep_cost ? (impact.misc_cost / impact.total_prep_cost) * 100 : 0}
                color="gray"
              />
              <div className="pt-4 border-t border-gray-200">
                <CostBreakdownRow
                  label="Total"
                  amount={impact.total_prep_cost || 0}
                  percentage={100}
                  color="blue"
                  isBold
                />
              </div>
            </div>
          </div>

          {/* Variance Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cost vs Target Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Expected Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${impact.expected_revenue?.toFixed(0) || 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Food Cost %</p>
                  <p className={`text-2xl font-bold ${
                    (impact.food_cost_percentage || 0) <= 30 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {impact.food_cost_percentage?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>

              {(impact.food_cost_percentage || 0) > 30 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900 mb-1">
                        Food Cost Above Target
                      </p>
                      <p className="text-sm text-orange-700">
                        Your food cost is {((impact.food_cost_percentage || 0) - 30).toFixed(1)}% above the 30% target.
                        Consider adjusting portion sizes or reviewing prep quantities.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(impact.food_cost_percentage || 0) <= 30 && (
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
          </div>

          {/* Risk Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Analysis</h3>
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
          </div>
        </div>
      )}

      {/* Weekly/Monthly placeholder */}
      {(timeRange === 'weekly' || timeRange === 'monthly') && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {timeRange === 'weekly' ? 'Weekly' : 'Monthly'} data view coming soon
          </p>
          <p className="text-gray-400 mt-2">
            Historical trends and analytics will be available here
          </p>
        </div>
      )}
    </div>
  );
};

const CostBreakdownRow = ({ label, amount, percentage, color, isBold }) => {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    pink: 'bg-pink-500',
    gray: 'bg-gray-500',
    blue: 'bg-blue-600'
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} text-gray-700`}>
            {label}
          </span>
          <span className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} text-gray-900`}>
            ${amount.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${colorClasses[color]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-sm text-gray-600 w-12 text-right">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

export default FinancialImpactDashboard;
