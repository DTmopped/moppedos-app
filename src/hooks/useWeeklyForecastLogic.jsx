import { useState, useEffect, useCallback } from 'react';
import { useData } from "../contexts/DataContext.jsx";
import { useToast } from '../components/ui/use-toast.jsx';
import { getDayFromDate, DAY_ORDER } from "@/lib/dateUtils.js";
import { CheckCircle } from "lucide-react";

const getCostPercentages = () => ({
  food: Number(localStorage.getItem("foodCostGoal") || 0.3),
  bev: Number(localStorage.getItem("bevCostGoal") || 0.2),
  labor: Number(localStorage.getItem("laborCostGoal") || 0.14)
});

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
        setErrorCallback("Invalid base date found. Use YYYY-MM-DD format.");
        return null;
      }
      return baseDate;
    }
  }
  setErrorCallback("Missing date line. Use 'Date: YYYY-MM-DD'.");
  return null;
};

export const useWeeklyForecastLogic = () => {
  const [inputText, setInputText] = useState(() => {
  return localStorage.getItem("weeklyForecastInput") ||
    "Date: 06-23-2025\nMonday: 15000\nTuesday: 16000\nWednesday: 15500\nThursday: 17000\nFriday: 19500\nSaturday: 18000\nSunday: 9000";
});
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState("");
  const { addForecastEntry } = useData();
  const { toast } = useToast();

  const [captureRate, setCaptureRate] = useState(() =>
    Number(localStorage.getItem("captureRate") || 8)
  );
  const [spendPerGuest, setSpendPerGuest] = useState(() =>
    Number(localStorage.getItem("spendPerGuest") || 40)
  );
  const [amSplit, setAmSplit] = useState(() =>
    Number(localStorage.getItem("amSplit") || 60)
  );
  const [adminMode, setAdminMode] = useState(() =>
    localStorage.getItem("adminMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("captureRate", captureRate);
  }, [captureRate]);

  useEffect(() => {
    localStorage.setItem("spendPerGuest", spendPerGuest);
  }, [spendPerGuest]);

  useEffect(() => {
    localStorage.setItem("amSplit", amSplit);
  }, [amSplit]);

  useEffect(() => {
    localStorage.setItem("adminMode", adminMode);
  }, [adminMode]);

  const toggleAdminMode = () => {
  setAdminMode(prev => {
    const newValue = !prev;
    localStorage.setItem("adminMode", newValue);
    return newValue;
  });
};

  const generateForecast = useCallback(() => {
    setError("");
    setForecastDataUI([]);

  const processedData = [];
  let totalTraffic = 0, totalGuests = 0, totalSales = 0, totalFood = 0, totalBev = 0, totalLabor = 0;
  let entriesAddedToContext = 0;
    
  if (!inputText.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    const baseDateStr = extractBaseDateFromWeeklyInput(inputText, setError);
if (!baseDateStr) return;

    const { food: foodPct, bev: bevPct, labor: laborPct } = getCostPercentages();
    const { results: parsedDayData, foundData } = parseWeeklyPassengerInput(inputText);

    if (!foundData) {
      setError("No valid day data found. Check formatting.");
      return;
    }

  const monday = new Date(baseDateStr);
    
DAY_ORDER.forEach((dayName, index) => {
  if (parsedDayData[dayName] !== undefined) {
    const pax = parsedDayData[dayName];
    const guests = pax * (captureRate / 100);
    const amGuests = Math.round(guests * (amSplit / 100));
    const pmGuests = Math.round(guests - amGuests);
    const sales = guests * spendPerGuest;
    const food = sales * foodPct;
    const bev = sales * bevPct;
    const labor = sales * laborPct;

    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + index);
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const forecastDate = `${yyyy}-${mm}-${dd}`;
        processedData.push({
          day: dayName,
          date: forecastDate,
          pax,
          guests,
          amGuests,
          pmGuests,
          sales,
          food,
          bev,
          labor
        });

        addForecastEntry({
          date: forecastDate,
          forecastSales: sales,
          forecastedFood: food,
          forecastedBev: bev,
          forecastedLabor: labor,
          guests,
          amGuests,
          pmGuests
        });

        totalTraffic += pax;
        totalGuests += guests;
        totalSales += sales;
        totalFood += food;
        totalBev += bev;
        totalLabor += labor;
        entriesAddedToContext++;
      }
    });

    if (processedData.length > 0) {
      processedData.push({
        day: "Total / Avg",
        pax: totalTraffic,
        guests: totalGuests,
        amGuests: "-",
        pmGuests: "-",
        sales: totalSales,
        food: totalFood,
        bev: totalBev,
        labor: totalLabor,
        isTotal: true
      });
    }

    setForecastDataUI(processedData);
    if (entriesAddedToContext > 0) {
      toast({
        title: "Weekly Forecast Parsed & Saved",
        description: `${entriesAddedToContext} entries added for week starting ${baseDate}.`,
        action: <CheckCircle className="text-green-500" />,
      });
    }
  }, [inputText, addForecastEntry, toast, captureRate, spendPerGuest, amSplit]);

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

