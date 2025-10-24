import React from 'react';
import { Sunrise, Sunset, Cloud, Sun, CloudRain } from 'lucide-react';

// Base configuration
export const OZ_PER_LB = 16;
export const SPEND_PER_GUEST = 15; 
export const CAPTURE_RATE = 0.15; 

// Enhanced shift configuration with smart timing
export const SHIFTS_CONFIG = {
  AM: { 
    name: 'AM Shift', 
    percentage: 0.6, 
    icon: <Sunrise size={20} className="mr-2 text-yellow-400 no-print" />, 
    color: "text-yellow-400",
    prepStartTime: "06:00",
    serviceStart: "11:00",
    prepWindow: 5 // hours before service
  },
  PM: { 
    name: 'PM Shift', 
    percentage: 0.4, 
    icon: <Sunset size={20} className="mr-2 text-orange-400 no-print" />, 
    color: "text-orange-400",
    prepStartTime: "14:00", 
    serviceStart: "17:00",
    prepWindow: 3 // hours before service
  }
};

// Weekday flow patterns (multipliers based on day of week)
export const WEEKDAY_PATTERNS = {
  monday: { multiplier: 0.7, description: "Slower start to week" },
  tuesday: { multiplier: 0.8, description: "Building momentum" },
  wednesday: { multiplier: 0.9, description: "Mid-week steady" },
  thursday: { multiplier: 1.0, description: "Normal flow" },
  friday: { multiplier: 1.3, description: "Weekend rush begins" },
  saturday: { multiplier: 1.4, description: "Peak weekend" },
  sunday: { multiplier: 1.1, description: "Family dining day" }
};

// Seasonal adjustments (multipliers by month)
export const SEASONAL_PATTERNS = {
  january: { multiplier: 0.8, description: "Post-holiday slowdown" },
  february: { multiplier: 0.9, description: "Winter dining" },
  march: { multiplier: 1.0, description: "Spring pickup" },
  april: { multiplier: 1.1, description: "Spring growth" },
  may: { multiplier: 1.2, description: "Spring peak" },
  june: { multiplier: 1.3, description: "Summer begins" },
  july: { multiplier: 1.4, description: "Summer peak" },
  august: { multiplier: 1.3, description: "Late summer" },
  september: { multiplier: 1.1, description: "Back to school" },
  october: { multiplier: 1.2, description: "Fall dining" },
  november: { multiplier: 1.3, description: "Holiday season" },
  december: { multiplier: 1.1, description: "Holiday parties" }
};

// Holiday adjustments (specific dates with multipliers)
export const HOLIDAY_PATTERNS = {
  "01-01": { multiplier: 0.5, name: "New Year's Day" },
  "02-14": { multiplier: 1.5, name: "Valentine's Day" },
  "03-17": { multiplier: 1.3, name: "St. Patrick's Day" },
  "05-12": { multiplier: 1.4, name: "Mother's Day" }, // Second Sunday in May
  "06-16": { multiplier: 1.2, name: "Father's Day" }, // Third Sunday in June
  "07-04": { multiplier: 1.6, name: "Independence Day" },
  "10-31": { multiplier: 1.2, name: "Halloween" },
  "11-28": { multiplier: 2.0, name: "Thanksgiving" }, // Fourth Thursday in November
  "12-24": { multiplier: 0.7, name: "Christmas Eve" },
  "12-25": { multiplier: 0.3, name: "Christmas Day" },
  "12-31": { multiplier: 1.8, name: "New Year's Eve" }
};

// Weather impact patterns
export const WEATHER_PATTERNS = {
  sunny: { multiplier: 1.0, icon: <Sun className="w-4 h-4" />, description: "Perfect weather" },
  cloudy: { multiplier: 1.1, icon: <Cloud className="w-4 h-4" />, description: "More indoor dining" },
  rainy: { multiplier: 1.2, icon: <CloudRain className="w-4 h-4" />, description: "Comfort food weather" },
  stormy: { multiplier: 0.8, icon: <CloudRain className="w-4 h-4" />, description: "People stay home" }
};

