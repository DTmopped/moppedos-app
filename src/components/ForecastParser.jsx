import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ForecastInputArea from "./ForecastInputArea.jsx";
import ForecastResultsTable from "./ForecastResultsTable.jsx";
import ForecastHeader from "./ForecastHeader.jsx";

const getStoredValue = (key, fallback) => {
  const stored = localStorage.getItem(key);
  return stored !== null ? parseFloat(stored) : fallback;
};

const WeeklyForecastParser = () => {
  const [inputText, setInputText] = useState("");
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState("");

  const [captureRate, setCaptureRate] = useState(getStoredValue("captureRate", 0.08));
  const [spendPerGuest, setSpendPerGuest] = useState(getStoredValue("spendPerGuest", 40));
  const [amSplit, setAmSplit] = useState(getStoredValue("amSplit", 0.6));

  useEffect(() => {
    localStorage.setItem("captureRate", captureRate);
    localStorage.setItem("spendPerGuest", spendPerGuest);
    localStorage.setItem("amSplit", amSplit);
  }, [captureRate, spendPerGuest, amSplit]);

  const generateForecast = () => {
    try {
      setError("");
      const lines = inputText.trim().split("\n");
      const data = [];
      let currentDate = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (/^date:/i.test(trimmed)) {
          const dateMatch = trimmed.split(":")[1]?.trim();
          if (dateMatch) currentDate = new Date(dateMatch);
          continue;
        }

        const match = trimmed.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*(\d+)/i);
        if (!match) {
          console.warn("Line did not match expected format:", trimmed);
          continue;
        }

        const day = match[1];
        const pax = parseInt(match[2]);
        const guests = pax * captureRate;
        const amGuests = Math.round(guests * amSplit);
        const pmGuests = Math.round(guests * (1 - amSplit));
        const sales = guests * spendPerGuest;

        const food = sales * (parseFloat(localStorage.getItem("foodCostGoal")) || 0.3);
        const bev = sales * (parseFloat(localStorage.getItem("bevCostGoal")) || 0.2);
        const labor = sales * (parseFloat(localStorage.getItem("laborCostGoal")) || 0.14);

        data.push({
          day,
          date: currentDate,
          pax,
          guests,
          amGuests,
          pmGuests,
          sales,
          food,
          bev,
          labor,
        });

        if (currentDate) currentDate.setDate(currentDate.getDate() + 1);
      }

      if (!data.length) throw new Error("No valid forecast data parsed.");
      setForecastDataUI(data);
    } catch (err) {
      setError("Failed to parse forecast. Check formatting.");
      console.error("Parse Error:", err);
      setForecastDataUI([]);
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ForecastHeader
        captureRate={captureRate}
        setCaptureRate={setCaptureRate}
        spendPerGuest={spendPerGuest}
        setSpendPerGuest={setSpendPerGuest}
        amSplit={amSplit}
        setAmSplit={setAmSplit}
      />
      <ForecastInputArea
        inputText={inputText}
        setInputText={setInputText}
        generateForecast={generateForecast}
      />
      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">{error}</p>}
      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </motion.div>
  );
};

export default WeeklyForecastParser;
