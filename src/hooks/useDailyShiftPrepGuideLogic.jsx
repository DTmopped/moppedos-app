import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext.jsx";

export const useDailyShiftPrepGuideLogic = () => {
  const { forecastData } = useData();

  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [dailyShiftPrepData, setDailyShiftPrepData] = useState([]);

  // Settings from localStorage
  const captureRate = Number(localStorage.getItem("captureRate") || 8);
  const spendPerGuest = Number(localStorage.getItem("spendPerGuest") || 40);
  const amSplit = Number(localStorage.getItem("amSplit") || 60);

  // Stub menu values for compatibility
  const menu = {};
  const MenuEditorComponent = null;
  const menuLoading = false;
  const manageMenuOpen = false;
  const setManageMenuOpen = () => {};
  const handleSaveMenu = () => {};

  const handlePrepTaskChange = (dayIndex, itemIndex, updatedItem) => {
    setDailyShiftPrepData(prev => {
      const copy = [...prev];
      copy[dayIndex].items[itemIndex] = updatedItem;
      return copy;
    });
  };

  useEffect(() => {
    console.log("🟡 Raw forecastData received:", forecastData);

    if (!forecastData || forecastData.length === 0) return;

    const newPrepData = forecastData
      .filter(entry => {
        const hasValidGuestData = typeof entry.guests === 'number' || typeof entry.pax === 'number';
        console.log("🔎 Entry keys:", Object.keys(entry));
        return entry.date && hasValidGuestData;
      })
      .map(entry => {
        const guests = entry.guests ?? (entry.pax * (captureRate / 100));
        const amGuests = guests * (amSplit / 100);

        const portion = (oz) => ((amGuests * oz) / 16).toFixed(1); // oz to lbs

        const items = [
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

        return {
          date: entry.date,
          guests,
          amGuests,
          items,
        };
      });

    console.log("✅ Final dailyShiftPrepData:", newPrepData);
    setDailyShiftPrepData(newPrepData);
  }, [forecastData, amSplit, captureRate]);

  return {
    forecastData,
    menu,
    MenuEditorComponent,
    menuLoading,
    adjustmentFactor,
    dailyShiftPrepData,
    manageMenuOpen,
    setManageMenuOpen,
    handlePrepTaskChange,
    handleSaveMenu,
    printDate: null,
    setPrintDate: () => {}
  };
};
