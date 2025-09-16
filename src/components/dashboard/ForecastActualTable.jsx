import React from "react";
import { cn } from "@/lib/utils";

const getCostTargets = () => ({
  food: parseFloat(localStorage.getItem("foodCostGoal")) || 0.3,
  bev: parseFloat(localStorage.getItem("bevCostGoal")) || 0.2,
  labor: parseFloat(localStorage.getItem("laborCostGoal")) || 0.14,
});

const formatCurrency = (val) => (val !== null ? `$${val.toLocaleString()}` : "N/A");
const formatPercent = (val) => (val !== null ? `${val.toFixed(1)}%` : "N/A");

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
            <th className="px-3 py-2">Variance ($)</th>
            <th className="px-3 py-2">Variance %</th>
            <th className="px-3 py-2">Food Cost %</th>
            <th className="px-3 py-2">Bev Cost %</th>
            <th className="px-3 py-2">Labor Cost %</th>
            <th className="px-3 py-2">Alerts</th>
          </tr>
        </thead>
        <tbody>
          {combinedData.map((entry, index) => {
            const { date, forecastSales, actualSales, hasActuals, foodPct, bevPct, laborPct } = entry;

            const dollarVar = hasActuals ? actualSales - forecastSales : null;
            const pctVar = hasActuals && forecastSales ? ((actualSales - forecastSales) / forecastSales) * 100 : null;

            const foodClass = hasActuals ? cn(
              "font-semibold",
              foodPct > foodTarget ? "text-red-500 bg-red-100" : "text-green-600 bg-green-100"
            ) : "text-slate-500";

            const bevClass = hasActuals ? cn(
              "font-semibold",
              bevPct > bevTarget ? "text-red-500 bg-red-100" : "text-green-600 bg-green-100"
            ) : "text-slate-500";

            const laborClass = hasActuals ? cn(
              "font-semibold",
              laborPct > laborTarget ? "text-red-500 bg-red-100" : "text-green-600 bg-green-100"
            ) : "text-slate-500";

            const varianceClass = (val) =>
              val === null ? "text-slate-500" : val < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold";

            const alert = hasActuals
              ? [
                  foodPct > foodTarget ? "Food Over" : null,
                  bevPct > bevTarget ? "Bev Over" : null,
                  laborPct > laborTarget ? "Labor Over" : null
                ].filter(Boolean).join(", ") || "On Target"
              : "No Actuals";

            return (
              <tr key={index} className="border-t border-slate-200">
                <td className="px-3 py-2">{date ? new Date(date).toLocaleDateString("en-US") : "—"}</td>
                <td className="px-3 py-2">{formatCurrency(forecastSales)}</td>
                <td className="px-3 py-2">{hasActuals ? formatCurrency(actualSales) : "N/A"}</td>
                <td className={`px-3 py-2 ${varianceClass(dollarVar)}`}>{formatCurrency(dollarVar)}</td>
                <td className={`px-3 py-2 ${varianceClass(pctVar)}`}>{formatPercent(pctVar)}</td>
                <td className="px-3 py-2">
                  {hasActuals ? <span className={foodClass}>{(foodPct * 100).toFixed(1)}%</span> : "N/A"}
                </td>
                <td className="px-3 py-2">
                  {hasActuals ? <span className={bevClass}>{(bevPct * 100).toFixed(1)}%</span> : "N/A"}
                </td>
                <td className="px-3 py-2">
                  {hasActuals ? <span className={laborClass}>{(laborPct * 100).toFixed(1)}%</span> : "N/A"}
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
