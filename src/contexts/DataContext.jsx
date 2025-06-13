import React, { createContext, useState, useContext, useCallback } from 'react';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Utility: generate guests and forecastSales from throughput
const transformForecastEntry = (entry) => {
  const captureRate = Number(localStorage.getItem("captureRate") || 8);
  const spendPerGuest = Number(localStorage.getItem("spendPerGuest") || 40);

  const guests = Math.round((entry.throughput || 0) * (captureRate / 100));
  const forecastSales = guests * spendPerGuest;

  return {
    ...entry,
    guests,
    forecastSales
  };
};

// Example initial forecast with throughput only
const rawForecast = [
  { date: '2025-05-13', throughput: 15000 },
  { date: '2025-05-14', throughput: 14000 },
  { date: '2025-05-15', throughput: 12500 },
  { date: '2025-05-16', throughput: 15500 },
  { date: '2025-05-17', throughput: 16000 },
  { date: '2025-05-18', throughput: 17200 },
  { date: '2025-05-19', throughput: 14500 },
];

// Transform all initial entries with guest logic
const initialForecastData = rawForecast.map(transformForecastEntry);

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
    const updatedEntry = transformForecastEntry(newEntry);
    setForecastData(prev => {
      const existingIndex = prev.findIndex(entry => entry.date === updatedEntry.date);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...prev[existingIndex], ...updatedEntry };
        return updated;
      }
      return [...prev, updatedEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  const addActualEntry = useCallback((newEntry) => {
    setActualData(prev => {
      const existingIndex = prev.findIndex(entry => entry.date === newEntry.date);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...prev[existingIndex], ...newEntry };
        return updated;
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
    setPosData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
