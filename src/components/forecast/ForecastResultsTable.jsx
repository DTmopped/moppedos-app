import React from "react";

const ForecastResultsTable = ({ forecastDataUI, captureRate, spendPerGuest, foodPct, bevPct, laborPct }) => {
  return (
    <div className="mt-6">
      <h3 className="text-pink-300 font-semibold mb-2 text-lg">Forecast Results</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm text-left table-auto border-collapse">
          <thead className="text-slate-300 bg-slate-700">
            <tr>
              <th className="p-2">Day</th>
              <th className="p-2">Date</th>
              <th className="p-2">Passengers</th>
              <th className="p-2">Guests ({captureRate}%)</th>
              <th className="p-2">Sales (${spendPerGuest})</th>
              <th className="p-2">Food ({(foodPct * 100).toFixed(0)}%)</th>
              <th className="p-2">Bev ({(bevPct * 100).toFixed(0)}%)</th>
              <th className="p-2">Labor ({(laborPct * 100).toFixed(0)}%)</th>
              <th className="p-2">Variance</th>
            </tr>
          </thead>
          <tbody>
            {forecastDataUI.map((row, idx) => (
              <tr
                key={idx}
                className={`${
                  row.isTotal ? "bg-slate-800 font-semibold border-t border-slate-600" : "bg-slate-900"
                } text-white`}
              >
                <td className="p-2">{row.day}</td>
                <td className="p-2">{row.date}</td>
                <td className="p-2">{row.pax?.toLocaleString()}</td>
                <td className="p-2">{Math.round(row.guests || 0).toLocaleString()}</td>
                <td className="p-2 text-green-400">{row.sales?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="p-2 text-orange-400">{row.food?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="p-2 text-cyan-400">{row.bev?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="p-2 text-purple-300">{row.labor?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="p-2">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastResultsTable;

