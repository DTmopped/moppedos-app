import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";

const WeeklyForecastParser = () => {
  const [adminMode, setAdminMode] = useState(false);

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
  } = useWeeklyForecastLogic();

  useEffect(() => {
    // Restore values from localStorage on load
    const savedCapture = localStorage.getItem("captureRate");
    const savedSpend = localStorage.getItem("spendPerGuest");
    const savedSplit = localStorage.getItem("amSplit");
    const savedAdmin = localStorage.getItem("adminMode");

    if (savedCapture) setCaptureRate(Number(savedCapture));
    if (savedSpend) setSpendPerGuest(Number(savedSpend));
    if (savedSplit) setAmSplit(Number(savedSplit));
    if (savedAdmin === "true") setAdminMode(true);
  }, []);

  useEffect(() => {
    // Persist values to localStorage
    localStorage.setItem("captureRate", captureRate);
    localStorage.setItem("spendPerGuest", spendPerGuest);
    localStorage.setItem("amSplit", amSplit);
    localStorage.setItem("adminMode", adminMode);
  }, [captureRate, spendPerGuest, amSplit, adminMode]);

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
      <div className="relative bg-slate-800 p-5 rounded shadow-lg border border-slate-600">
        {/* Admin Button */}
        <div className="absolute top-0 right-0 mt-2 mr-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdminMode((prev) => !prev)}
            className="border-pink-500 text-pink-300 hover:bg-pink-500/10"
          >
            {adminMode ? "Disable Admin Mode" : "Enable Admin Mode"}
          </Button>
        </div>

        <h2 className="text-xl font-bold text-pink-400 mb-2">Weekly Forecast Parser</h2>
        <p className="text-sm text-slate-300 mb-3">
          Paste weekly passenger data (include <strong>Date: YYYY-MM-DD</strong> for Monday) to generate and save forecast.
          Uses <span className="font-semibold text-pink-300">{captureRate}%</span> capture rate and <span className="font-semibold text-pink-300">${spendPerGuest}</span> spend/guest.
        </p>

        {formattedDate && (
          <p className="text-xs text-pink-300 mb-1">Week Starting: <span className="font-medium text-white">{formattedDate}</span></p>
        )}

        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
          className="w-full font-mono text-sm bg-slate-900 text-white border border-slate-700"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Capture Rate %</label>
            <Input
              type="number"
              value={captureRate}
              disabled={!adminMode}
              onChange={(e) => setCaptureRate(Number(e.target.value))}
              className={!adminMode ? "opacity-60 cursor-not-allowed" : ""}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Spend per Guest ($)</label>
            <Input
              type="number"
              value={spendPerGuest}
              disabled={!adminMode}
              onChange={(e) => setSpendPerGuest(Number(e.target.value))}
              className={!adminMode ? "opacity-60 cursor-not-allowed" : ""}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">AM Split %</label>
            <Input
              type="number"
              value={amSplit}
              disabled={!adminMode}
              onChange={(e) => setAmSplit(Number(e.target.value))}
              className={!adminMode ? "opacity-60 cursor-not-allowed" : ""}
            />
          </div>
        </div>

        <Button
          onClick={generateForecast}
          className="mt-4 w-full bg-pink-600 hover:bg-pink-700 text-white"
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

