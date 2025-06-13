import React, { useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import DailyShiftPrepGuideHeader from "./DailyShiftPrepGuideHeader";
import DayPrepCard from "./DayPrepCard";

const DailyShiftPrepGuide = () => {
  const { forecastData, prepMenu } = useData();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Find today's forecast
  const todayForecast = forecastData.find(f => f.date === today);

  const adjustedGuests = todayForecast ? todayForecast.guests : 0;

  // Create shift prep data (morning vs evening split logic can be added here)
  const amPrepItems = useMemo(() => {
    if (!prepMenu || !Array.isArray(prepMenu)) return [];
    return prepMenu.map(item => ({
      ...item,
      qty: "N/A",
      shift: "AM",
    }));
  }, [prepMenu]);

  if (!forecastData || forecastData.length === 0) {
    return <div className="p-6 text-center text-red-600 font-semibold">🚫 No forecast data available. Generate a forecast first.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <DailyShiftPrepGuideHeader adjustedGuests={adjustedGuests} />
      <div className="text-xl font-semibold text-orange-600 border-b pb-1 border-slate-300">AM Shift Prep</div>
      <div className="grid gap-2">
        {amPrepItems.map((item, index) => (
          <DayPrepCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default DailyShiftPrepGuide;
