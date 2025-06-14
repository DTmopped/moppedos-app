import React, { useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/ForecastResultsTable.jsx";

const WeeklyForecastParser = () => {
  const {
    inputText,
    setInputText,
    forecastDataUI,
    error,
    setError,
    generateForecast,
    captureRate,
    setCaptureRate,
    spendPerGuest,
    setSpendPerGuest,
    amSplit,
    setAmSplit,
    adminMode,
    toggleAdminMode
  } = useWeeklyForecastLogic();

  const startDate = forecastDataUI?.[0]?.date
    ? new Date(forecastDataUI[0].date).toLocaleDateString("en-US")
    : null;

  useEffect(() => {
    setError(""); // Clear error on mount/reset
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border bg-slate-800 border-slate-600 text-white">
        <h2 className="text-pink-400 font-bold text-lg flex items-center gap-2 mb-2">
          <span className="text-xl">🧮</span> Weekly Forecast Parser
        </h2>
        <p className="text-sm text-slate-300 mb-2">
          Paste weekly passenger data (include <strong>Date: YYYY-MM-DD</strong> for Monday) to generate and save forecast.
          Uses <span className="font-bold text-pink-300">{captureRate}%</span> capture rate and <span className="font-bold text-pink-300">${spendPerGuest}</span> spend/guest.
        </p>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
          className="w-full p-3 rounded-md bg-slate-900 text-white font-mono border border-slate-700"
          placeholder={`Date: 2025-05-12\nMonday: 15000\nTuesday: 16000\n...`}
        />

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="text-sm text-slate-300 block mb-1">Capture Rate %</label>
            <input
              type="number"
              value={captureRate}
              onChange={(e) => setCaptureRate(Number(e.target.value))}
              className="w-full rounded-md p-2 bg-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1">Spend per Guest ($)</label>
            <input
              type="number"
              value={spendPerGuest}
              onChange={(e) => setSpendPerGuest(Number(e.target.value))}
              className="w-full rounded-md p-2 bg-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1">AM Split %</label>
            <input
              type="number"
              value={amSplit}
              onChange={(e) => setAmSplit(Number(e.target.value))}
              className="w-full rounded-md p-2 bg-slate-700 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">PM Split: {100 - amSplit}%</p>
          </div>
          <div className="flex flex-col justify-end">
            <Button
              onClick={generateForecast}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold"
            >
              ➕ Generate Forecast & Save
            </Button>
            <Button
              variant="ghost"
              onClick={toggleAdminMode}
              className="mt-2 text-xs text-pink-300"
            >
              {adminMode ? "✅ Admin Mode On" : "Enable Admin Mode"}
            </Button>
          </div>
        </div>
      </div>

      {startDate && (
        <div className="text-sm text-slate-400 mt-4 mb-2">
          Showing forecast for week of <span className="font-semibold text-white">{startDate}</span>
        </div>
      )}

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </div>
  );
};

export default WeeklyForecastParser;

