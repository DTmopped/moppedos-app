import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card.jsx";
import { AlertTriangle, Cog } from "lucide-react";
import ForecastHeader from "./forecast/ForecastHeader.jsx";
import ForecastInputArea from "./forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "./forecast/ForecastResultsTable.jsx";
import { useWeeklyForecastLogic } from "../hooks/useWeeklyForecastLogic";
import { Button } from "./ui/button.jsx";

const WeeklyForecastParser = () => {
  const {
    inputText,
    setInputText,
    forecastDataUI,
    error,
    generateForecast,
    setError,
    captureRate,
    setCaptureRate,
    spendPerGuest,
    setSpendPerGuest,
    mealSplit,
    setMealSplit
  } = useWeeklyForecastLogic();

  const [admin, setAdmin] = useState(false);
  const toggleAdmin = () => setAdmin(!admin);

  const displayRate = isNaN(captureRate) ? 0.08 : captureRate;
  const displaySpend = isNaN(spendPerGuest) ? 40 : spendPerGuest;
  const displaySplit = isNaN(mealSplit) ? 60 : mealSplit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 relative"
    >
      <Button
        onClick={toggleAdmin}
        variant="ghost"
        className="absolute top-0 right-0 mt-3 mr-4 text-xs text-slate-400 hover:text-white flex items-center"
      >
        <Cog className="w-4 h-4 mr-1" />
        Admin Mode
      </Button>

      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <ForecastHeader />
        <CardContent className="space-y-4">

          <div className="text-sm text-slate-400 font-medium">
            Current Settings: 
            <span className="ml-3 mr-4 text-white">Capture Rate: {(displayRate * 100).toFixed(1)}%</span>
            <span className="mr-4 text-white">Avg Spend: ${displaySpend}</span>
            <span className="text-white">AM Split: {displaySplit}%</span>
          </div>

          <ForecastInputArea 
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />

          {admin && (
            <div className="mt-6 border-t border-slate-600 pt-4 space-y-4 text-sm text-slate-300">
              <p className="font-semibold text-white mb-2">🔧 Admin Controls</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">Capture Rate (%)</label>
                  <input
                    type="number"
                    value={displayRate * 100}
                    onChange={(e) => setCaptureRate(Number(e.target.value) / 100)}
                    className="w-full rounded-md p-2 bg-slate-700 text-white border border-slate-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Avg Spend ($)</label>
                  <input
                    type="number"
                    value={displaySpend}
                    onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                    className="w-full rounded-md p-2 bg-slate-700 text-white border border-slate-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Meal Split (%) AM</label>
                  <input
                    type="number"
                    value={displaySplit}
                    onChange={(e) => setMealSplit(Number(e.target.value))}
                    className="w-full rounded-md p-2 bg-slate-700 text-white border border-slate-500"
                  />
                  <p className="text-xs mt-1 text-slate-400 italic">PM will be {100 - displaySplit}%</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md border border-red-700 flex items-start"
            >
              <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-400 flex-shrink-0" /> 
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </motion.div>
  );
};

export default WeeklyForecastParser;

