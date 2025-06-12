import React from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.jsx";

const ForecastActualTable = ({ combinedData }) => {
  const foodTarget = 0.30;
  const bevTarget = 0.20;
  const laborTarget = 0.14;

  const getClass = (pct, target) => {
    if (isNaN(pct)) return "";
    return pct > target ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700";
  };

  const today = new Date().toISOString().split('T')[0];

  const totals = combinedData.reduce(
    (acc, d) => {
      acc.forecastSales += d.forecastSales || 0;
      if (d.hasActuals) {
        acc.actualSales += d.actualSales;
        acc.foodPct += d.foodPct;
        acc.bevPct += d.bevPct;
        acc.laborPct += d.laborPct;
        acc.count++;
        if (d.foodPct > foodTarget) acc.foodOver++;
        if (d.bevPct > bevTarget) acc.bevOver++;
        if (d.laborPct > laborTarget) acc.laborOver++;
      }
      return acc;
    },
    { forecastSales: 0, actualSales: 0, foodPct: 0, bevPct: 0, laborPct: 0, count: 0, foodOver: 0, bevOver: 0, laborOver: 0 }
  );

  const avgFood = totals.count > 0 ? totals.foodPct / totals.count : 0;
  const avgBev = totals.count > 0 ? totals.bevPct / totals.count : 0;
  const avgLabor = totals.count > 0 ? totals.laborPct / totals.count : 0;

  return (
    <div className="overflow-x-auto rounded-md border border-slate-300 shadow-inner">
      <Table>
        <TableHeader className="bg-slate-100">
          <TableRow className="border-slate-200 text-slate-600">
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Forecasted Sales ($)</TableHead>
            <TableHead className="text-right">Actual Sales ($)</TableHead>
            <TableHead className="text-right">Food Cost %</TableHead>
            <TableHead className="text-right">Bev Cost %</TableHead>
            <TableHead className="text-right">Labor Cost %</TableHead>
            <TableHead>Alerts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedData.map((day, index) => {
            const alerts = [];
            if (day.hasActuals) {
              if (day.foodPct > foodTarget) alerts.push("Food Over");
              if (day.bevPct > bevTarget) alerts.push("Bev Over");
              if (day.laborPct > laborTarget) alerts.push("Labor Over");
            }
            const isToday = day.date === today;
            return (
              <motion.tr
                key={day.date + index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`border-b border-slate-200 text-sm hover:bg-slate-50 transition-colors ${isToday ? 'bg-yellow-100' : ''}`}
              >
                <TableCell>{day.date}</TableCell>
                <TableCell className="text-right">{day.forecastSales.toFixed(2)}</TableCell>
                <TableCell className="text-right">{day.hasActuals ? day.actualSales.toFixed(2) : "N/A"}</TableCell>
                <TableCell className={`text-right ${getClass(day.foodPct, foodTarget)}`}>{day.hasActuals ? `${(day.foodPct * 100).toFixed(1)}%` : "N/A"}</TableCell>
                <TableCell className={`text-right ${getClass(day.bevPct, bevTarget)}`}>{day.hasActuals ? `${(day.bevPct * 100).toFixed(1)}%` : "N/A"}</TableCell>
                <TableCell className={`text-right ${getClass(day.laborPct, laborTarget)}`}>{day.hasActuals ? `${(day.laborPct * 100).toFixed(1)}%` : "N/A"}</TableCell>
                <TableCell>
                  {!day.hasActuals ? "No Actuals" : alerts.length === 0 ? "On Target" : alerts.join(", ")}
                </TableCell>
              </motion.tr>
            );
          })}
          <TableRow className="font-semibold bg-slate-200 text-slate-800">
            <TableCell>Totals / Avg</TableCell>
            <TableCell className="text-right">{totals.forecastSales.toFixed(2)}</TableCell>
            <TableCell className="text-right">{totals.actualSales.toFixed(2)}</TableCell>
            <TableCell className={`text-right ${getClass(avgFood, foodTarget)}`}>{(avgFood * 100).toFixed(1)}%</TableCell>
            <TableCell className={`text-right ${getClass(avgBev, bevTarget)}`}>{(avgBev * 100).toFixed(1)}%</TableCell>
            <TableCell className={`text-right ${getClass(avgLabor, laborTarget)}`}>{(avgLabor * 100).toFixed(1)}%</TableCell>
            <TableCell>{`Food Over: ${totals.foodOver}, Bev Over: ${totals.bevOver}, Labor Over: ${totals.laborOver}`}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ForecastActualTable;
