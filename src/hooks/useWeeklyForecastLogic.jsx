import { useState, useEffect, useCallback } from 'react';
import { useData } from "../contexts/DataContext.jsx";
import { useToast } from '../components/ui/use-toast.jsx';
import { getDayFromDate, DAY_ORDER, COST_PERCENTAGES } from "@/lib/dateUtils.js";
import { CheckCircle } from "lucide-react";

// Fallback defaults
const FALLBACK_CAPTURE_RATE = 8;
const FALLBACK_SPEND_PER_GUEST = 40;
const FALLBACK_AM_SPLIT = 60;

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

  // Admin settings with persistence
  const [captureRate, setCaptureRate] = useState(() => Number(localStorage.getItem("captureRate") || FALLBACK_CAPTURE_RATE));
  const [spendPerGuest, setSpendPerGuest] = useState(() => Number(localStorage.getItem("spendPerGuest") || FALLBACK_SPEND_PER_GUEST));
  const [amSplit, setAmSplit] = useState(() => Number(localStorage.getItem("amSplit") || FALLBACK_AM_SPLIT));
  const [adminMode, setAdminMode] = useState(() => localStorage.getItem("adminMode") === "true");

  // Save admin inputs to localStorage
  useEffect(() => { localStorage.setItem("captureRate", captureRate); }, [captureRate]);
  useEffect(() => { localStorage.setItem("spendPerGuest", spendPerGuest); }, [spendPerGuest]);
  useEffect(() => { localStorage.setItem("amSplit", amSplit); }, [amSplit]);
  useEffect(() => { localStorage.setItem("adminMode", adminMode); }, [adminMode]);

  const toggleAdminMode = () => setAdminMode((prev) => !prev);

  const generateForecast = useCallback(() => {
    setError("");
    setForecastDataUI([]);
    if (!inputText.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    const baseDate = extractBaseDateFromWeeklyInput(inputText, setError);
    if (!baseDate) return;

    const { results: parsedDayData, foundData } = parseWeeklyPassengerInput(inputText);
    if (!foundData) {
      setError("No valid day data found. Please check your input format (e.g., Monday: 15000).");
      return;
    }

    let totalTraffic = 0, totalGuests = 0, totalSales = 0, totalFood = 0, totalBev = 0, totalLabor = 0;
    const processedData = [];
    let entriesAddedToContext = 0;

    DAY_ORDER.forEach((dayName, index) => {
      if (parsedDayData[dayName] !== undefined) {
        const pax = parsedDayData[dayName];
        const guests = pax * (captureRate / 100);
        const sales = guests * spendPerGuest;
        const food = sales * COST_PERCENTAGES.food;
        const bev = sales * COST_PERCENTAGES.bev;
        const labor = sales * COST_PERCENTAGES.labor;
        const forecastDate = getDayFromDate(baseDate, index);

        processedData.push({ day: dayName, date: forecastDate, pax, guests, sales, food, bev, labor });
        addForecastEntry({ date: forecastDate, forecastSales: sales, forecastedFood: food, forecastedBev: bev, forecastedLabor: labor });
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

    setForecastDataUI(processedData);
    if (entriesAddedToContext > 0) {
      toast({
        title: "Weekly Forecast Parsed & Saved",
        description: `${entriesAddedToContext} forecast entries for week starting ${baseDate} added/updated.`,
        action: <CheckCircle className="text-green-500" />,
      });
    }
  }, [inputText, addForecastEntry, toast, captureRate, spendPerGuest]);

  return {
    inputText,
    setInputText,
    forecastDataUI,
    setForecastDataUI,
    error,
    setError,
    generateForecast,
    captureRate,
    setCaptureRate,
    spendPerGuest,
    setSpendPerGuest,
    amSplit,
    setAmSplit,
    adminMode,
    toggleAdminMode
  };
};
