import React from "react";
import { cn } from "@/lib/utils.js";

// Read current admin-set cost percentages from localStorage
const getCostGoals = () => ({
  food: Number(localStorage.getItem("foodCostGoal")) || 0.3,
  bev: Number(localStorage.getItem("bevCostGoal")) || 0.2,
  labor: Number(localStorage.getItem("laborCostGoal")) || 0.14,
});

const ForecastResultsTable = ({ forecastDataUI }) => {
  if (!forecastDataUI || forecastDataUI.length === 0) return null;

  const { food, bev, labor } = getCostGoals();
  const foodLabel = `Food (${(food * 100).toFixed(0)}%)`;
  const bevLabel = `Bev (${(bev * 100).toFixed(0)}%)`;
  const laborLabel = `Labor (${(labor * 100).toFixed(0)}%)`;

  return (
    <div className="mt-8">
      <h3 className="text-pink-400 font-semibold text-lg mb-3">Forecast Results</h3>
      <div className="overflow-x-auto rounded border border-slate-700">
        <table className="min-w-full text-sm bg-slate-900 text-white">
          <thead className="bg-slate-800 text-slate-300 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left">Day</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Passengers</th>
              <th className="px-3 py-2 text-right">Guests (%)</th>
              <th className="px-3 py-2 text-right">AM / PM Split</th>
              <th className="px-3 py-2 text-right">Sales ($)</th>
              <th className="px-3 py-2 text-right">{foodLabel}</th>
              <th className="px-3 py-2 text-right">{bevLabel}</th>
              <th className="px-3 py-2 text-right">{laborLabel}</th>
              <th className="px-3 py-2 text-right">Variance</th>
            </tr>
          </thead>
          <tbody>
            {forecastDataUI.map((row, idx) => (
              <tr key={idx} className={row.isTotal ? "bg-slate-800 font-semibold text-pink-200" : "border-t border-slate-700"}>
                <td className="px-3 py-2">{row.day}</td>
                <td className="px-3 py-2">{row.date}</td>
                <td className="px-3 py-2 text-right">{row.pax.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.guests).toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-yellow-300">
                  {row.amGuests && row.pmGuests
                    ? `${row.amGuests.toLocaleString()} / ${row.pmGuests.toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right text-green-400">${row.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-3 py-2 text-right text-orange-300">${row.food.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                <td className="px-3 py-2 text-right text-cyan-300">${row.bev.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                <td className="px-3 py-2 text-right text-purple-300">${row.labor.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                <td className="px-3 py-2 text-right text-slate-400">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastResultsTable;

