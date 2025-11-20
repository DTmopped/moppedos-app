import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

// Enhanced Budget Row Component with breakdown support
const EnhancedBudgetRow = ({ 
  title, 
  scheduled, 
  budget, 
  emoji,
  breakdown = null,
  isTotal = false 
}) => {
  const percentage = budget > 0 ? (scheduled / budget) * 100 : 0;
  const variance = scheduled - budget;
  
  const getStatusColor = (pct) => {
    if (pct <= 95) return "text-emerald-600";
    if (pct <= 105) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusIcon = (pct) => {
    if (pct <= 95) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (pct <= 105) return <AlertCircle className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getProgressColor = (pct) => {
    if (pct <= 95) return "bg-emerald-500";
    if (pct <= 105) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className={`${isTotal ? 'border-t-2 border-slate-300 pt-4 mt-2' : ''}`}>
      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center space-x-4 flex-1">
          {/* Title */}
          <div className="flex items-center space-x-2 min-w-[120px]">
            {emoji && <span className="text-xl">{emoji}</span>}
            <span className={`font-bold ${isTotal ? 'text-lg' : 'text-sm'} text-slate-800`}>
              {title}
            </span>
          </div>
          
          {/* Amounts */}
          <div className="flex items-center space-x-3">
            <span className={`${isTotal ? 'text-xl' : 'text-base'} font-bold text-slate-900`}>
              ${scheduled.toLocaleString()}
            </span>
            <span className="text-slate-400">/</span>
            <span className={`${isTotal ? 'text-lg' : 'text-base'} font-semibold text-slate-600`}>
              ${budget.toLocaleString()}
            </span>
            
            {/* Status */}
            <div className="flex items-center space-x-2">
              {getStatusIcon(percentage)}
              <span className={`font-bold ${getStatusColor(percentage)}`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          
          {/* Variance */}
          <div className={`text-sm font-medium ${variance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {variance > 0 ? '+' : ''}{variance.toFixed(0)}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden ml-4">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Breakdown (if provided) */}
      {breakdown && breakdown.length > 0 && (
        <div className="ml-8 mt-2 space-y-1">
          {breakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-1 px-3 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">├─</span>
                <span>{item.name}:</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold">${item.cost.toFixed(0)}</span>
                <span className="text-slate-400 text-xs">({item.percent.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Enhanced Budget Section Component
export const EnhancedLiveBudgetSection = ({ 
  scheduleData, 
  location, 
  showManagerView 
}) => {
  // Calculate live budget data
  const budgetData = useMemo(() => {
    if (!location?.annual_revenue_target) {
      return null;
    }

    const weeklyRevenue = location.annual_revenue_target / 52;
    
    // Budget targets from location settings
    const budgets = {
      foh: weeklyRevenue * (location.target_foh_percent || 0),
      boh: weeklyRevenue * (location.target_boh_percent || 0),
      mgmt: weeklyRevenue * (location.target_mgmt_percent || 0)
    };
    
    // Calculate actuals from schedule
    const actuals = {
      fohDining: 0,
      bar: 0,
      boh: 0,
      mgmt: 0
    };
    
    Object.values(scheduleData || {}).forEach(cell => {
      if (cell?.employee) {
        const cost = (cell.employee.hours || 0) * (cell.employee.hourly_rate || 0);
        const dept = cell.employee.department || '';
        const role = cell.employee.role || '';
        
        // Handle both database format and config format
        if (dept.includes('Front of House') || dept === 'FOH') {
          // Separate bar from dining
          if (role === 'Bartender' || role.toLowerCase().includes('bartender')) {
            actuals.bar += cost;
          } else {
            actuals.fohDining += cost;
          }
        } else if (dept.includes('Bar') && !dept.includes('Front')) {
          actuals.bar += cost;
        } else if (dept.includes('Back of House') || dept === 'BOH') {
          actuals.boh += cost;
        } else if (dept.includes('Management') || dept === 'Management') {
          actuals.mgmt += cost;
        }
      }
    });
    
    const totalBudget = budgets.foh + budgets.boh + budgets.mgmt;
    const totalActual = actuals.fohDining + actuals.bar + actuals.boh + actuals.mgmt;
    const fohTotal = actuals.fohDining + actuals.bar;
    
    return {
      budgets,
      actuals,
      totalBudget,
      totalActual,
      fohTotal
    };
  }, [scheduleData, location]);

  if (!showManagerView || !budgetData) {
    return null;
  }

  const { budgets, actuals, totalBudget, totalActual, fohTotal } = budgetData;

  return (
    <Card className="border-slate-300 shadow-lg bg-white no-print">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-slate-600" />
            <h3 className="text-xl font-bold text-slate-800">💼 Labor Budget vs Actual</h3>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              <TrendingUp className="h-3 w-3" />
              <span>Live Tracking</span>
            </div>
          </div>
          
          {/* Budget Status Summary */}
          <div className="text-right">
            <div className="text-sm text-slate-600">Weekly Budget</div>
            <div className={`text-2xl font-bold ${
              totalActual <= totalBudget ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(0) : 0}%
            </div>
          </div>
        </div>
        
        {/* Budget Rows */}
        <div className="space-y-3">
          {/* FOH & Bar Combined */}
          <EnhancedBudgetRow 
            title="FOH & Bar"
            scheduled={fohTotal}
            budget={budgets.foh}
            emoji="🍽️"
            breakdown={fohTotal > 0 ? [
              {
                name: "Dining",
                cost: actuals.fohDining,
                percent: (actuals.fohDining / fohTotal) * 100
              },
              {
                name: "Bar",
                cost: actuals.bar,
                percent: (actuals.bar / fohTotal) * 100
              }
            ] : null}
          />
          
          {/* BOH */}
          <EnhancedBudgetRow 
            title="BOH"
            scheduled={actuals.boh}
            budget={budgets.boh}
            emoji="👨‍🍳"
          />
          
          {/* Management */}
          <EnhancedBudgetRow 
            title="Management"
            scheduled={actuals.mgmt}
            budget={budgets.mgmt}
            emoji="👔"
          />
          
          {/* Total */}
          <EnhancedBudgetRow 
            title="Total Labor"
            scheduled={totalActual}
            budget={totalBudget}
            emoji="📊"
            isTotal={true}
          />
        </div>

        {/* Helper Text */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start space-x-2 text-xs text-slate-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-1">Budget updates in real-time as you assign shifts.</div>
              <div>
                Target: ≤95% (under), 95-105% (on target), &gt;105% (over). 
                Budgets calculated from location's annual revenue target and department percentages.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLiveBudgetSection;
