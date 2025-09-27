import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, BarChart3, Calculator, Zap, 
  AlertTriangle, CheckCircle, Clock, DollarSign, Users,
  Target, Activity, Lightbulb, ArrowRight
} from 'lucide-react';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';
import { ROLES, SPEND_PER_GUEST } from '@/config/laborScheduleConfig';

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-semibold rounded border";
  const variantClasses = {
    default: "bg-blue-600 text-white border-blue-500",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Sales Forecast Engine
class SalesForecastEngine {
  constructor(historicalData = []) {
    this.historicalData = historicalData;
    this.seasonalFactors = {
      monday: 0.85,
      tuesday: 0.90,
      wednesday: 0.95,
      thursday: 1.05,
      friday: 1.25,
      saturday: 1.35,
      sunday: 1.15
    };
    this.weatherImpact = {
      sunny: 1.1,
      cloudy: 1.0,
      rainy: 0.85,
      stormy: 0.7
    };
    this.eventImpact = {
      holiday: 1.4,
      local_event: 1.2,
      sports_game: 1.15,
      normal: 1.0
    };
  }

  // Generate forecast for a specific date
  generateDayForecast(date, weather = 'cloudy', events = ['normal']) {
    const dayName = format(date, 'EEEE').toLowerCase();
    const baseRevenue = this.getBaseRevenue(date);
    
    let forecast = baseRevenue;
    forecast *= this.seasonalFactors[dayName] || 1.0;
    forecast *= this.weatherImpact[weather] || 1.0;
    
    // Apply event impacts
    events.forEach(event => {
      forecast *= this.eventImpact[event] || 1.0;
    });

    const guestCount = Math.round(forecast / SPEND_PER_GUEST);
    
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: dayName,
      projectedRevenue: Math.round(forecast),
      projectedGuests: guestCount,
      spendPerGuest: SPEND_PER_GUEST,
      confidence: this.calculateConfidence(date, weather, events),
      factors: {
        seasonal: this.seasonalFactors[dayName],
        weather: this.weatherImpact[weather],
        events: events
      }
    };
  }

  // Get base revenue for a date (simplified - in real app would use ML)
  getBaseRevenue(date) {
    // Simulate historical average with some variation
    const baseDaily = 2500; // Base daily revenue
    const monthFactor = this.getMonthFactor(date.getMonth());
    const randomVariation = 0.9 + (Math.random() * 0.2); // ±10% variation
    
    return baseDaily * monthFactor * randomVariation;
  }

  // Monthly seasonality factors
  getMonthFactor(month) {
    const factors = {
      0: 0.8,  // January
      1: 0.85, // February
      2: 0.95, // March
      3: 1.0,  // April
      4: 1.1,  // May
      5: 1.2,  // June
      6: 1.25, // July
      7: 1.2,  // August
      8: 1.1,  // September
      9: 1.05, // October
      10: 1.15, // November
      11: 1.3   // December
    };
    return factors[month] || 1.0;
  }

  // Calculate forecast confidence
  calculateConfidence(date, weather, events) {
    let confidence = 85; // Base confidence
    
    // Reduce confidence for far future dates
    const daysOut = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
    if (daysOut > 7) confidence -= Math.min(daysOut - 7, 20);
    
    // Reduce confidence for extreme weather
    if (weather === 'stormy') confidence -= 15;
    if (weather === 'rainy') confidence -= 5;
    
    // Increase confidence for known events
    if (events.includes('holiday')) confidence += 10;
    
    return Math.max(Math.min(confidence, 95), 60);
  }

  // Generate week forecast
  generateWeekForecast(weekStart, weatherData = {}, eventData = {}) {
    const weekForecast = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const weather = weatherData[dateKey] || 'cloudy';
      const events = eventData[dateKey] || ['normal'];
      
      weekForecast.push(this.generateDayForecast(date, weather, events));
    }
    
    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      days: weekForecast,
      totals: this.calculateWeekTotals(weekForecast),
      averageConfidence: weekForecast.reduce((sum, day) => sum + day.confidence, 0) / 7
    };
  }

  // Calculate week totals
  calculateWeekTotals(weekForecast) {
    return weekForecast.reduce((totals, day) => ({
      revenue: totals.revenue + day.projectedRevenue,
      guests: totals.guests + day.projectedGuests
    }), { revenue: 0, guests: 0 });
  }
}

