import React, { useState, useCallback } from 'react';
import { useData } from "../contexts/DataContext.jsx";
import { useToast } from "components/ui/use-toast.jsx";
import { getDayFromDate, DAY_ORDER, COST_PERCENTAGES } from "@/lib/dateUtils.js";
import { CheckCircle } from "lucide-react";

const DEFAULT_CAPTURE_RATE = 0.08; 
const DEFAULT_SPEND_PER_GUEST = 15;

const parseWeeklyPassengerInput = (inputText) => {
  const dayRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*([0-9,]+)/gi;
  let match;
  const results = {};
  let foundData = false;

  while ((match = dayRegex.exec(inputText)) !== null) {
    const day = match[1];
    const passengers = parseInt(match[2].replace(/,/g, ''));
    if (!isNaN(passengers)) {
      results[day] = passengers;
      foundData = true;
    }
  }
  return { results, foundData };
};

const calculateWeeklyForecastMetrics = (parsedDayData, baseDate, addForecastEntryCallback) => {
  const processedData = [];
  let totalTraffic = 0, totalGuests = 0, totalSales = 0, totalFood = 0, totalBev = 0, totalLabor = 0;
  let entriesAddedToContext = 0;

  DAY_ORDER.forEach((dayName, index) => {
    if (parsedDayData[dayName] !== undefined) {
      const pax = parsedDayData[dayName];
      const guests = pax * DEFAULT_CAPTURE_RATE;
      const sales = guests * DEFAULT_SPEND_PER_GUEST;
      const food = sales * COST_PERCENTAGES.food;
      const bev = sales * COST_PERCENTAGES.bev;
      const labor = sales * COST_PERCENTAGES.labor;
      
      const forecastDate = getDayFromDate(baseDate, index);

      processedData.push({ day: dayName, date: forecastDate, pax, guests, sales, food, bev, labor });
      addForecastEntryCallback({ date: forecastDate, forecastSales: sales, forecastedFood: food, forecastedBev: bev, forecastedLabor: labor });
      entriesAddedToContext++;

      totalTraffic += pax;
      totalGuests += guests;
      totalSales += sales;
      totalFood += food;
      totalBev += bev;
      totalLabor += labor;
    }
  });

  if (processedData.length > 0) {
    processedData.push({
      day: "Total / Avg",
      pax: totalTraffic,
      guests: totalGuests,
      sales: totalSales,
      food: totalFood,
      bev: totalBev,
      labor: totalLabor,
      isTotal: true,
    });
  }
  return { processedData, entriesAddedToContext, baseDate };
};

const extractBaseDateFromWeeklyInput = (inputText, setErrorCallback) => {
  const lines = inputText.trim().split("\n");
  const dateLine = lines.find(line => /date:\s*([\d\-]+)/i.test(line));
  if (dateLine) {
    const dateMatch = dateLine.match(/date:\s*([\d\-]+)/i);
    if (dateMatch && dateMatch[1]) {
      const baseDate = dateMatch[1];
      const testDate = new Date(baseDate);
      if (isNaN(testDate.getTime())) {
        setErrorCallback("Invalid base date found in input. Please use YYYY-MM-DD format (e.g., Date: 2025-05-13 for Monday).");
        return null;
      }
      return baseDate;
    }
  }
  setErrorCallback("Base date line not found. Please include a line like 'Date: YYYY-MM-DD' (e.g., Date: 2025-05-13 for Monday).");
  return null;
};


export const useWeeklyForecastLogic = () => {
  const [inputText, setInputText] = useState("Date: 2025-05-13\nMonday: 15000\nTuesday: 16000\nWednesday: 15500\nThursday: 17000\nFriday: 19500\nSaturday: 18000\nSunday: 9000");
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState("");
  const { addForecastEntry } = useData();
  const { toast } = useToast();

  const generateForecast = useCallback(() => {
    setError("");
    setForecastDataUI([]);
    if (!inputText.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    const baseDate = extractBaseDateFromWeeklyInput(inputText, setError);
    if (!baseDate) return;

    try {
      const { results: parsedDayData, foundData } = parseWeeklyPassengerInput(inputText);
      
      if (!foundData) {
        setError("No valid day data found. Please check your input format (e.g., Monday: 15000).");
        return;
      }

      const { processedData, entriesAddedToContext, baseDate: forecastBaseDate } = calculateWeeklyForecastMetrics(parsedDayData, baseDate, addForecastEntry);
      
      if (processedData.length === 0) {
         setError("Could not parse any day data. Ensure days are correctly spelled and followed by a colon and number.");
         return;
      }

      setForecastDataUI(processedData);
      if (entriesAddedToContext > 0) {
        toast({
          title: "Weekly Forecast Parsed & Saved",
          description: `${entriesAddedToContext} forecast entries for week starting ${forecastBaseDate} added/updated.`,
          action: <CheckCircle className="text-green-500" />,
        });
      }
    } catch (e) {
      console.error("Parsing error:", e);
      setError("An error occurred while parsing the data. Please check the console for details and ensure the input format is correct.");
    }
  }, [inputText, addForecastEntry, toast]);

  return {
    inputText,
    setInputText,
    forecastDataUI,
    error,
    generateForecast,
    setError
  };
};