// Restaurant type templates
export const RESTAURANT_TEMPLATES = {
  bbq: {
    name: "BBQ Restaurant",
    description: "Traditional BBQ with smoked meats and classic sides",
    prepCategories: {
      "Smoked Meats": {
        color: "from-red-400 to-orange-500",
        icon: "🔥",
        items: [
          { name: "Pulled Pork (perGuestOz=6)", shelfLife: 3, prepTime: 12 },
          { name: "Sliced Brisket (perGuestOz=4)", shelfLife: 2, prepTime: 14 },
          { name: "Chopped Chicken (perGuestOz=6)", shelfLife: 2, prepTime: 4 },
          { name: "St Louis Ribs (perGuestOz=16)", shelfLife: 2, prepTime: 6 },
          { name: "Beef Short Rib (perGuestOz=16)", shelfLife: 2, prepTime: 8 }
        ]
      },
      "Sandwich Fillings": {
        color: "from-yellow-400 to-orange-500",
        icon: "🥪",
        items: [
          { name: "Pulled Pork for Sammies (perGuestOz=6)", shelfLife: 3, prepTime: 1 },
          { name: "Chopped Brisket for Sammies (perGuestOz=6)", shelfLife: 2, prepTime: 1 },
          { name: "Chopped Chicken for Sammies (perGuestOz=6)", shelfLife: 2, prepTime: 1 }
        ]
      },
      "Classic Sides": {
        color: "from-green-400 to-lime-500",
        icon: "🥗",
        items: [
          { name: "Coleslaw (perGuestOz=4)", shelfLife: 2, prepTime: 1 },
          { name: "Mac N Cheese (perGuestOz=4)", shelfLife: 1, prepTime: 2 },
          { name: "Baked Beans (perGuestOz=4)", shelfLife: 3, prepTime: 3 },
          { name: "Collard Greens (perGuestOz=4)", shelfLife: 2, prepTime: 2 },
          { name: "Corn Casserole (perGuestOz=4)", shelfLife: 1, prepTime: 1 }
        ]
      },
      "Breads & Starches": {
        color: "from-amber-400 to-yellow-500",
        icon: "🍞",
        items: [
          { name: "Buns (each=3)", shelfLife: 1, prepTime: 0.5 },
          { name: "Texas Toast (each=1)", shelfLife: 1, prepTime: 0.5 },
          { name: "Corn Muffins (each=1)", shelfLife: 1, prepTime: 1 },
          { name: "Honey Butter (each=1)", shelfLife: 3, prepTime: 0.5 }
        ]
      },
      "Desserts": {
        color: "from-pink-400 to-purple-500",
        icon: "🍰",
        items: [
          { name: "Banana Pudding (each=0.8)", shelfLife: 2, prepTime: 2 },
          { name: "Key Lime Pie (each=0.6)", shelfLife: 3, prepTime: 3 },
          { name: "Hummingbird Cake (each=0.4)", shelfLife: 2, prepTime: 4 }
        ]
      }
    }
  },
  
  italian: {
    name: "Italian Restaurant",
    description: "Traditional Italian with fresh pasta and classic dishes",
    prepCategories: {
      "Fresh Pasta": {
        color: "from-yellow-400 to-orange-500",
        icon: "🍝",
        items: [
          { name: "Fettuccine (perGuestOz=4)", shelfLife: 1, prepTime: 2 },
          { name: "Penne (perGuestOz=4)", shelfLife: 1, prepTime: 2 },
          { name: "Ravioli (each=8)", shelfLife: 1, prepTime: 3 },
          { name: "Gnocchi (perGuestOz=5)", shelfLife: 1, prepTime: 4 }
        ]
      },
      "Sauces": {
        color: "from-red-400 to-pink-500",
        icon: "🍅",
        items: [
          { name: "Marinara Sauce (perGuestOz=3)", shelfLife: 3, prepTime: 2 },
          { name: "Alfredo Sauce (perGuestOz=2)", shelfLife: 1, prepTime: 1 },
          { name: "Pesto (perGuestOz=1)", shelfLife: 2, prepTime: 1 },
          { name: "Bolognese (perGuestOz=4)", shelfLife: 2, prepTime: 4 }
        ]
      },
      "Proteins": {
        color: "from-purple-400 to-indigo-500",
        icon: "🥩",
        items: [
          { name: "Chicken Parmigiana (perGuestOz=8)", shelfLife: 1, prepTime: 2 },
          { name: "Veal Scallopini (perGuestOz=6)", shelfLife: 1, prepTime: 1 },
          { name: "Italian Sausage (perGuestOz=4)", shelfLife: 2, prepTime: 1 }
        ]
      },
      "Appetizers": {
        color: "from-green-400 to-teal-500",
        icon: "🧄",
        items: [
          { name: "Garlic Bread (each=2)", shelfLife: 1, prepTime: 0.5 },
          { name: "Bruschetta Mix (perGuestOz=2)", shelfLife: 1, prepTime: 1 },
          { name: "Antipasto Prep (perGuestOz=3)", shelfLife: 2, prepTime: 1 }
        ]
      }
    }
  },

  fastCasual: {
    name: "Fast Casual",
    description: "Quick service with fresh, customizable options",
    prepCategories: {
      "Proteins": {
        color: "from-red-400 to-orange-500",
        icon: "🥩",
        items: [
          { name: "Grilled Chicken (perGuestOz=4)", shelfLife: 1, prepTime: 1 },
          { name: "Ground Beef (perGuestOz=3)", shelfLife: 1, prepTime: 1 },
          { name: "Carnitas (perGuestOz=4)", shelfLife: 2, prepTime: 3 },
          { name: "Tofu (perGuestOz=3)", shelfLife: 2, prepTime: 1 }
        ]
      },
      "Fresh Prep": {
        color: "from-green-400 to-lime-500",
        icon: "🥬",
        items: [
          { name: "Lettuce Prep (perGuestOz=2)", shelfLife: 1, prepTime: 0.5 },
          { name: "Tomato Dice (perGuestOz=1)", shelfLife: 1, prepTime: 0.5 },
          { name: "Onion Prep (perGuestOz=0.5)", shelfLife: 2, prepTime: 0.5 },
          { name: "Cilantro Prep (perGuestOz=0.25)", shelfLife: 1, prepTime: 0.25 }
        ]
      },
      "Salsas & Sauces": {
        color: "from-yellow-400 to-red-500",
        icon: "🌶️",
        items: [
          { name: "Mild Salsa (perGuestOz=1)", shelfLife: 2, prepTime: 1 },
          { name: "Hot Salsa (perGuestOz=0.5)", shelfLife: 2, prepTime: 1 },
          { name: "Guacamole (perGuestOz=1)", shelfLife: 1, prepTime: 1 },
          { name: "Sour Cream Prep (perGuestOz=0.5)", shelfLife: 3, prepTime: 0.25 }
        ]
      }
    }
  },

  fineDining: {
    name: "Fine Dining",
    description: "Upscale restaurant with complex preparations",
    prepCategories: {
      "Stocks & Bases": {
        color: "from-amber-400 to-orange-500",
        icon: "🍲",
        items: [
          { name: "Demi-Glace (perGuestOz=1)", shelfLife: 5, prepTime: 8 },
          { name: "Vegetable Stock (perGuestOz=2)", shelfLife: 3, prepTime: 4 },
          { name: "Fish Fumet (perGuestOz=1)", shelfLife: 1, prepTime: 3 }
        ]
      },
      "Proteins": {
        color: "from-red-400 to-purple-500",
        icon: "🥩",
        items: [
          { name: "Duck Confit (perGuestOz=6)", shelfLife: 3, prepTime: 6 },
          { name: "Beef Tenderloin Prep (perGuestOz=8)", shelfLife: 1, prepTime: 2 },
          { name: "Fresh Fish Prep (perGuestOz=6)", shelfLife: 1, prepTime: 1 }
        ]
      },
      "Garnishes": {
        color: "from-green-400 to-teal-500",
        icon: "🌿",
        items: [
          { name: "Microgreens (perGuestOz=0.1)", shelfLife: 1, prepTime: 0.5 },
          { name: "Herb Oil (perGuestOz=0.25)", shelfLife: 2, prepTime: 1 },
          { name: "Pickled Vegetables (perGuestOz=0.5)", shelfLife: 7, prepTime: 2 }
        ]
      }
    }
  }
};

