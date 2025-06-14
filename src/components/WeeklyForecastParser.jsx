import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";
import ForecastInputArea from "@/components/forecast/ForecastInputArea.jsx";
import ForecastHeader from "@/components/forecast/ForecastHeader.jsx";

const WeeklyForecastParser = () => {
  const {
    rawText,
    setRawText,
    captureRate,
    setCaptureRate,
    spendPerGuest,
    setSpendPerGuest,
    amSplit,
    setAmSplit,
    isAdmin,
    toggleAdmin,
    parsedData,
    handleForecastGenerate
  } = useWeeklyForecastLogic();

  return (
    <div className="space-y-6">
      <ForecastHeader
        isAdmin={isAdmin}
        toggleAdmin={toggleAdmin}
        captureRate={captureRate}
        spendPerGuest={spendPerGuest}
        amSplit={amSplit}
      />

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl px-6 py-4">
        <label className="block text-sm text-slate-300 font-medium mb-2">
          Weekly Passenger Data
        </label>
        <textarea
          rows={8}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full bg-slate-900 text-white text-sm rounded-md border border-slate-600 px-4 py-2 font-mono resize-y"
          placeholder={`Example:\nDate: YYYY-MM-DD (for Monday)\nMonday: 15000\nTuesday: 16000\n...`}
        />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-4 justify-between">
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <div className="flex flex-col">
              <label className="text-xs text-slate-400">Capture Rate %</label>
              <input
                type="number"
                className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-1 text-sm w-24"
                value={captureRate}
                onChange={(e) => setCaptureRate(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400">Spend per Guest ($)</label>
              <input
                type="number"
                className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-1 text-sm w-24"
                value={spendPerGuest}
                onChange={(e) => setSpendPerGuest(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400">AM Split %</label>
              <input
                type="number"
                className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-1 text-sm w-24"
                value={amSplit}
                onChange={(e) => setAmSplit(e.target.value)}
              />
              <span className="text-[10px] text-slate-500">PM Split: {100 - Number(amSplit)}%</span>
            </div>
          </div>

          <Button
            onClick={handleForecastGenerate}
            className="text-sm font-medium bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-md mt-2 sm:mt-0"
          >
            + Generate Forecast & Save
          </Button>
        </div>
      </div>

      <ForecastResultsTable forecastDataUI={parsedData} />
    </div>
  );
};

export default WeeklyForecastParser;

