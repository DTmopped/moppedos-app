import { useState, useEffect, useCallback } from 'react';
import { useData } from "../contexts/DataContext.jsx";
import { useToast } from '../components/ui/use-toast.jsx';
import { getDayFromDate, extractBaseDateFromWeeklyInput, DAY_ORDER } from "@/lib/dateUtils.js";
import { CheckCircle } from "lucide-react";

const getCostPercentages = () => ({
  food: Number(localStorage.getItem("foodCostGoal") || 0.3),
  bev: Number(localStorage.getItem("bevCostGoal") || 0.2),
  labor: Number(localStorage.getItem("laborCostGoal") || 0.14)
});

const parseWeeklyPassengerInput = (inputText) => {
  const dayRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*([0-9,]+)/gi;
  const results = {};
  let match;
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

const getNextMonday = () => {
  const today = new Date();
  const nextMonday = new Date(today);
  const day = today.getDay();
  const diff = (day === 0 ? 1 : 8 - day); // Sunday = 0
  nextMonday.setDate(today.getDate() + diff);
  return nextMonday.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const useWeeklyForecastLogic = () => {
  const [inputText, setInputText] = useState(() => {
    const saved = localStorage.getItem("weeklyForecastInput");
    if (saved) return saved;

    const baseDate = getNextMonday();
    return `Date: ${baseDate}\nMonday: \nTuesday: \nWednesday: \nThursday: \nFriday: \nSaturday: \nSunday: `;
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

  // Save settings to localStorage
  useEffect(() => localStorage.setItem("captureRate", captureRate), [captureRate]);
  useEffect(() => localStorage.setItem("spendPerGuest", spendPerGuest), [spendPerGuest]);
  useEffect(() => localStorage.setItem("amSplit", amSplit), [amSplit]);
  useEffect(() => localStorage.setItem("adminMode", adminMode), [adminMode]);

  const toggleAdminMode = () => {
    setAdminMode(prev => {
      const newVal = !prev;
      localStorage.setItem("adminMode", newVal);
      return newVal;
    });
  };

  const generateForecast = useCallback(() => {
    setError("");
    setForecastDataUI([]);

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

    const processedData = [];
    let totalTraffic = 0, totalGuests = 0, totalSales = 0, totalFood = 0, totalBev = 0, totalLabor = 0;

    DAY_ORDER.forEach((dayName, index) => {
      if (parsedDayData[dayName] !== undefined) {
        const pax = parsedDayData[dayName];
        const guests = Math.round(pax * (captureRate / 100)); // ✅ correct guest calculation
        const amGuests = Math.round(guests * (amSplit / 100));
        const pmGuests = guests - amGuests;
        const sales = guests * spendPerGuest;
        const food = sales * foodPct;
        const bev = sales * bevPct;
        const labor = sales * laborPct;
        const forecastDate = getDayFromDate(baseDateStr, index);

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

    toast({
      title: "Weekly Forecast Parsed & Saved",
      description: `${processedData.length - 1} entries added for week starting ${baseDateStr}.`,
      action: <CheckCircle className="text-green-500" />,
    });
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
