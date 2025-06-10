import React from 'react';
import { SPEND_PER_GUEST, OZ_PER_LB, SHIFTS_CONFIG, CAPTURE_RATE } from '@/config/prepGuideConfig';

export const calculateAdjustmentFactorUtil = (actualData, forecastData) => {
  if (!actualData || actualData.length === 0 || !forecastData || forecastData.length === 0) return 1;
  
  let totalForecast = 0;
  let totalActual = 0;
  
  actualData.forEach(actual => {
    const forecast = forecastData.find(f => f.date === actual.date);
    if (forecast && typeof forecast.forecastSales === 'number' && forecast.forecastSales > 0 && typeof actual.actualSales === 'number' && actual.actualSales > 0) {
      totalForecast += forecast.forecastSales;
      totalActual += actual.actualSales;
    }
  });

  if (totalForecast === 0) return 1; 
  const trend = totalActual / totalForecast;
  return Math.max(0.5, Math.min(trend, 1.5)); 
};

const calculateGuestsForPrep = (forecastSales, adjFactor) => {
  const sales = typeof forecastSales === 'number' ? forecastSales : 0;
  const factor = typeof adjFactor === 'number' ? adjFactor : 1;

  if (CAPTURE_RATE && typeof CAPTURE_RATE === 'number' && CAPTURE_RATE > 0) {
    return sales * CAPTURE_RATE * factor;
  }
  if (SPEND_PER_GUEST && typeof SPEND_PER_GUEST === 'number' && SPEND_PER_GUEST > 0) {
    return (sales / SPEND_PER_GUEST) * factor;
  }
  return 0; 
};

export const generateFullWeeklyPrepTextForSection = (sectionItems, forecastData, adjFactor) => {
  let sectionText = "";
  if (!forecastData || forecastData.length === 0) {
    return "No forecast data available to generate prep guide.";
  }

  forecastData.forEach(day => {
    const guests = calculateGuestsForPrep(day.forecastSales, adjFactor);
    sectionText += `🗓️ ${day.date} (Guests: ${guests.toFixed(0)}, Adj x${(typeof adjFactor === 'number' ? adjFactor : 1).toFixed(2)}):\n`;
    sectionItems.forEach(item => {
      if (item.perGuestOz) {
        const lbs = (guests * item.perGuestOz) / OZ_PER_LB;
        sectionText += `  - ${item.name}: ${lbs.toFixed(1)} lbs\n`;
      } else if (item.each) {
        const count = Math.ceil(guests * item.each);
        sectionText += `  - ${item.name}: ${count} each\n`;
      } else {
        sectionText += `  - ${item.name}\n`;
      }
    });
    sectionText += `\n`;
  });
  return sectionText.trim();
};

const extractDirectiveValue = (name, directive) => {
  if (typeof name !== 'string') return null;
  const regex = new RegExp(`\\(${directive}=([\\d.]+)\\)`, 'i');
  const match = name.match(regex);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? null : value;
  }
  return null;
};

const cleanNameFromDirectives = (name) => {
  if (typeof name !== 'string') return "";
  return name
    .replace(/\(perGuestOz=[\d.]+\)/gi, '')
    .replace(/\(each=[\d.]+\)/gi, '')
    .replace(/\(perGuestEach=[\d.]+\)/gi, '') 
    .replace(/^- /, '')
    .trim();
};

export const parsePrepItemString = (itemString, shiftGuestsInput) => {
  const baseItem = {
    id: crypto.randomUUID(),
    name: typeof itemString === 'string' ? itemString : "Invalid Item",
    quantity: "",
    unit: "",
    assignedTo: "",
    completed: false,
    originalString: typeof itemString === 'string' ? itemString : "",
  };

  const shiftGuests = typeof shiftGuestsInput === 'number' && shiftGuestsInput > 0 ? shiftGuestsInput : 0;

  let processedName = baseItem.originalString;
  
  const perGuestOz = extractDirectiveValue(processedName, "perGuestOz");
  const eachVal = extractDirectiveValue(processedName, "each") || extractDirectiveValue(processedName, "perGuestEach");

  if (perGuestOz !== null && shiftGuests > 0) {
    const lbs = (shiftGuests * perGuestOz) / OZ_PER_LB;
    baseItem.quantity = lbs.toFixed(1);
    baseItem.unit = "lbs";
  } else if (eachVal !== null && shiftGuests > 0) {
    const count = Math.ceil(shiftGuests * eachVal);
    baseItem.quantity = count.toString();
    baseItem.unit = "each";
  }

  baseItem.name = cleanNameFromDirectives(processedName);

  if (baseItem.quantity === "" && baseItem.name.includes(':')) {
    const parts = baseItem.name.split(':', 2);
    baseItem.name = parts[0].trim();
    if (parts.length > 1) {
      const details = parts[1].trim();
      if (details) { 
        baseItem.quantity = details; 
        baseItem.unit = ""; 
      }
    }
  }
  
  if (!baseItem.name) {
    baseItem.name = "Unnamed Task";
  }

  return baseItem;
};

export const generateDailyShiftPrepDataForDay = (dayForecast, adjFactor, menuConfig, storedPrepTasks = {}) => {
  const dayData = {
    date: dayForecast?.date || "Unknown Date",
    totalGuests: calculateGuestsForPrep(dayForecast?.forecastSales, adjFactor),
    shifts: {}
  };

  Object.entries(SHIFTS_CONFIG).forEach(([shiftKey, shiftDetails]) => {
    const shiftGuests = dayData.totalGuests * (shiftDetails?.percentage || 0);
    const prepItems = [];
    
    if (menuConfig && typeof menuConfig === 'object') {
      Object.entries(menuConfig).forEach(([section, items]) => {
        if (Array.isArray(items)) {
          items.forEach(itemDefinition => {
            if (itemDefinition && typeof itemDefinition.name === 'string') {
              const parsedItem = parsePrepItemString(itemDefinition.name, shiftGuests);
              
              const storedTaskKey = `${dayData.date}-${shiftKey}-${parsedItem.id}`;
              const storedTask = storedPrepTasks && typeof storedPrepTasks === 'object' ? storedPrepTasks[storedTaskKey] : undefined;

              prepItems.push({
                ...parsedItem,
                section: section,
                assignedTo: storedTask?.assignedTo || "",
                completed: storedTask?.completed || false,
              });
            }
          });
        }
      });
    }

    dayData.shifts[shiftKey] = {
      name: shiftDetails?.name || "Unknown Shift",
      icon: shiftDetails?.icon || null,
      color: shiftDetails?.color || "",
      prepItems: prepItems, 
    };
  });
  return dayData;
};