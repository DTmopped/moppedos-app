import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card.jsx";
import { AlertTriangle, UsersCog } from "lucide-react";
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
    spendPerGuest,
    setCaptureRate,
    setSpendPerGuest,
    amPercent,
    pmPercent,
    setAmPercent,
    setPmPercent,
    adminMode,
    toggleAdmin
  } = useWeeklyForecastLogic();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 pt-6">
          <ForecastHeader />
          <button
            onClick={toggleAdmin}
            className="text-xs text-slate-300 hover:text-white border border-slate-500 px-3 py-1 rounded-md flex items-center space-x-2"
          >
            <UsersCog size={14} className="mr-1" />
            <span>Admin Mode</span>
          </button>
        </div>

        <CardContent>
          <ForecastInputArea 
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />

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

          {adminMode && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400">Capture Rate %</label>
                <input
                  type="number"
                  value={captureRate}
                  onChange={(e) => setCaptureRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Spend per Guest ($)</label>
                <input
                  type="number"
                  value={spendPerGuest}
                  onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">AM Shift %</label>
                <input
                  type="number"
                  value={amPercent}
                  onChange={(e) => setAmPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">PM Shift %</label>
                <input
                  type="number"
                  value={pmPercent}
                  onChange={(e) => setPmPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">
            Uses <span className="text-pink-300 font-medium">{captureRate}%</span> capture rate and <span className="text-pink-300 font-medium">${spendPerGuest}</span> spend/guest.
          </div>
        </CardContent>
      </Card>

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </motion.div>
  );
};

export default WeeklyForecastParser;
