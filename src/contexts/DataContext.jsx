import React, { createContext, useState, useContext, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const initialForecastData = [
  {
    date: '2025-05-13',
    forecastSales: 5200,
    forecastedFood: 1560,
    forecastedBev: 1040,
    forecastedLabor: 728,
    guests: 130,
    amGuests: 78,
    pmGuests: 52
  },
  {
    date: '2025-05-14',
    forecastSales: 5100,
    forecastedFood: 1530,
    forecastedBev: 1020,
    forecastedLabor: 714,
    guests: 127,
    amGuests: 76,
    pmGuests: 51
  },
  {
    date: '2025-05-15',
    forecastSales: 5000,
    forecastedFood: 1500,
    forecastedBev: 1000,
    forecastedLabor: 700,
    guests: 125,
    amGuests: 75,
    pmGuests: 50
  },
  {
    date: '2025-05-16',
    forecastSales: 5300,
    forecastedFood: 1590,
    forecastedBev: 1060,
    forecastedLabor: 742,
    guests: 132,
    amGuests: 79,
    pmGuests: 53
  },
  {
    date: '2025-05-17',
    forecastSales: 6000,
    forecastedFood: 1800,
    forecastedBev: 1200,
    forecastedLabor: 840,
    guests: 150,
    amGuests: 90,
    pmGuests: 60
  },
  {
    date: '2025-05-18',
    forecastSales: 6200,
    forecastedFood: 1860,
    forecastedBev: 1240,
    forecastedLabor: 868,
    guests: 155,
    amGuests: 93,
    pmGuests: 62
  },
  {
    date: '2025-05-19',
    forecastSales: 5800,
    forecastedFood: 1740,
    forecastedBev: 1160,
    forecastedLabor: 812,
    guests: 145,
    amGuests: 87,
    pmGuests: 58
  }
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
  "To-Go Cups/Lids": 400
};

export const DataProvider = ({ children }) => {
  const [forecastData, setForecastData] = useState(initialForecastData);
  const [actualData, setActualData] = useState(initialActualData);
  const [posData, setPosData] = useState(initialPosData);
  const [isAdminMode, setIsAdminMode] = useState(false); // NEW STATE

  const toggleAdminMode = () => setIsAdminMode(prev => !prev); // NEW TOGGLE

  const addForecastEntry = useCallback((newEntry) => {
    setForecastData(prev => {
      const existingEntryIndex = prev.findIndex(entry => entry.date === newEntry.date);
      if (existingEntryIndex > -1) {
        const updatedData = [...prev];
        updatedData[existingEntryIndex] = {
          ...updatedData[existingEntryIndex],
          ...newEntry,
          guests: newEntry.guests,
          amGuests: newEntry.amGuests,
          pmGuests: newEntry.pmGuests
        };
        return updatedData;
      }
      return [
        ...prev,
        {
          ...newEntry,
          guests: newEntry.guests,
          amGuests: newEntry.amGuests,
          pmGuests: newEntry.pmGuests
        }
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  const addActualEntry = useCallback((newEntry) => {
    setActualData(prev => {
      const existingEntryIndex = prev.findIndex(entry => entry.date === newEntry.date);
      if (existingEntryIndex > -1) {
        const updatedData = [...prev];
        updatedData[existingEntryIndex] = {
          ...updatedData[existingEntryIndex],
          ...newEntry
        };
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
    isAdminMode,       // 🟢 exposed in context
    toggleAdminMode    // 🟢 exposed in context
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
