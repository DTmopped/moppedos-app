import React from "react";

const PrintableBriefingSheet = ({
  date,
  manager,
  lunch,
  dinner,
  forecastedSales,
  weatherIcon,
  weatherConditions,
  weatherTempHigh,
  weatherTempLow,
  actualSales,
  varianceNotes,
  shoutout,
  reminders,
  mindset,
  foodItems,
  foodImage,
  beverageItems,
  beverageImage,
  events,
  repairNotes,
  quote,
  lastUpdated,
}) => {
  const displayValue = (val, suffix = "") =>
    val && val.toString().trim() !== "" ? `${val}${suffix}` : "—";

  return (
    <div
      id="briefing-content"
      className="bg-white p-8 font-sans text-black print:p-4 w-full max-w-[850px] mx-auto"
    >
      <h1 className="text-3xl font-bold text-center mb-2">
        📋 Daily Briefing Sheet
      </h1>
      <p className="text-center text-sm mb-6 text-muted-foreground">
        🌟 Align the team • 📈 Track progress • 💬 Share wins
      </p>

      <div className="flex justify-between text-sm mb-6">
        <p><strong>Date:</strong> {displayValue(date)}</p>
        <p><strong>Manager:</strong> {displayValue(manager)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 break-inside-avoid">
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">📊 Today’s Forecast</h2>
          <p><strong>🌞 Lunch:</strong> {displayValue(lunch, " guests")}</p>
          <p><strong>🌙 Dinner:</strong> {displayValue(dinner, " guests")}</p>
          <p>
            <strong>💰 Forecasted Sales:</strong>{" "}
            {forecastedSales
              ? `$${parseFloat(forecastedSales).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}`
              : "—"}
          </p>
          {(weatherConditions || weatherTempHigh || weatherTempLow) && (
            <div className="bg-blue-50 mt-3 border border-blue-200 p-2 rounded-md text-sm">
              {weatherIcon && <span>{weatherIcon} </span>}
              <strong>{weatherConditions}</strong>, High:{" "}
              {weatherTempHigh ? `${weatherTempHigh}°F` : "—"} | Low:{" "}
              {weatherTempLow ? `${weatherTempLow}°F` : "—"}
            </div>
          )}
        </div>

        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">📅 Yesterday’s Recap</h2>
          <p>
            <strong>Actual Sales:</strong>{" "}
            {displayValue(actualSales, "$")}
          </p>
          <p>
            <strong>⚠️ Variance Notes:</strong> {displayValue(varianceNotes)}
          </p>
        </div>
      </div>

      {quote && (
        <div className="bg-gray-100 rounded-lg shadow-sm p-4 text-center italic mb-6 break-inside-avoid">
          ✨ {quote}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6 break-inside-avoid">
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">🎉 Shout-Out</h2>
          <p>{displayValue(shoutout)}</p>
        </div>
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">📣 Reminders</h2>
          <p>{displayValue(reminders)}</p>
        </div>
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">🎯 Goals & Mindset</h2>
          <p>{displayValue(mindset)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 break-inside-avoid">
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">🥦 Food Items</h2>
          <p>{displayValue(foodItems)}</p>
          {foodImage && (
            <img
              src={foodImage}
              alt="Food Preview"
              className="mt-2 rounded-md h-24 object-cover"
            />
          )}
        </div>
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">🥤 Beverage Items</h2>
          <p>{displayValue(beverageItems)}</p>
          {beverageImage && (
            <img
              src={beverageImage}
              alt="Beverage Preview"
              className="mt-2 rounded-md h-24 object-cover"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 break-inside-avoid">
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">📅 Events & Holidays</h2>
          <p>{displayValue(events)}</p>
        </div>
        <div className="border p-4 rounded-xl">
          <h2 className="font-semibold mb-2">🛠️ Repairs & Maintenance</h2>
          <p>{displayValue(repairNotes)}</p>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-right italic mt-4">
          🕓 Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default PrintableBriefingSheet;
