import { useState, useEffect, useMemo } from 'react';
import { 
  RESTAURANT_TEMPLATES, 
  WEEKDAY_MULTIPLIERS, 
  SEASONAL_MULTIPLIERS,
  WEATHER_MULTIPLIERS,
  HOLIDAY_MULTIPLIERS,
  SHIFTS_CONFIG 
} from '@/config/SmartPrepGuideConfig.js';

export const useSmartPrepGuide = () => {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState('bbq');
  const [weatherCondition, setWeatherCondition] = useState('sunny');
  const [wasteOptimization, setWasteOptimization] = useState(true);
  const [crossUtilization, setCrossUtilization] = useState(true);
  const [forecastData, setForecastData] = useState([]);
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);

  // Get current template
  const currentTemplate = RESTAURANT_TEMPLATES[selectedTemplate];
  const availableTemplates = Object.keys(RESTAURANT_TEMPLATES);

  // Calculate smart adjustment factor
  const calculateSmartFactor = (date) => {
    const dateObj = new Date(date);
    const weekday = dateObj.getDay();
    const month = dateObj.getMonth();
    const dateString = date;

    // Base multipliers
    let factor = 1.0;
    
    // Weekday adjustment
    factor *= WEEKDAY_MULTIPLIERS[weekday] || 1.0;
    
    // Seasonal adjustment
    const season = month >= 5 && month <= 7 ? 'summer' : 
                   month >= 8 && month <= 10 ? 'fall' :
                   month >= 11 || month <= 1 ? 'winter' : 'spring';
    factor *= SEASONAL_MULTIPLIERS[season] || 1.0;
    
    // Weather adjustment
    factor *= WEATHER_MULTIPLIERS[weatherCondition] || 1.0;
    
    // Holiday adjustment
    factor *= HOLIDAY_MULTIPLIERS[dateString] || 1.0;

    return {
      factor: factor,
      reasons: [
        `${Object.keys(WEEKDAY_MULTIPLIERS)[weekday]} factor: ${WEEKDAY_MULTIPLIERS[weekday]}x`,
        `${season} season: ${SEASONAL_MULTIPLIERS[season]}x`,
        `${weatherCondition} weather: ${WEATHER_MULTIPLIERS[weatherCondition]}x`
      ]
    };
  };

  // Generate prep data for next 7 days
  const smartPrepData = useMemo(() => {
    const days = [];
    const baseGuests = 150; // Default base guest count
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const smartFactor = calculateSmartFactor(dateString);
      const totalGuests = Math.round(baseGuests * smartFactor.factor);
      
      // Generate shift data
      const shifts = {};
      Object.entries(SHIFTS_CONFIG).forEach(([shiftKey, shiftConfig]) => {
        const shiftGuests = Math.round(totalGuests * shiftConfig.percentage);
        const prepItems = [];
        
        // Generate prep items for each category
        Object.entries(currentTemplate.categories).forEach(([categoryName, category]) => {
          category.items.forEach(item => {
            const adjustedQuantity = Math.round(item.baseQuantity * smartFactor.factor * shiftConfig.percentage);
            if (adjustedQuantity > 0) {
              prepItems.push({
                id: `${item.name}-${shiftKey}`,
                name: item.name,
                category: categoryName,
                categoryIcon: category.icon,
                quantity: adjustedQuantity,
                unit: item.unit,
                prepTime: item.prepTime * shiftConfig.percentage,
                priority: adjustedQuantity > item.baseQuantity ? 'high' : 'normal'
              });
            }
          });
        });
        
        shifts[shiftKey] = {
          ...shiftConfig,
          guests: shiftGuests,
          prepItems: prepItems,
          totalItems: prepItems.length,
          estimatedPrepTime: prepItems.reduce((sum, item) => sum + item.prepTime, 0)
        };
      });
      
      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        totalGuests: totalGuests,
        smartFactor: smartFactor,
        shifts: shifts
      });
    }
    
    return days;
  }, [selectedTemplate, weatherCondition, currentTemplate]);

  // Calculate insights
  const prepInsights = useMemo(() => {
    const insights = [];
    
    // High volume days
    const highVolumeDays = smartPrepData.filter(day => day.smartFactor.factor > 1.2);
    if (highVolumeDays.length > 0) {
      insights.push({
        type: 'High Volume',
        message: `${highVolumeDays.length} high-volume days detected. Consider extra prep staff.`
      });
    }
    
    // Weather impact
    if (weatherCondition === 'rainy' || weatherCondition === 'stormy') {
      insights.push({
        type: 'Weather',
        message: 'Bad weather expected - increase comfort food prep by 20%.'
      });
    }
    
    // Weekend prep
    const weekendDays = smartPrepData.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
    });
    if (weekendDays.length > 0) {
      insights.push({
        type: 'Weekend',
        message: 'Weekend prep requires 30% more popular items.'
      });
    }

    return insights;
  }, [smartPrepData, weatherCondition]);

  // Export functionality
  const exportPrepGuide = (format = 'text') => {
    if (format === 'text') {
      let output = `Smart Prep Guide - ${currentTemplate.name}\n`;
      output += `Generated: ${new Date().toLocaleDateString()}\n`;
      output += `Weather: ${weatherCondition}\n\n`;
      
      smartPrepData.forEach(day => {
        output += `\n=== ${day.dayName} (${day.date}) ===\n`;
        output += `Guests: ${day.totalGuests} | Factor: ${day.smartFactor.factor.toFixed(2)}x\n\n`;
        
        Object.entries(day.shifts).forEach(([shiftKey, shift]) => {
          output += `${shift.name} (${shift.hours}):\n`;
          shift.prepItems.forEach(item => {
            output += `  - ${item.name}: ${item.quantity} ${item.unit}\n`;
          });
          output += `\n`;
        });
      });
      
      return output;
    }
  };

  return {
    // State
    selectedTemplate,
    setSelectedTemplate,
    weatherCondition,
    setWeatherCondition,
    wasteOptimization,
    setWasteOptimization,
    crossUtilization,
    setCrossUtilization,
    printDate,
    setPrintDate,
    
    // Data
    smartPrepData,
    prepInsights,
    currentTemplate,
    availableTemplates,
    
    // Calculated values
    adjustmentFactor: smartPrepData.length > 0 ? 
      smartPrepData.reduce((sum, day) => sum + day.smartFactor.factor, 0) / smartPrepData.length : 1.0,
    
    // Functions
    exportPrepGuide,
    handlePrepTaskChange: () => {} // Placeholder for future functionality
  };
};
