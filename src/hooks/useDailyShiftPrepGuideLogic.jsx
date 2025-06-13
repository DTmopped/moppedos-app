
import { useEffect, useState } from "react";
import { useData } from "../contexts/DataContext";

export const useDailyShiftPrepGuideLogic = (date) => {
  const { forecastData } = useData();
  const [prepItems, setPrepItems] = useState([]);

  useEffect(() => {
    const amSplit = Number(localStorage.getItem("amSplit")) || 60;
    const captureRate = Number(localStorage.getItem("captureRate")) || 8;
    const spendPerGuest = Number(localStorage.getItem("spendPerGuest")) || 40;

    const targetForecast = forecastData.find(d => d.date === date);
    if (!targetForecast) return;

    const guests = targetForecast.guests || (targetForecast.pax * (captureRate / 100));
    const amGuests = guests * (amSplit / 100);

    const portion = (oz) => ((amGuests * oz) / 16).toFixed(1); // convert oz to lbs

    const calculatedItems = [
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
    ];

    setPrepItems(calculatedItems);
  }, [date, forecastData]);

  return prepItems;
};
