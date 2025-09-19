import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Sample initial data
const initialForecastData = [];
const initialActualData = [];
const initialPosData = {};

export const DataProvider = ({ children }) => {
  // ✅ Hydrate forecastData from localStorage
  const [forecastData, setForecastData] = useState(() => {
    const stored = localStorage.getItem("weeklyForecastResults");
    return stored ? JSON.parse(stored).filter(row => !row.isTotal) : initialForecastData;
  });

  const [actualData, setActualData] = useState(initialActualData);
  const [posData, setPosData] = useState(initialPosData);
  const [printDate, setPrintDate] = useState(null);
  const [guideData, setGuideData] = useState({});
  const [manualAdditions, setManualAdditions] = useState({});
  // Optional: persist forecastData to localStorage on change
  useEffect(() => {
    localStorage.setItem("weeklyForecastResults", JSON.stringify(forecastData));
  }, [forecastData]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const stored = localStorage.getItem('adminMode');
  // Default to false if nothing is stored
  return stored === null ? false : stored === 'true';
});

  const toggleAdminMode = () => {
    setIsAdminMode(prev => {
      const updated = !prev;
      localStorage.setItem('adminMode', updated.toString());
      return updated;
    });
  };

  const safeParse = (key, fallback) => {
    const raw = localStorage.getItem(key);
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? fallback : parsed;
  };

  const [adminSettings, setAdminSettings] = useState({
    captureRate: safeParse("captureRate", 0.08),
    spendPerGuest: safeParse("spendPerGuest", 40),
    amSplit: safeParse("amSplit", 0.6),
    foodCostGoal: safeParse("foodCostGoal", 0.3),
    bevCostGoal: safeParse("bevCostGoal", 0.2),
    laborCostGoal: safeParse("laborCostGoal", 0.14),
  });

  const updateAdminSetting = (key, value) => {
    let numericValue = parseFloat(value);

    // Normalize % fields
    if (['captureRate', 'amSplit', 'foodCostGoal', 'bevCostGoal', 'laborCostGoal'].includes(key)) {
      if (numericValue > 1) numericValue = numericValue / 100;
    }

    setAdminSettings(prev => {
      const updated = { ...prev, [key]: numericValue };
      localStorage.setItem(key, numericValue.toString());
      return updated;
    });
  };

  const addForecastEntry = useCallback((newEntry) => {
    setForecastData(prev => {
      const index = prev.findIndex(entry => entry.date === newEntry.date);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newEntry };
        return updated;
      }
      return [...prev, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  const addActualEntry = useCallback((newEntry) => {
    setActualData(prev => {
      const index = prev.findIndex(entry => entry.date === newEntry.date);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newEntry };
        return updated;
      }
      return [...prev, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  return (
  <DataContext.Provider value={{
  forecastData,
  actualData,
  posData,
  setForecastData,
  setPosData,
  addForecastEntry,
  addActualEntry,
  isAdminMode,
  setIsAdminMode, // ✅ ADD THIS LINE  
  toggleAdminMode,
  adminSettings,
  updateAdminSetting,
  guideData,
  setGuideData,
  manualAdditions,
  setManualAdditions,
  printDate,            // ✅ Already exposed
  setPrintDate          // ✅ This is missing — ADD THIS LINE
}}>
  {children}
</DataContext.Provider>
  );
};
