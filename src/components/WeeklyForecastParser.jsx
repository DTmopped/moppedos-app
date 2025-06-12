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
        className="text-xs text-slate-400 hover:text-slate-100 absolute top-0 right-0 mt-3 mr-4 flex items-center space-x-1"
      >
        <Cog className="w-4 h-4 mr-1" />
        <span>Admin Mode</span>
      </Button>

      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <ForecastHeader />
        <CardContent>
          <p className="text-sm text-slate-400 mb-3">
            Capture Rate: <span className="font-semibold text-white">{(captureRate * 100).toFixed(1)}%</span> &nbsp;|&nbsp; 
            Avg Spend: <span className="font-semibold text-white">${spendPerGuest}</span>
          </p>

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
                    value={captureRate * 100}
                    onChange={(e) => setCaptureRate(Number(e.target.value) / 100)}
                    className="w-full rounded-md p-2 bg-slate-700 text-white border border-slate-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Avg Spend ($)</label>
                  <input
                    type="number"
                    value={spendPerGuest}
                    onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                    className="w-full rounded-md p-2 bg-slate-700 text-white border border-slate-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Meal Split (%) AM</label>
                  <input
                    type="number"
                    value={mealSplit}
                    onChange={(e) => setMealSplit(Number(e.target.value))}
                    className="w-full rounded-md p-2 bg-slate-700 text-white border border-slate-500"
                  />
                  <p className="text-xs mt-1 text-slate-400 italic">PM will be {100 - mealSplit}%</p>
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

