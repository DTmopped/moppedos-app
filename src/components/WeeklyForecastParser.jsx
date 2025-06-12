import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card.jsx";
import { AlertTriangle, Settings2 } from "lucide-react";
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
    avgSpend,
    setAvgSpend
  } = useWeeklyForecastLogic();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <ForecastHeader />
        <CardContent>
          <ForecastInputArea 
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Settings2 size={16} className="text-white/50" /> Admin Controls
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full sm:w-auto">
              <div className="text-sm">
                <label htmlFor="captureRate" className="block text-white/70 mb-1">Capture Rate %</label>
                <input
                  id="captureRate"
                  type="number"
                  step="0.01"
                  value={captureRate}
                  onChange={(e) => setCaptureRate(parseFloat(e.target.value))}
                  className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="avgSpend" className="block text-white/70 mb-1">Spend per Guest ($)</label>
                <input
                  id="avgSpend"
                  type="number"
                  step="1"
                  value={avgSpend}
                  onChange={(e) => setAvgSpend(parseFloat(e.target.value))}
                  className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600"
                />
              </div>
            </div>
          </div>

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