// Smart calculation functions
export const calculateSmartAdjustmentFactor = (date, actualData, forecastData, weatherCondition = 'sunny') => {
  let baseFactor = 1.0;
  
  // Historical performance adjustment
  if (actualData && forecastData && actualData.length > 0 && forecastData.length > 0) {
    let totalForecast = 0;
    let totalActual = 0;
    
    actualData.forEach(actual => {
      const forecast = forecastData.find(f => f.date === actual.date);
      if (forecast && forecast.forecastSales > 0 && actual.actualSales > 0) {
        totalForecast += forecast.forecastSales;
        totalActual += actual.actualSales;
      }
    });
    
    if (totalForecast > 0) {
      baseFactor = totalActual / totalForecast;
      baseFactor = Math.max(0.5, Math.min(baseFactor, 1.5)); // Cap between 50% and 150%
    }
  }
  
  // Weekday adjustment
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const weekdayMultiplier = WEEKDAY_PATTERNS[dayOfWeek]?.multiplier || 1.0;
  
  // Seasonal adjustment
  const month = new Date(date).toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const seasonalMultiplier = SEASONAL_PATTERNS[month]?.multiplier || 1.0;
  
  // Holiday adjustment
  const dateKey = new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  const holidayMultiplier = HOLIDAY_PATTERNS[dateKey]?.multiplier || 1.0;
  
  // Weather adjustment
  const weatherMultiplier = WEATHER_PATTERNS[weatherCondition]?.multiplier || 1.0;
  
  // Combine all factors
  const smartFactor = baseFactor * weekdayMultiplier * seasonalMultiplier * holidayMultiplier * weatherMultiplier;
  
  return {
    factor: Math.max(0.3, Math.min(smartFactor, 2.5)), // Cap between 30% and 250%
    breakdown: {
      historical: baseFactor,
      weekday: weekdayMultiplier,
      seasonal: seasonalMultiplier,
      holiday: holidayMultiplier,
      weather: weatherMultiplier
    },
    insights: {
      weekday: WEEKDAY_PATTERNS[dayOfWeek]?.description,
      seasonal: SEASONAL_PATTERNS[month]?.description,
      holiday: HOLIDAY_PATTERNS[dateKey]?.name,
      weather: WEATHER_PATTERNS[weatherCondition]?.description
    }
  };
};

