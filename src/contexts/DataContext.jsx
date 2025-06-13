import React, { createContext, useState, useContext, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// ✅ Forecast data must include guest count (used by prep logic)
const initialForecastData = [
  { date: '2025-05-13', guests: 1050 },
  { date: '2025-05-14', guests: 1120 },
  { date: '2025-05-15', guests: 1085 },
  { date: '2025-05-16', guests: 1190 },
  { date: '2025-05-17', guests: 1365 },
  { date: '2025-05-18', guests: 1260 },
  { date: '2025-05-19', guests: 630 }
];

const initialActualData = [
  {
    date: '2025-05-13',
    actualSales: 5400,
    foodCost: 1620,
    beverageCost: 960,
    laborCost: 770
  },
  {
    date: '2025-05-14',
    actualSales: 4850,
    foodCost: 1580,
    beverageCost: 880,
    laborCost: 680
  }
];

const initialPosData = {
  "Pulled Pork Sandwich": 120,
  "Chopped Brisket Sandwich": 95,
  "Chopped Chicken Sandwich": 80,
  "Buns": 300, 
  "Pulled Pork": 200, 
  "Mac & Cheese": 150, 
  "House Pickles (32 oz jars)": 10,
  "To-Go Cups/Lids": 400,
};

export const DataProvider = ({ children }) => {
  const [forecastData, setForecastData] = useState(initialForecastData);
  const [actualData, setActualData] = useState(initialActualData);
  const [posData, setPosData] = useState(initialPosData);

  const addForecastEntry = useCallback((newEntry) => {
    setForecastData(prev => {
      const existingEntryIndex = prev.findIndex(entry => entry.date === newEntry.date);
      if (existingEntryIndex > -1) {
        const updatedData = [...prev];
        updatedData[existingEntryIndex] = { ...updatedData[existingEntryIndex], ...newEntry };
        return updatedData;
      }
      return [...prev, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  const addActualEntry = useCallback((newEntry) => {
    setActualData(prev => {
      const existingEntryIndex = prev.findIndex(entry => entry.date === newEntry.date);
      if (existingEntryIndex > -1) {
        const updatedData = [...prev];
        updatedData[existingEntryIndex] = { ...updatedData[existingEntryIndex], ...newEntry };
        return updatedData;
      }
      return [...prev, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  const value = {
    forecastData,
    actualData,
    posData,
    addForecastEntry,
    addActualEntry,
    setPosData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