// Smart Scheduling Engine
class SchedulingEngine {
  constructor(roles = ROLES) {
    this.roles = roles;
    this.laborTargetPercentage = 14;
  }

  // Generate optimal staffing for a day
  generateOptimalStaffing(forecast) {
    const { projectedRevenue, projectedGuests } = forecast;
    const targetLaborCost = projectedRevenue * (this.laborTargetPercentage / 100);
    
    const staffingPlan = {
      AM: {},
      PM: {},
      SWING: {}
    };

    // Calculate staffing for each shift
    ['AM', 'PM', 'SWING'].forEach(shift => {
      const shiftGuests = this.calculateShiftGuests(projectedGuests, shift);
      const shiftRevenue = shiftGuests * SPEND_PER_GUEST;
      const shiftLaborBudget = shiftRevenue * (this.laborTargetPercentage / 100);
      
      staffingPlan[shift] = this.calculateShiftStaffing(shiftGuests, shiftLaborBudget, shift);
    });

    return {
      date: forecast.date,
      projectedGuests: projectedGuests,
      projectedRevenue: projectedRevenue,
      targetLaborCost: targetLaborCost,
      staffingPlan: staffingPlan,
      totalStaffNeeded: this.calculateTotalStaff(staffingPlan),
      laborEfficiency: this.calculateLaborEfficiency(staffingPlan, projectedRevenue)
    };
  }

  // Calculate guests per shift
  calculateShiftGuests(totalGuests, shift) {
    const shiftDistribution = {
      AM: 0.25,   // 25% of daily guests
      PM: 0.55,   // 55% of daily guests  
      SWING: 0.20 // 20% of daily guests
    };
    
    return Math.round(totalGuests * shiftDistribution[shift]);
  }

  // Calculate optimal staffing for a shift
  calculateShiftStaffing(shiftGuests, laborBudget, shift) {
    const shiftRoles = this.roles.filter(role => role.shifts.includes(shift));
    const staffing = {};
    
    shiftRoles.forEach(role => {
      const neededCount = Math.ceil(shiftGuests / role.ratio);
      const adjustedCount = Math.max(neededCount, role.minCount || 1);
      
      staffing[role.name] = {
        count: adjustedCount,
        hourlyRate: role.hourly_rate,
        shiftHours: this.getShiftHours(shift),
        totalCost: adjustedCount * role.hourly_rate * this.getShiftHours(shift),
        efficiency: shiftGuests / (adjustedCount * role.ratio)
      };
    });
    
    return staffing;
  }

  // Get shift duration in hours
  getShiftHours(shift) {
    const shiftHours = {
      AM: 8,    // 8:30 AM - 4:30 PM
      PM: 8,    // 3:00 PM - 11:00 PM
      SWING: 8  // 10:00 AM - 6:00 PM
    };
    return shiftHours[shift] || 8;
  }

  // Calculate total staff needed
  calculateTotalStaff(staffingPlan) {
    let total = 0;
    Object.values(staffingPlan).forEach(shift => {
      Object.values(shift).forEach(role => {
        total += role.count;
      });
    });
    return total;
  }

  // Calculate labor efficiency
  calculateLaborEfficiency(staffingPlan, projectedRevenue) {
    let totalLaborCost = 0;
    
    Object.values(staffingPlan).forEach(shift => {
      Object.values(shift).forEach(role => {
        totalLaborCost += role.totalCost;
      });
    });
    
    const laborPercentage = (totalLaborCost / projectedRevenue) * 100;
    
    return {
      totalLaborCost: totalLaborCost,
      laborPercentage: laborPercentage,
      isOptimal: laborPercentage <= this.laborTargetPercentage + 1,
      variance: laborPercentage - this.laborTargetPercentage
    };
  }
}

