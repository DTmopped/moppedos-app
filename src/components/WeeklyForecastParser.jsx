import React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";

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

  const extractBaseDate = (input) => {
    const match = input.match(/Date:\s*(\d{4}-\d{2}-\d{2})/i);
    if (match && match[1]) {
      const parsed = new Date(match[1]);
      return isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString("en-US");
    }
    return null;
  };

  const formattedDate = extractBaseDate(inputText);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-5 rounded shadow-lg border border-slate-600 relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-pink-400 mb-1">Weekly Forecast Parser</h2>
            <p className="text-sm text-slate-300 mb-2">
              Paste weekly passenger data (include <strong>Date: YYYY-MM-DD</strong> for Monday) to generate and save forecast.
              Uses <span className="font-semibold text-pink-300">{captureRate}%</span> capture rate and <span className="font-semibold text-pink-300">${spendPerGuest}</span> spend/guest.
            </p>
            {formattedDate && (
              <p className="text-xs text-pink-300 mb-2">
                Week Starting: <span className="text-white font-semibold">{formattedDate}</span>
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
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
          className="w-full font-mono text-sm bg-slate-900 text-white border border-slate-700"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Capture Rate */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Capture Rate %</label>
            {adminMode ? (
              <Input
                type="number"
                value={captureRate}
                onChange={(e) => setCaptureRate(Number(e.target.value))}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-slate-100">{captureRate}%</p>
            )}
          </div>

          {/* Spend per Guest */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Spend per Guest ($)</label>
            {adminMode ? (
              <Input
                type="number"
                value={spendPerGuest}
                onChange={(e) => setSpendPerGuest(Number(e.target.value))}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-slate-100">${spendPerGuest}</p>
            )}
          </div>

          {/* AM Split */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">AM Split %</label>
            {adminMode ? (
              <Input
                type="number"
                value={amSplit}
                onChange={(e) => setAmSplit(Number(e.target.value))}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-slate-100">
                {amSplit}% <span className="text-slate-400 text-xs">(PM: {100 - amSplit}%)</span>
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

