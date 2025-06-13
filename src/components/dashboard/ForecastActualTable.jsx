import React from "react";
import { cn } from "@/lib/utils";

const getCostTargets = () => ({
  food: parseFloat(localStorage.getItem("foodCostGoal")) || 0.3,
  bev: parseFloat(localStorage.getItem("bevCostGoal")) || 0.2,
  labor: parseFloat(localStorage.getItem("laborCostGoal")) || 0.14,
});

const ForecastActualTable = ({ combinedData }) => {
  const { food: foodTarget, bev: bevTarget, labor: laborTarget } = getCostTargets();

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full text-sm text-left border border-slate-300">
        <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Forecasted Sales ($)</th>
            <th className="px-3 py-2">Actual Sales ($)</th>
            <th className="px-3 py-2">Food Cost %</th>
            <th className="px-3 py-2">Bev Cost %</th>
            <th className="px-3 py-2">Labor Cost %</th>
            <th className="px-3 py-2">Alerts</th>
          </tr>
        </thead>
        <tbody>
          {combinedData.map((entry, index) => {
            const food = entry.hasActuals ? entry.foodPct : null;
            const bev = entry.hasActuals ? entry.bevPct : null;
            const labor = entry.hasActuals ? entry.laborPct : null;

            const foodClass = food !== null ? cn(
              "font-semibold",
              food > foodTarget ? "text-red-500 bg-red-100" : "text-green-600 bg-green-100"
            ) : "text-slate-500";
            const bevClass = bev !== null ? cn(
              "font-semibold",
              bev > bevTarget ? "text-red-500 bg-red-100" : "text-green-600 bg-green-100"
            ) : "text-slate-500";
            const laborClass = labor !== null ? cn(
              "font-semibold",
              labor > laborTarget ? "text-red-500 bg-red-100" : "text-green-600 bg-green-100"
            ) : "text-slate-500";

            const alert = entry.hasActuals
              ? [
                  food > foodTarget ? "Food Over" : null,
                  bev > bevTarget ? "Bev Over" : null,
                  labor > laborTarget ? "Labor Over" : null
                ].filter(Boolean).join(", ") || "On Target"
              : "No Actuals";

            return (
              <tr key={index} className="border-t border-slate-200">
                <td className="px-3 py-2">{entry.date}</td>
                <td className="px-3 py-2">{entry.forecastSales?.toLocaleString()}</td>
                <td className="px-3 py-2">{entry.hasActuals ? entry.actualSales?.toLocaleString() : "N/A"}</td>
                <td className="px-3 py-2">
                  {food !== null ? <span className={foodClass}>{(food * 100).toFixed(1)}%</span> : "N/A"}
                </td>
                <td className="px-3 py-2">
                  {bev !== null ? <span className={bevClass}>{(bev * 100).toFixed(1)}%</span> : "N/A"}
                </td>
                <td className="px-3 py-2">
                  {labor !== null ? <span className={laborClass}>{(labor * 100).toFixed(1)}%</span> : "N/A"}
                </td>
                <td className="px-3 py-2 text-slate-700 text-xs">{alert}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ForecastActualTable;
