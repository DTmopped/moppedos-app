import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card.jsx";
import { AlertTriangle, UserCog } from "lucide-react";
import ForecastHeader from "./forecast/ForecastHeader.jsx";
import ForecastInputArea from "./forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "./forecast/ForecastResultsTable.jsx";
import { useWeeklyForecastLogic } from "../hooks/useWeeklyForecastLogic";

const WeeklyForecastParser = () => {
  const [adminMode, setAdminMode] = useState(false);
  const {
    inputText,
    setInputText,
    forecastDataUI,
    error,
    generateForecast,
    setError,
    captureRate,
    spendPerGuest,
    setCaptureRate,
    setSpendPerGuest
  } = useWeeklyForecastLogic();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 pt-4">
          <ForecastHeader captureRate={captureRate} spendPerGuest={spendPerGuest} />
          <button
            className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white border border-slate-600 rounded px-2 py-1"
            onClick={() => setAdminMode(!adminMode)}
          >
            <UserCog className="h-4 w-4" />
            <span>Admin Mode</span>
          </button>
        </div>
        <CardContent>
          <ForecastInputArea 
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />

          {adminMode && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Capture Rate %</label>
                <input
                  type="number"
                  value={captureRate}
                  onChange={e => setCaptureRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Spend per Guest ($)</label>
                <input
                  type="number"
                  value={spendPerGuest}
                  onChange={e => setSpendPerGuest(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                />
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
