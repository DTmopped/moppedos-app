
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastHeader from "./forecast/ForecastHeader.jsx";
import ForecastInputArea from "./forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "./forecast/ForecastResultsTable.jsx";

const WeeklyForecastParser = () => {
  const {
    forecastText,
    setForecastText,
    handleGenerateForecast,
    forecastDataUI,
    adminMode,
    toggleAdminMode,
    captureRate,
    spendPerGuest,
    amSplit,
    setCaptureRate,
    setSpendPerGuest,
    setAmSplit
  } = useWeeklyForecastLogic();

  useEffect(() => {
    // Optional: Auto-load or log
  }, []);

  return (
    <div className="space-y-6">
      <ForecastHeader
        adminMode={adminMode}
        toggleAdminMode={toggleAdminMode}
        captureRate={captureRate}
        spendPerGuest={spendPerGuest}
        amSplit={amSplit}
      />

      <div className="border border-slate-700 rounded-xl p-4 bg-slate-900">
        <ForecastInputArea
          forecastText={forecastText}
          setForecastText={setForecastText}
          captureRate={captureRate}
          spendPerGuest={spendPerGuest}
          amSplit={amSplit}
          setCaptureRate={setCaptureRate}
          setSpendPerGuest={setSpendPerGuest}
          setAmSplit={setAmSplit}
          adminMode={adminMode}
        />

        <div className="flex justify-end mt-4">
          <Button
            variant="gradient"
            size="lg"
            onClick={handleGenerateForecast}
            className="px-6"
          >
            ➞ Generate Forecast & Save
          </Button>
        </div>
      </div>

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </div>
  );
};

export default WeeklyForecastParser;