// Forecast Display Component
const ForecastDisplay = ({ forecast, onApplyStaffing }) => {
  if (!forecast) return null;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-emerald-600';
    if (confidence >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 80) return <Badge variant="success">High Confidence</Badge>;
    if (confidence >= 70) return <Badge variant="warning">Medium Confidence</Badge>;
    return <Badge variant="error">Low Confidence</Badge>;
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Sales Forecast - {format(parseISO(forecast.date), 'EEEE, MMM d')}
          </CardTitle>
          {getConfidenceBadge(forecast.confidence)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${forecast.projectedRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Projected Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {forecast.projectedGuests}
            </div>
            <div className="text-sm text-slate-600">Expected Guests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${forecast.spendPerGuest}
            </div>
            <div className="text-sm text-slate-600">Spend per Guest</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600">
              Confidence: <span className={`font-medium ${getConfidenceColor(forecast.confidence)}`}>
                {forecast.confidence}%
              </span>
            </div>
            <div className="text-sm text-slate-600">
              Day: <span className="font-medium text-slate-900 capitalize">
                {forecast.dayName}
              </span>
            </div>
          </div>
          <Button
            onClick={() => onApplyStaffing(forecast)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Staffing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Staffing Recommendation Component
const StaffingRecommendation = ({ staffingPlan, onApplyToSchedule }) => {
  if (!staffingPlan) return null;

  const { laborEfficiency } = staffingPlan;
  const isOptimal = laborEfficiency.isOptimal;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-emerald-600" />
            Smart Staffing Recommendation
          </CardTitle>
          <Badge variant={isOptimal ? "success" : "warning"}>
            {isOptimal ? "Optimal" : "Needs Adjustment"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Labor Efficiency Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {staffingPlan.totalStaffNeeded}
            </div>
            <div className="text-sm text-slate-600">Total Staff</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              ${laborEfficiency.totalLaborCost.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Labor Cost</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isOptimal ? 'text-emerald-600' : 'text-amber-600'}`}>
              {laborEfficiency.laborPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600">Labor %</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {staffingPlan.projectedGuests}
            </div>
            <div className="text-sm text-slate-600">Guests</div>
          </div>
        </div>

        {/* Shift Breakdown */}
        <div className="space-y-4">
          {Object.entries(staffingPlan.staffingPlan).map(([shift, roles]) => (
            <div key={shift} className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {shift} Shift
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(roles).map(([roleName, roleData]) => (
                  <div key={roleName} className="bg-slate-50 rounded-md p-3">
                    <div className="font-medium text-sm text-slate-900">{roleName}</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Count: {roleData.count}</div>
                      <div>Rate: ${roleData.hourlyRate}/hr</div>
                      <div>Cost: ${roleData.totalCost}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => onApplyToSchedule(staffingPlan)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply to Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Smart Scheduling Engine Component
const SmartSchedulingEngine = ({ onScheduleUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [forecast, setForecast] = useState(null);
  const [staffingPlan, setStaffingPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const forecastEngine = new SalesForecastEngine();
  const schedulingEngine = new SchedulingEngine(); // ← Fixed class name

  // Generate forecast for selected date
  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const date = parseISO(selectedDate);
      const newForecast = forecastEngine.generateDayForecast(date);
      setForecast(newForecast);
      setStaffingPlan(null); // Reset staffing plan
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate staffing plan
  const generateStaffing = (forecastData) => {
    const newStaffingPlan = schedulingEngine.generateOptimalStaffing(forecastData);
    setStaffingPlan(newStaffingPlan);
  };

  // Apply staffing to schedule
  const applyToSchedule = (staffingData) => {
    if (onScheduleUpdate) {
      onScheduleUpdate(staffingData);
    }
    console.log('Applying staffing to schedule:', staffingData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Smart Scheduling Engine</h2>
          <p className="text-slate-600">AI-powered forecasting and optimal staffing recommendations</p>
        </div>
        <Badge variant="info">
          <Lightbulb className="h-3 w-3 mr-1" />
          Beta Feature
        </Badge>
      </div>

      {/* Date Selection */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Select Date:</label>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-1 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Button
              onClick={generateForecast}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Forecast
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Display */}
      {forecast && (
        <ForecastDisplay
          forecast={forecast}
          onApplyStaffing={generateStaffing}
        />
      )}

      {/* Staffing Recommendation */}
      {staffingPlan && (
        <StaffingRecommendation
          staffingPlan={staffingPlan}
          onApplyToSchedule={applyToSchedule}
        />
      )}

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Smart Scheduling Tips</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Forecasts consider day of week, seasonality, and historical patterns</li>
                <li>• Staffing recommendations target 14% labor cost for optimal efficiency</li>
                <li>• Higher confidence forecasts (80%+) are more reliable for planning</li>
                <li>• Review and adjust recommendations based on local knowledge</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartSchedulingEngine;
