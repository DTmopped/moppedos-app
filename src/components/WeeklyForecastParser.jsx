import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card.jsx";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import ForecastHeader from "./forecast/ForecastHeader.jsx";
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
    setSpendPerGuest
  } = useWeeklyForecastLogic();

  const [adminMode, setAdminMode] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm relative">
        <div className="absolute top-4 right-4 flex items-center space-x-2 text-slate-300 text-xs cursor-pointer hover:text-white" onClick={() => setAdminMode(!adminMode)}>
          <ShieldAlert size={14} className="mr-1" />
          <span>Admin Mode</span>
        </div>
        <ForecastHeader />
        <CardContent>
          <ForecastInputArea 
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />

          {adminMode && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm mb-1 block">Capture Rate %</label>
                <input
                  type="number"
                  value={captureRate}
                  onChange={(e) => setCaptureRate(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full px-3 py-2 rounded-md bg-slate-900 text-white border border-slate-600 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1 block">Spend per Guest ($)</label>
                <input
                  type="number"
                  value={spendPerGuest}
                  onChange={(e) => setSpendPerGuest(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full px-3 py-2 rounded-md bg-slate-900 text-white border border-slate-600 placeholder-slate-500"
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
