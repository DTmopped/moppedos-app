import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";

const WeeklyForecastParser = () => {
  const { toast } = useToast();
  const {
    forecastText,
    setForecastText,
    adminMode,
    toggleAdminMode,
    captureRate,
    spendPerGuest,
    amSplit,
    setCaptureRate,
    setSpendPerGuest,
    setAmSplit,
    forecastDataUI,
    handleGenerateForecast,
  } = useWeeklyForecastLogic();

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("Text");
    setForecastText(pastedText);
  };

  const handleClick = () => {
    const success = handleGenerateForecast();
    if (!success) {
      toast({ title: "Parsing error", description: "Could not generate forecast. Check input format.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-pink-400">
            🧾 Weekly Forecast Parser
          </h2>
          <button
            onClick={toggleAdminMode}
            className="text-xs text-pink-300 underline hover:text-pink-200"
          >
            {adminMode ? "Disable Admin Mode" : "Enable Admin Mode"}
          </button>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          Paste weekly passenger data (include <span className="font-semibold text-white">Date: YYYY-MM-DD</span> for Monday) to generate and save forecast.
          Uses <span className="text-pink-300 font-semibold">{captureRate}%</span> capture rate and <span className="text-pink-300 font-semibold">${spendPerGuest}</span> spend/guest.
        </p>

        <div className="mb-4">
          <label className="text-sm text-white font-medium block mb-2">
            Weekly Passenger Data
          </label>
          <textarea
            className="w-full min-h-[180px] rounded-md bg-slate-900 border border-slate-700 p-3 text-white font-mono text-sm"
            value={forecastText}
            onChange={(e) => setForecastText(e.target.value)}
            onPaste={handlePaste}
            placeholder={`Example:\nDate: YYYY-MM-DD (for Monday)\nMonday: 15000\nTuesday: 16000\n...`}
          />
        </div>

        {adminMode && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-white mb-1">Capture Rate %</label>
              <input
                type="number"
                value={captureRate}
                onChange={(e) => setCaptureRate(Number(e.target.value))}
                className="w-full rounded-md bg-slate-900 border border-slate-700 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white mb-1">Spend per Guest ($)</label>
              <input
                type="number"
                value={spendPerGuest}
                onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                className="w-full rounded-md bg-slate-900 border border-slate-700 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white mb-1">AM Split %</label>
              <input
                type="number"
                value={amSplit}
                onChange={(e) => setAmSplit(Number(e.target.value))}
                className="w-full rounded-md bg-slate-900 border border-slate-700 p-2 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">PM Split: {100 - amSplit}%</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleClick}
          variant="gradient"
          className="w-full justify-center"
        >
          ↗ Generate Forecast & Save
        </Button>
      </div>

      {forecastDataUI && forecastDataUI.length > 0 && (
        <ForecastResultsTable forecastDataUI={forecastDataUI} />
      )}
    </div>
  );
};

export default WeeklyForecastParser;

