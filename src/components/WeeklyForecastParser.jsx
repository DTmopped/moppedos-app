import React from "react";
import { Button } from "@/components/ui/button.jsx";
import { useWeeklyForecastLogic } from "@/hooks/useWeeklyForecastLogic.jsx";
import ForecastHeader from "@/components/forecast/ForecastHeader.jsx";
import ForecastInputArea from "@/components/forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "@/components/forecast/ForecastResultsTable.jsx";

const WeeklyForecastParser = () => {
  const {
    passengerText,
    setPassengerText,
    captureRate,
    spendPerGuest,
    amSplit,
    handleGenerateForecast,
    forecastDataUI,
    isAdminMode,
    toggleAdminMode,
  } = useWeeklyForecastLogic();

  return (
    <div className="space-y-6">
      <ForecastHeader isAdminMode={isAdminMode} toggleAdminMode={toggleAdminMode} />

      <div className="border border-slate-700 rounded-xl bg-slate-900 shadow-md overflow-hidden">
        <div className="border-b border-slate-700 p-4 font-semibold text-white text-sm bg-slate-800">
          Weekly Passenger Data
        </div>
        <div className="p-4 space-y-4">
          <ForecastInputArea
            passengerText={passengerText}
            setPassengerText={setPassengerText}
            captureRate={captureRate}
            spendPerGuest={spendPerGuest}
            amSplit={amSplit}
          />

          <div className="flex justify-end">
            <Button onClick={handleGenerateForecast} variant="gradient">
              + Generate Forecast & Save
            </Button>
          </div>
        </div>
      </div>

      <ForecastResultsTable forecastDataUI={forecastDataUI} />
    </div>
  );
};

export default WeeklyForecastParser;

