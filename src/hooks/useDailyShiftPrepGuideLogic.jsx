import { useEffect, useState } from "react";
import { useData } from "../contexts/DataContext.jsx";
import { format, isSameDay } from "date-fns";

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData } = useData();
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;

    const captureRate = Number(localStorage.getItem("captureRate")) || 8;
    const spendPerGuest = Number(localStorage.getItem("spendPerGuest")) || 40;
    const amSplit = Number(localStorage.getItem("amSplit")) || 60;

    const calculatePrepForDay = (entry) => {
      const guests = entry.guests || (entry.pax * (captureRate / 100));
      const amGuests = guests * (amSplit / 100);

      const portion = (oz) => ((amGuests * oz) / 16).toFixed(1); // oz to lbs

      return {
        date: entry.date,
        day: entry.day,
        guests: Math.round(guests),
        amGuests: Math.round(amGuests),
        items: [
          { item: "Pulled Pork Sandwich", qty: Math.ceil(amGuests * 1), unit: "each" },
          { item: "Chopped Brisket Sandwich", qty: Math.ceil(amGuests * 1), unit: "each" },
          { item: "Chopped Chicken Sandwich", qty: Math.ceil(amGuests * 1), unit: "each" },
          { item: "Buns", qty: Math.ceil(amGuests * 3), unit: "each" },
          { item: "Pulled Pork", qty: portion(4), unit: "lbs" },
          { item: "Chopped Brisket", qty: portion(4), unit: "lbs" },
          { item: "Chopped Chicken", qty: portion(4), unit: "lbs" },
          { item: "Coleslaw", qty: portion(3), unit: "lbs" },
          { item: "Mac & Cheese", qty: portion(4), unit: "lbs" },
          { item: "Green Beans", qty: portion(4), unit: "lbs" },
          { item: "Texas Toast", qty: Math.ceil(amGuests * 1), unit: "each" },
        ],
      };
    };

    const allDailyPrep = forecastData.map((entry) => calculatePrepForDay(entry));
    setDailyShiftPrepData(allDailyPrep);
  }, [forecastData]);

  return {
    dailyShiftPrepData,
    adjustmentFactor: 1.0 // placeholder for future logic if needed
  };
};