// Waste optimization function
export const calculateWasteOptimizedQuantity = (baseQuantity, shelfLife, prepTime, daysTillService) => {
  // Reduce quantity if shelf life is shorter than time till service
  if (shelfLife < daysTillService) {
    return baseQuantity * 0.7; // Reduce by 30% to minimize waste
  }
  
  // Increase slightly if prep time is very short (can make fresh)
  if (prepTime < 1) {
    return baseQuantity * 0.9; // Reduce by 10% since we can make fresh quickly
  }
  
  return baseQuantity;
};

// Cross-utilization suggestions
export const getCrossUtilizationSuggestions = (prepItems) => {
  const suggestions = [];
  
  // Example cross-utilization logic
  const hasOnions = prepItems.some(item => item.name.toLowerCase().includes('onion'));
  const hasTomatoes = prepItems.some(item => item.name.toLowerCase().includes('tomato'));
  
  if (hasOnions && hasTomatoes) {
    suggestions.push({
      type: "cross-utilization",
      message: "Consider prepping extra onions and tomatoes for salsa or garnish",
      items: ["onions", "tomatoes"]
    });
  }
  
  return suggestions;
};

export const PREP_GUIDE_ICON_COLORS = {
  fullWeekly: "from-purple-400 to-indigo-500",
  dailyShift: "from-green-400 to-lime-500",
  smart: "from-blue-400 to-cyan-500"
};
