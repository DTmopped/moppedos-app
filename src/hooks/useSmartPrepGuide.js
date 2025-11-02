import { useState, useEffect, useCallback } from "react";
import { useData } from "@/contexts/DataContext.jsx";
import { v4 as uuidv4 } from "uuid";
import {
  SHIFTS_CONFIG,
  RESTAURANT_TEMPLATES,
  calculateSmartAdjustmentFactor,
  calculateWasteOptimizedQuantity,
  getCrossUtilizationSuggestions,
  OZ_PER_LB,
  SPEND_PER_GUEST,
  CAPTURE_RATE
} from "./SmartPrepGuideConfig";

export const useSmartPrepGuide = (restaurantType = 'bbq') => {
  const { forecastData, actualData } = useData();
  
  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [smartPrepData, setSmartPrepData] = useState([]);
  const [printDate, setPrintDate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(restaurantType);
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
  const [prepInsights, setPrepInsights] = useState([]);

  // Get current restaurant template
  const currentTemplate = RESTAURANT_TEMPLATES[selectedTemplate] || RESTAURANT_TEMPLATES.bbq;

  // Calculate guests for prep with smart logic
  const calculateGuestsForPrep = useCallback((forecastSales, smartFactor) => {
    const sales = typeof forecastSales === 'number' ? forecastSales : 0;
    const factor = typeof smartFactor === 'number' ? smartFactor : 1;

    if (CAPTURE_RATE && typeof CAPTURE_RATE === 'number' && CAPTURE_RATE > 0) {
      return sales * CAPTURE_RATE * factor;
    }
    if (SPEND_PER_GUEST && typeof SPEND_PER_GUEST === 'number' && SPEND_PER_GUEST > 0) {
      return (sales / SPEND_PER_GUEST) * factor;
    }
    return 0;
  }, []);

  // Parse prep item with smart enhancements
  const parseSmartPrepItem = useCallback((itemDefinition, shiftGuests, daysTillService = 0) => {
    const baseItem = {
      id: uuidv4(),
      name: itemDefinition.name || "Unknown Item",
      quantity: "",
      unit: "",
      assignedTo: "",
      completed: false,
      shelfLife: itemDefinition.shelfLife || 1,
      prepTime: itemDefinition.prepTime || 1,
      originalDefinition: itemDefinition
    };

    // Extract directives from name
    const perGuestOzMatch = baseItem.name.match(/\(perGuestOz=([\d.]+)\)/);
    const eachMatch = baseItem.name.match(/\(each=([\d.]+)\)/);

    let baseQuantity = 0;

    if (perGuestOzMatch && shiftGuests > 0) {
      const perGuestOz = parseFloat(perGuestOzMatch[1]);
      baseQuantity = (shiftGuests * perGuestOz) / OZ_PER_LB;
      baseItem.unit = "lbs";
    } else if (eachMatch && shiftGuests > 0) {
      const eachValue = parseFloat(eachMatch[1]);
      baseQuantity = Math.ceil(shiftGuests * eachValue);
      baseItem.unit = "each";
    }

    // Apply waste optimization if enabled
    if (wasteOptimization && baseQuantity > 0) {
      baseQuantity = calculateWasteOptimizedQuantity(
        baseQuantity, 
        itemDefinition.shelfLife, 
        itemDefinition.prepTime, 
        daysTillService
      );
    }

    baseItem.quantity = baseQuantity > 0 ? baseQuantity.toFixed(1) : "";
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

    // Clean name from directives
    baseItem.name = baseItem.name
      .replace(/\(perGuestOz=[\d.]+\)/g, '')
      .replace(/\(each=[\d.]+\)/g, '')
      .trim();

    return baseItem;
  }, [wasteOptimization]);

  // Generate smart prep data for a day
  const generateSmartPrepDataForDay = useCallback((dayForecast, smartFactorData) => {
    const dayData = {
      date: dayForecast?.date || "Unknown Date",
      totalGuests: calculateGuestsForPrep(dayForecast?.forecastSales, smartFactorData.factor),
      smartFactor: smartFactorData,
      shifts: {},
      insights: []
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

    // Calculate days until service
    const today = new Date();
    const serviceDate = new Date(dayData.date);
    const daysTillService = Math.max(0, Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24)));

    // Generate prep items for each shift
    Object.entries(SHIFTS_CONFIG).forEach(([shiftKey, shiftDetails]) => {
      const shiftGuests = dayData.totalGuests * (shiftDetails?.percentage || 0);
      const prepItems = [];

      // Process each category in the current template
      Object.entries(currentTemplate.prepCategories).forEach(([categoryName, categoryData]) => {
        categoryData.items.forEach(itemDefinition => {
          const parsedItem = parseSmartPrepItem(itemDefinition, shiftGuests, daysTillService);
          parsedItem.category = categoryName;
          parsedItem.categoryColor = categoryData.color;
          parsedItem.categoryIcon = categoryData.icon;
          prepItems.push(parsedItem);
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

      // Add cross-utilization suggestions if enabled
      if (crossUtilization) {
        const suggestions = getCrossUtilizationSuggestions(prepItems);
        dayData.insights.push(...suggestions);
      }

      dayData.shifts[shiftKey] = {
        name: shiftDetails?.name || "Unknown Shift",
        icon: shiftDetails?.icon || null,
        color: shiftDetails?.color || "",
        prepItems: prepItems,
        totalItems: prepItems.length,
        estimatedPrepTime: prepItems.reduce((total, item) => total + (item.originalDefinition.prepTime || 1), 0)
      };
    });

    // Add smart insights
    if (smartFactorData.insights) {
      Object.entries(smartFactorData.insights).forEach(([type, insight]) => {
        if (insight) {
          dayData.insights.push({
            type: type,
            message: insight,
            factor: smartFactorData.breakdown[type]
          });
        }
      
      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        totalGuests: totalGuests,
        smartFactor: smartFactor,
        shifts: shifts
      });
    }

    return dayData;
  }, [currentTemplate, calculateGuestsForPrep, parseSmartPrepItem, crossUtilization]);

  // Main effect to generate smart prep data
  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;
    if (!printDate) setPrintDate(forecastData[0].date);

    const newSmartPrepData = forecastData.map((dayForecast) => {
      const smartFactorData = calculateSmartAdjustmentFactor(
        dayForecast.date,
        actualData,
        forecastData,
        weatherCondition
      );

      return generateSmartPrepDataForDay(dayForecast, smartFactorData);
    });

    setSmartPrepData(newSmartPrepData);

    // Set overall adjustment factor (average of all days)
    const avgFactor = newSmartPrepData.reduce((sum, day) => sum + day.smartFactor.factor, 0) / newSmartPrepData.length;
    setAdjustmentFactor(avgFactor);

    // Collect all insights
    const allInsights = newSmartPrepData.flatMap(day => day.insights);
    setPrepInsights(allInsights);

  }, [forecastData, actualData, weatherCondition, selectedTemplate, wasteOptimization, crossUtilization, generateSmartPrepDataForDay]);

  // Handle prep task changes
  const handlePrepTaskChange = useCallback((date, shiftKey, itemId, field, value) => {
    setSmartPrepData((prev) =>
      prev.map((day) =>
        day.date === date
          ? {
              ...day,
              shifts: {
                ...day.shifts,
                [shiftKey]: {
                  ...day.shifts[shiftKey],
                  prepItems: day.shifts[shiftKey].prepItems.map((item) =>
                    item.id === itemId ? { ...item, [field]: value } : item
                  ),
                },
              },
            }
          : day
      )
    );
  }, []);
    return days;
  }, [selectedTemplate, weatherCondition, currentTemplate]);

  // Generate prep text for printing
  const generatePrepTextForDay = useCallback((dayData) => {
    let prepText = `📅 ${dayData.date} - Total Guests: ${dayData.totalGuests.toFixed(0)}\n`;
    prepText += `🎯 Smart Factor: ${dayData.smartFactor.factor.toFixed(2)}x\n\n`;

    // Add insights
    if (dayData.insights.length > 0) {
      prepText += "💡 Smart Insights:\n";
      dayData.insights.forEach(insight => {
        prepText += `   • ${insight.message}\n`;
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
      prepText += "\n";
    }

    // Add shift details
    Object.entries(dayData.shifts).forEach(([shiftKey, shiftData]) => {
      prepText += `${shiftData.name} (${(dayData.totalGuests * SHIFTS_CONFIG[shiftKey].percentage).toFixed(0)} guests):\n`;
      
      // Group by category
      const itemsByCategory = {};
      shiftData.prepItems.forEach(item => {
        if (!itemsByCategory[item.category]) {
          itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
      });

      Object.entries(itemsByCategory).forEach(([category, items]) => {
        prepText += `\n  ${category}:\n`;
        items.forEach(item => {
          const quantityText = item.quantity ? `${item.quantity} ${item.unit}` : "As needed";
          prepText += `    • ${item.name}: ${quantityText}\n`;
        });
    
    // Weather impact
    if (weatherCondition === 'rainy' || weatherCondition === 'stormy') {
      insights.push({
        type: 'Weather',
        message: 'Bad weather expected - increase comfort food prep by 20%.'
      });
      prepText += "\n";
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

    return prepText;
  }, []);
    return insights;
  }, [smartPrepData, weatherCondition]);

  // Export functions
  const exportPrepGuide = useCallback((format = 'text') => {
  // Export functionality
  const exportPrepGuide = (format = 'text') => {
    if (format === 'text') {
      let fullText = `${currentTemplate.name} - Smart Prep Guide\n`;
      fullText += `Generated: ${new Date().toLocaleDateString()}\n`;
      fullText += `Weather Condition: ${weatherCondition}\n`;
      fullText += `Waste Optimization: ${wasteOptimization ? 'Enabled' : 'Disabled'}\n`;
      fullText += `Cross-Utilization: ${crossUtilization ? 'Enabled' : 'Disabled'}\n\n`;
      let output = `Smart Prep Guide - ${currentTemplate.name}\n`;
      output += `Generated: ${new Date().toLocaleDateString()}\n`;
      output += `Weather: ${weatherCondition}\n\n`;

      smartPrepData.forEach(dayData => {
        fullText += generatePrepTextForDay(dayData);
        fullText += "\n" + "=".repeat(50) + "\n\n";
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

      return fullText;
      
      return output;
    }
    
    // Add other export formats (JSON, CSV) as needed
    return smartPrepData;
  }, [currentTemplate, smartPrepData, weatherCondition, wasteOptimization, crossUtilization, generatePrepTextForDay]);
  };

  return {
    // Data
    forecastData,
    smartPrepData,
    adjustmentFactor,
    printDate,
    prepInsights,
    
    // Settings
    // State
    selectedTemplate,
    setSelectedTemplate,
    weatherCondition,
@@ -283,20 +185,21 @@ export const useSmartPrepGuide = (restaurantType = 'bbq') => {
    setWasteOptimization,
    crossUtilization,
    setCrossUtilization,
    
    // Functions
    printDate,
    setPrintDate,
    handlePrepTaskChange,
    exportPrepGuide,
    generatePrepTextForDay,

    // Templates
    availableTemplates: Object.keys(RESTAURANT_TEMPLATES),
    // Data
    smartPrepData,
    prepInsights,
    currentTemplate,
    availableTemplates,
    
    // Calculated values
    adjustmentFactor: smartPrepData.length > 0 ? 
      smartPrepData.reduce((sum, day) => sum + day.smartFactor.factor, 0) / smartPrepData.length : 1.0,

    // UI State
    manageMenuOpen: false,
    setManageMenuOpen: () => {},
    menuLoading: false
    // Functions
    exportPrepGuide,
    handlePrepTaskChange: () => {} // Placeholder for future functionality
  };
};
