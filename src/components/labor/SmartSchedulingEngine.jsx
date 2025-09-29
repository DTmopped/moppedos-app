import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, BarChart3, Calculator, Zap, 
  AlertTriangle, CheckCircle, Clock, DollarSign, Users,
  Target, Activity, Lightbulb, ArrowRight, Calendar,
  Cloud, Sun, CloudRain, CloudSnow, Play, Pause, Settings,
  RefreshCw, Brain, Gauge
} from 'lucide-react';
import { format, addDays, startOfWeek, parseISO, addWeeks } from 'date-fns';
import { useLaborData } from '@/contexts/LaborDataContext';

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
    live: "bg-green-500 text-white border-green-400 animate-pulse"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Smart Scheduling Engine Status
const EngineStatus = ({ isActive, onToggle, onRefresh, onConfigure }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <Card className="border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Smart Scheduling Engine</h3>
              <div className="flex items-center space-x-2">
                {isActive ? (
                  <Badge variant="live">Live Analysis</Badge>
                ) : (
                  <Badge variant="secondary">Paused</Badge>
                )}
                <span className="text-xs text-slate-600">
                  Last updated: {format(lastUpdate, 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onConfigure}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={onToggle}
              className={isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Metrics
const PerformanceMetrics = () => {
  const metrics = {
    accuracy: 94,
    savings: 2847,
    optimizations: 127,
    efficiency: 91
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-emerald-600 rounded-full">
              <Target className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{metrics.accuracy}%</div>
          <div className="text-sm text-emerald-700">Accuracy Rate</div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-blue-600 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">${metrics.savings.toLocaleString()}</div>
          <div className="text-sm text-blue-700">Monthly Savings</div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-purple-600 rounded-full">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{metrics.optimizations}</div>
          <div className="text-sm text-purple-700">Optimizations</div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-orange-600 rounded-full">
              <Gauge className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-900">{metrics.efficiency}%</div>
          <div className="text-sm text-orange-700">Efficiency Score</div>
        </CardContent>
      </Card>
    </div>
  );
};

// AI Forecasting Dashboard
const ForecastingDashboard = () => {
  const forecasts = {
    todayGuests: { value: 187, trend: 12, confidence: 89 },
    laborHours: { value: 142, trend: -5, confidence: 92 },
    laborCost: { value: 2556, trend: -8, confidence: 87 },
    efficiency: { value: 94, trend: 3, confidence: 91 }
  };

  const getTrendIcon = (trend) => {
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (trend) => {
    return trend > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <BarChart3 className="h-5 w-5 mr-2" />
          AI Forecasting Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{forecasts.todayGuests.value}</div>
            <div className="text-sm text-slate-600 mb-1">Today's Guest Count</div>
            <div className="flex items-center justify-center space-x-1">
              {getTrendIcon(forecasts.todayGuests.trend)}
              <span className={`text-xs font-medium ${getTrendColor(forecasts.todayGuests.trend)}`}>
                {Math.abs(forecasts.todayGuests.trend)}%
              </span>
              <span className="text-xs text-slate-500">
                ({forecasts.todayGuests.confidence}% confidence)
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{forecasts.laborHours.value}</div>
            <div className="text-sm text-slate-600 mb-1">Labor Hours Needed</div>
            <div className="flex items-center justify-center space-x-1">
              {getTrendIcon(forecasts.laborHours.trend)}
              <span className={`text-xs font-medium ${getTrendColor(forecasts.laborHours.trend)}`}>
                {Math.abs(forecasts.laborHours.trend)}%
              </span>
              <span className="text-xs text-slate-500">
                ({forecasts.laborHours.confidence}% confidence)
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">${forecasts.laborCost.value.toLocaleString()}</div>
            <div className="text-sm text-slate-600 mb-1">Est. Labor Cost</div>
            <div className="flex items-center justify-center space-x-1">
              {getTrendIcon(forecasts.laborCost.trend)}
              <span className={`text-xs font-medium ${getTrendColor(forecasts.laborCost.trend)}`}>
                {Math.abs(forecasts.laborCost.trend)}%
              </span>
              <span className="text-xs text-slate-500">
                ({forecasts.laborCost.confidence}% confidence)
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{forecasts.efficiency.value}%</div>
            <div className="text-sm text-slate-600 mb-1">Efficiency Score</div>
            <div className="flex items-center justify-center space-x-1">
              {getTrendIcon(forecasts.efficiency.trend)}
              <span className={`text-xs font-medium ${getTrendColor(forecasts.efficiency.trend)}`}>
                {Math.abs(forecasts.efficiency.trend)}%
              </span>
              <span className="text-xs text-slate-500">
                ({forecasts.efficiency.confidence}% confidence)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Weather Impact Analysis
const WeatherImpact = () => {
  const weatherForecast = [
    { day: 'Mon', temp: 72, condition: 'sunny', guests: 195, icon: Sun },
    { day: 'Tue', temp: 68, condition: 'cloudy', guests: 180, icon: Cloud },
    { day: 'Wed', temp: 65, condition: 'rainy', guests: 95, icon: CloudRain },
    { day: 'Thu', temp: 70, condition: 'cloudy', guests: 175, icon: Cloud },
    { day: 'Fri', temp: 75, condition: 'sunny', guests: 220, icon: Sun },
    { day: 'Sat', temp: 78, condition: 'sunny', guests: 285, icon: Sun },
    { day: 'Sun', temp: 74, condition: 'cloudy', guests: 210, icon: Cloud }
  ];

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <Cloud className="h-5 w-5 mr-2" />
          Weather Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weatherForecast.map((day, index) => {
            const IconComponent = day.icon;
            return (
              <div key={index} className="text-center p-2 bg-slate-50 rounded-lg">
                <div className="text-xs font-medium text-slate-600 mb-1">{day.day}</div>
                <IconComponent className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                <div className="text-xs text-slate-600">{day.temp}°F</div>
                <div className="text-xs font-medium text-slate-900">{day.guests}</div>
                <div className="text-xs text-slate-500">guests</div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">AI Insight</h4>
              <p className="text-sm text-blue-700 mt-1">
                Wednesday's rain will reduce foot traffic by ~35%. Consider reducing FOH staff by 2-3 positions 
                and adjusting kitchen prep accordingly.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Hourly Demand Forecast
const HourlyDemand = () => {
  const hourlyData = [
    { hour: '11:00 AM', guests: 45, confidence: 85 },
    { hour: '12:00 PM', guests: 78, confidence: 90 },
    { hour: '1:00 PM', guests: 92, confidence: 88 },
    { hour: '2:00 PM', guests: 65, confidence: 87 },
    { hour: '3:00 PM', guests: 38, confidence: 85 },
    { hour: '4:00 PM', guests: 42, confidence: 86 },
    { hour: '5:00 PM', guests: 89, confidence: 91 },
    { hour: '6:00 PM', guests: 125, confidence: 93 },
    { hour: '7:00 PM', guests: 142, confidence: 92 },
    { hour: '8:00 PM', guests: 156, confidence: 90 },
    { hour: '9:00 PM', guests: 98, confidence: 88 },
    { hour: '10:00 PM', guests: 45, confidence: 85 }
  ];

  const peakHour = hourlyData.reduce((max, current) => 
    current.guests > max.guests ? current : max
  );

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <Clock className="h-5 w-5 mr-2" />
          Hourly Demand Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center text-amber-700">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                Peak Alert: {peakHour.hour} expected to be busiest with {peakHour.guests} guests
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {hourlyData.map((data, index) => {
            const isPeak = data.hour === peakHour.hour;
            const barWidth = (data.guests / peakHour.guests) * 100;
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-slate-600">{data.hour}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 relative">
                  <div 
                    className={`h-full rounded-full ${isPeak ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {data.guests} guests
                    </span>
                  </div>
                </div>
                <div className="w-16 text-xs text-slate-500 text-right">
                  {data.confidence}% conf.
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Smart Recommendations
const SmartRecommendations = ({ onApply }) => {
  const recommendations = [
    {
      id: 1,
      type: 'staffing',
      priority: 'high',
      title: 'Reduce Kitchen Swing Shifts',
      description: 'Wednesday rain forecast suggests 35% lower volume. Reduce swing shift by 2 positions.',
      impact: 'Save $180 in labor costs',
      confidence: 87
    },
    {
      id: 2,
      type: 'scheduling',
      priority: 'medium',
      title: 'Add FOH Support for Friday',
      description: 'Sunny weather + local event expected to increase Friday dinner rush by 25%.',
      impact: 'Improve service efficiency by 15%',
      confidence: 92
    },
    {
      id: 3,
      type: 'optimization',
      priority: 'low',
      title: 'Optimize Prep Schedule',
      description: 'Shift prep tasks to align with forecasted demand patterns.',
      impact: 'Reduce food waste by 8%',
      confidence: 78
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-amber-200 bg-amber-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return <Badge variant="error">High Priority</Badge>;
      case 'medium': return <Badge variant="warning">Medium Priority</Badge>;
      case 'low': return <Badge variant="info">Low Priority</Badge>;
      default: return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <Lightbulb className="h-5 w-5 mr-2" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-slate-900">{rec.title}</h4>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>Impact: {rec.impact}</span>
                    <span>Confidence: {rec.confidence}%</span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onApply(rec)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Smart Scheduling Engine Component
const SmartSchedulingEngine = () => {
  const [isEngineActive, setIsEngineActive] = useState(true);
  const { getAIForecast, getWeatherImpact, getLaborAnalytics } = useLaborData();

  const handleToggleEngine = () => {
    setIsEngineActive(!isEngineActive);
  };

  const handleRefresh = () => {
    // Refresh AI data
    console.log('Refreshing AI analysis...');
  };

  const handleConfigure = () => {
    // Open configuration modal
    console.log('Opening AI configuration...');
  };

  const handleApplyRecommendation = (recommendation) => {
    console.log('Applying recommendation:', recommendation);
    // Implement recommendation application logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Smart Scheduling Assistant</h2>
        <p className="text-slate-600">Logic-based scheduling optimization and forecasting</p>
      </div>

      {/* Engine Status */}
      <EngineStatus
        isActive={isEngineActive}
        onToggle={handleToggleEngine}
        onRefresh={handleRefresh}
        onConfigure={handleConfigure}
      />

      {/* Performance Metrics */}
      <PerformanceMetrics />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <ForecastingDashboard />
          <WeatherImpact />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <HourlyDemand />
          <SmartRecommendations onApply={handleApplyRecommendation} />
        </div>
      </div>

      {/* Tips Card */}
      <Card className="border-blue-200 bg-blue-50">
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
