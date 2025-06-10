import { useState } from 'react';

export const useWeeklyForecastLogic = () => {
  const [inputText, setInputText] = useState('');
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState('');

  const generateForecast = () => {
    // Mock logic — replace with real parser later
    if (!inputText.trim()) {
      setError("Please enter data to forecast.");
      return;
    }

    setError('');
    setForecastDataUI([
      { date: '2025-06-10', forecastedSales: 4800 },
      { date: '2025-06-11', forecastedSales: 5000 },
    ]);
  };

  return {
    inputText,
    setInputText,
    forecastDataUI,
    error,
    generateForecast,
    setError
  };
};