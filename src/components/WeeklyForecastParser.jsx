import React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";
import { extractBaseDateFromWeeklyInput } from "../../lib/dateUtils.js"; // ✅ Move here

const WeeklyForecastParser = () => {
  const {
    inputText,
    setInputText,
    forecastDataUI,
    error,
    generateForecast,
    captureRate,
    setCaptureRate,
    spendPerGuest,
    setSpendPerGuest,
    amSplit,
    setAmSplit,
    adminMode,
    toggleAdminMode,
  } = useWeeklyForecastLogic();

  const rawBaseDateStr = extractBaseDateFromWeeklyInput(inputText);
  let formattedDate = null;
  if (rawBaseDateStr) {
    formattedDate = new Date(rawBaseDateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return null;
};

import { extractBaseDateFromWeeklyInput } from "../../lib/dateUtils.js";
// New formattedDate assignment
const rawBaseDateStr = extractBaseDateFromWeeklyInput(inputText);
let formattedDate = null;
if (rawBaseDateStr) {
  formattedDate = new Date(rawBaseDateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-5 rounded shadow-lg border border-slate-600 relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-pink-400 mb-1">
              Weekly Forecast Parser
            </h2>
            <p className="text-sm text-slate-300 mb-2">
              Paste weekly passenger data (include <strong>Date: MM-DD-YYYY</strong> for Monday)
              to generate and save forecast. Uses{" "}
              <span className="font-semibold text-pink-300">{captureRate}%</span> capture rate and{" "}
              <span className="font-semibold text-pink-300">${spendPerGuest}</span> spend/guest.
            </p>
            {formattedDate && (
              <p className="text-xs text-pink-300 mb-2">
                Week Starting:{" "}
                <span className="text-white font-semibold">{formattedDate}</span>
              </p>
            )}
          </div>
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white text-sm px-3 py-1 rounded"
            onClick={toggleAdminMode}
          >
            {adminMode ? "Hide Admin Tools" : "Enable Admin Tools"}
          </button>
        </div>

        <Textarea
          value={inputText}
         onChange={(e) => {
  const value = e.target.value;
  setInputText(value);
  localStorage.setItem("weeklyForecastInput", value);
}}
          rows={8}
          className="w-full font-mono text-sm bg-slate-900 text-white border border-slate-700"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Capture Rate */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">
              Capture Rate %
            </label>
            {adminMode ? (
              <input
                type="number"
                value={captureRate}
                onChange={(e) => setCaptureRate(Number(e.target.value))}
                className="w-full px-2 py-1 rounded bg-slate-900 text-white border border-slate-600"
              />
            ) : (
              <p className="text-sm text-white">{captureRate}%</p>
            )}
          </div>

          {/* Spend per Guest */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">
              Spend per Guest ($)
            </label>
            {adminMode ? (
              <input
                type="number"
                value={spendPerGuest}
                onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                className="w-full px-2 py-1 rounded bg-slate-900 text-white border border-slate-600"
              />
            ) : (
              <p className="text-sm text-white">${spendPerGuest}</p>
            )}
          </div>

          {/* AM Split */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">
              AM Split %
            </label>
            {adminMode ? (
              <input
                type="number"
                value={amSplit}
                onChange={(e) => setAmSplit(Number(e.target.value))}
                className="w-full px-2 py-1 rounded bg-slate-900 text-white border border-slate-600"
              />
            ) : (
              <p className="text-sm text-white">
                {amSplit}%{" "}
                <span className="text-slate-400 text-xs">
                  (PM: {100 - amSplit}%)
                </span>
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={generateForecast}
          className="mt-5 w-full bg-pink-600 hover:bg-pink-700 text-white"
        >
          Generate Forecast & Save
        </Button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </div>
  );
};

export default WeeklyForecastParser;
