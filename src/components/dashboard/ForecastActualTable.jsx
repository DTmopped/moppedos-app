import React from "react";

const ForecastActualTable = ({ combinedData, foodTarget, bevTarget, laborTarget }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm text-slate-800">
        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-300">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-right">Forecasted Sales ($)</th>
            <th className="p-2 text-right">Actual Sales ($)</th>
            <th className="p-2 text-right">Food Cost %</th>
            <th className="p-2 text-right">Bev Cost %</th>
            <th className="p-2 text-right">Labor Cost %</th>
            <th className="p-2 text-left">Alerts</th>
          </tr>
        </thead>
        <tbody>
          {combinedData.map((row, idx) => {
            const foodClass = row.hasActuals && row.foodPct > foodTarget
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700";

            const bevClass = row.hasActuals && row.bevPct > bevTarget
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700";

            const laborClass = row.hasActuals && row.laborPct > laborTarget
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700";

            const alert = row.hasActuals
              ? [
                  row.foodPct > foodTarget ? "Food Over" : null,
                  row.bevPct > bevTarget ? "Bev Over" : null,
                  row.laborPct > laborTarget ? "Labor Over" : null
                ].filter(Boolean).join(", ") || "On Target"
              : "No Actuals";

            return (
              <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-2">{row.date}</td>
                <td className="p-2 text-right">{row.forecastSales?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="p-2 text-right">
                  {row.hasActuals ? row.actualSales?.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "N/A"}
                </td>
                <td className={`p-2 text-right ${row.hasActuals ? foodClass : "text-slate-400"}`}>
                  {row.hasActuals ? `${(row.foodPct * 100).toFixed(1)}%` : "N/A"}
                </td>
                <td className={`p-2 text-right ${row.hasActuals ? bevClass : "text-slate-400"}`}>
                  {row.hasActuals ? `${(row.bevPct * 100).toFixed(1)}%` : "N/A"}
                </td>
                <td className={`p-2 text-right ${row.hasActuals ? laborClass : "text-slate-400"}`}>
                  {row.hasActuals ? `${(row.laborPct * 100).toFixed(1)}%` : "N/A"}
                </td>
                <td className="p-2 text-left text-sm italic text-slate-500">{alert}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ForecastActualTable;
