import React, { useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";
import ForecastHeader from "@/components/forecast/ForecastHeader.jsx";
import ForecastInputArea from "@/components/forecast/ForecastInputArea.jsx";

const WeeklyForecastParser = () => {
  const {
    inputData,
    setInputData,
    captureRate,
    spendPerGuest,
    amSplit,
    forecastDataUI,
    handleGenerateForecast,
    adminMode,
    setAdminMode,
    handleInputChange,
    handleCaptureRateChange,
    handleSpendChange,
    handleAmSplitChange,
    weekStartDate
  } = useWeeklyForecastLogic();

  const formattedWeekDate = weekStartDate
    ? new Date(weekStartDate).toLocaleDateString("en-US")
    : null;

  useEffect(() => {
    document.title = "Weekly Forecast | Mopped OS";
  }, []);

  return (
    <div className="space-y-6">
      <ForecastHeader />

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-4">
        <ForecastInputArea
          inputData={inputData}
          onInputChange={handleInputChange}
        />

        {formattedWeekDate && (
          <p className="text-sm text-slate-400">
            Showing forecast for week of <strong>{formattedWeekDate}</strong>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-400">Capture Rate %</label>
            <input
              type="number"
              value={captureRate}
              onChange={handleCaptureRateChange}
              className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Spend per Guest ($)</label>
            <input
              type="number"
              value={spendPerGuest}
              onChange={handleSpendChange}
              className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">AM Split %</label>
            <input
              type="number"
              value={amSplit}
              onChange={handleAmSplitChange}
              className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">PM Split: {100 - amSplit}%</p>
          </div>
          <div className="flex items-end gap-3">
            <Button
              onClick={handleGenerateForecast}
              className="bg-pink-600 hover:bg-pink-700 text-white w-full"
            >
              + Generate Forecast & Save
            </Button>
            <button
              onClick={() => setAdminMode(!adminMode)}
              className="text-xs text-pink-300 underline whitespace-nowrap"
            >
              {adminMode ? "Disable Admin Mode" : "Enable Admin Mode"}
            </button>
          </div>
        </div>
      </div>

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </div>
  );
};

export default WeeklyForecastParser;

