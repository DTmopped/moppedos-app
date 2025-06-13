import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card.jsx";
import { Cog } from "lucide-react";
import ForecastInputArea from "./forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "./forecast/ForecastResultsTable.jsx";
import { useWeeklyForecastLogic } from "../hooks/useWeeklyForecastLogic";

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
    amSplit,
    setAmSplit,
    adminMode,
    toggleAdminMode
  } = useWeeklyForecastLogic();

  const foodPct = Number(localStorage.getItem("foodCostPercent") || 0.3);
  const bevPct = Number(localStorage.getItem("bevCostPercent") || 0.2);
  const laborPct = Number(localStorage.getItem("laborCostPercent") || 0.14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 relative"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <div className="flex justify-between items-center px-6 pt-6">
          <div>
            <h2 className="text-pink-400 font-bold text-xl flex items-center">
              <span className="bg-pink-600 p-2 rounded-full mr-3 text-white">🧮</span>
              Weekly Forecast Parser
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Paste weekly passenger data (include <span className="font-mono font-bold">Date:</span> <span className="font-mono font-bold">YYYY-MM-DD</span> for Monday) to generate and save forecast. Uses <span className="text-pink-300 font-bold">{captureRate}%</span> capture rate and <span className="text-pink-300 font-bold">${spendPerGuest}</span> spend/guest.
            </p>
            <p className="text-sm text-slate-200 pt-2">
              <span className="text-slate-100 font-semibold">Current Settings:</span>
              <span className="text-pink-300 font-semibold ml-4">Capture Rate: {captureRate}%</span>
              <span className="text-pink-300 font-semibold ml-4">Avg Spend: ${spendPerGuest}</span>
              <span className="text-pink-300 font-semibold ml-4">AM Split: {amSplit}%</span>
           </p>
          </div>
          <button
            type="button"
            onClick={toggleAdminMode}
            className={`text-sm rounded-md flex items-center px-3 py-1 transition-colors border ${
              adminMode
                ? "bg-pink-600 text-white border-white"
                : "text-slate-300 border-slate-500 hover:text-white hover:border-white bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <Cog className="h-4 w-4 mr-1" /> Admin Mode
          </button>
        </div>
        <CardContent>
          <ForecastInputArea 
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />

          {adminMode && (
            <div className="grid grid-cols-3 gap-4 mt-6 animate-fade-in">
              <div>
                <label className="block text-sm text-white mb-1">Capture Rate %</label>
                <input
                  type="number"
                  value={captureRate}
                  onChange={(e) => setCaptureRate(Number(e.target.value))}
                  className="bg-slate-900 text-white px-3 py-2 rounded w-full border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Spend per Guest ($)</label>
                <input
                  type="number"
                  value={spendPerGuest}
                  onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                  className="bg-slate-900 text-white px-3 py-2 rounded w-full border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-1">AM Split %</label>
                <input
                  type="number"
                  value={amSplit}
                  onChange={(e) => setAmSplit(Number(e.target.value))}
                  className="bg-slate-900 text-white px-3 py-2 rounded w-full border border-slate-600"
                />
                <p className="text-xs text-slate-400 mt-1">PM Split: {100 - amSplit}%</p>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md border border-red-700 flex items-start"
            >
              <span className="mr-2 mt-0.5">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <ForecastResultsTable 
        forecastDataUI={forecastDataUI}
        captureRate={captureRate}
        spendPerGuest={spendPerGuest}
        foodPct={foodPct}
        bevPct={bevPct}
        laborPct={laborPct}
      />
    </motion.div>
  );
};

export default WeeklyForecastParser;

