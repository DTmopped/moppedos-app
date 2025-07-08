import React, { createContext, useState, useContext, useCallback } from 'react';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Sample initial data
const initialForecastData = [/* your data stays unchanged */];
const initialActualData = [/* your data stays unchanged */];
const initialPosData = { /* your data stays unchanged */ };

export const DataProvider = ({ children }) => {
  const [forecastData, setForecastData] = useState(initialForecastData);
  const [actualData, setActualData] = useState(initialActualData);
  const [posData, setPosData] = useState(initialPosData);

  const [isAdminMode, setIsAdminMode] = useState(() => {
    const stored = localStorage.getItem('adminMode');
    return stored === 'true';
  });

  const toggleAdminMode = () => {
    setIsAdminMode(prev => {
      const updated = !prev;
      localStorage.setItem('adminMode', updated.toString());
      return updated;
    });
  };

  const [adminSettings, setAdminSettings] = useState({
    captureRate: parseFloat(localStorage.getItem("captureRate")) || 0.08,
    spendPerGuest: parseFloat(localStorage.getItem("spendPerGuest")) || 40,
    amSplit: parseFloat(localStorage.getItem("amSplit")) || 0.6,
    foodCostGoal: parseFloat(localStorage.getItem("foodCostGoal")) || 0.3,
    bevCostGoal: parseFloat(localStorage.getItem("bevCostGoal")) || 0.2,
    laborCostGoal: parseFloat(localStorage.getItem("laborCostGoal")) || 0.14,
  });

  const updateAdminSetting = (key, value) => {
    setAdminSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(key, value.toString());
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
      toggleAdminMode,
      adminSettings,
      updateAdminSetting
    }}>
      {children}
    </DataContext.Provider>
  );
};
