import React from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.jsx";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const foodTarget = 0.30;
const bevTarget = 0.20;
const laborTarget = 0.14;

const getClass = (pct, target) => {
  if (isNaN(pct)) return "";
  return pct > target
    ? "bg-red-200 text-red-700"
    : "bg-green-200 text-green-700";
};

const ForecastActualTable = ({ combinedData, today }) => {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-300 shadow-inner">
      <Table>
        <TableHeader className="bg-slate-100">
          <TableRow className="border-slate-200 text-slate-600">
            <TableHead className="min-w-[100px]">Date</TableHead>
            <TableHead className="text-right min-w-[150px]">Forecasted Sales ($)</TableHead>
            <TableHead className="text-right min-w-[150px]">Actual Sales ($)</TableHead>
            <TableHead className="text-right min-w-[120px]">Food Cost %</TableHead>
            <TableHead className="text-right min-w-[120px]">Bev Cost %</TableHead>
            <TableHead className="text-right min-w-[120px]">Labor Cost %</TableHead>
            <TableHead className="min-w-[180px]">Alerts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedData.map((day, index) => {
            let alerts = [];
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
                <TableCell className="font-medium">{day.date}</TableCell>
                <TableCell className="text-right">{day.forecastSales.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {day.hasActuals ? day.actualSales.toFixed(2) : <span className="text-slate-400">N/A</span>}
                </TableCell>
                <TableCell className={`text-right font-semibold ${day.hasActuals ? getClass(day.foodPct, foodTarget) : ''}`}>
                  {day.hasActuals ? `${(day.foodPct * 100).toFixed(1)}%` : <span className="text-slate-400">N/A</span>}
                </TableCell>
                <TableCell className={`text-right font-semibold ${day.hasActuals ? getClass(day.bevPct, bevTarget) : ''}`}>
                  {day.hasActuals ? `${(day.bevPct * 100).toFixed(1)}%` : <span className="text-slate-400">N/A</span>}
                </TableCell>
                <TableCell className={`text-right font-semibold ${day.hasActuals ? getClass(day.laborPct, laborTarget) : ''}`}>
                  {day.hasActuals ? `${(day.laborPct * 100).toFixed(1)}%` : <span className="text-slate-400">N/A</span>}
                </TableCell>
                <TableCell className={`font-semibold`}>
                  {!day.hasActuals ? (
                    <span className="flex items-center text-slate-400">
                      <AlertTriangle size={16} className="mr-1.5 flex-shrink-0" /> No Actuals
                    </span>
                  ) : alerts.length === 0 ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 size={16} className="mr-1.5 flex-shrink-0" /> On Target
                    </span>
                  ) : (
                    alerts.map((alert, i) => (
                      <span key={i} className="flex items-center text-red-600 mb-1 last:mb-0">
                        <AlertTriangle size={16} className="mr-1.5 flex-shrink-0" /> {alert}
                      </span>
                    ))
                  )}
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ForecastActualTable;
