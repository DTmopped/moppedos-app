import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "components/ui/card.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "components/ui/table.jsx";
import { motion } from "framer-motion";

const ForecastResultsTable = ({ forecastDataUI }) => {
  if (!forecastDataUI || forecastDataUI.length === 0) return null;

  const getVarianceBar = (forecast, actual) => {
    if (actual == null || forecast == null) return null;
    const diff = actual - forecast;
    const percent = Math.abs(diff / forecast) * 100;
    const isOver = diff >= 0;
    const barColor = actual === forecast ? 'bg-slate-400' : isOver ? 'bg-green-500' : 'bg-red-500';
    return (
      <div className="w-full bg-slate-600/30 h-2 rounded">
        <div
          className={`h-2 rounded ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
        <CardHeader>
          <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
            Forecast Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-slate-700 shadow-inner">
            <Table>
              <TableHeader className="bg-slate-700/50">
                <TableRow className="border-slate-600">
                  <TableHead className="min-w-[100px] text-slate-300">Day</TableHead>
                  <TableHead className="min-w-[100px] text-slate-300">Date</TableHead>
                  <TableHead className="text-right min-w-[100px] text-slate-300">Passengers</TableHead>
                  <TableHead className="text-right min-w-[100px] text-slate-300">Guests (8%)</TableHead>
                  <TableHead className="text-right min-w-[100px] text-slate-300">Sales ($15)</TableHead>
                  <TableHead className="text-right min-w-[100px] text-slate-300">Food (30%)</TableHead>
                  <TableHead className="text-right min-w-[100px] text-slate-300">Bev (20%)</TableHead>
                  <TableHead className="text-right min-w-[100px] text-slate-300">Labor (14%)</TableHead>
                  <TableHead className="text-right min-w-[120px] text-slate-300">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastDataUI.map((row, index) => (
                  <motion.tr
                    key={row.date + row.day + index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-slate-700/60 transition-colors border-b border-slate-700 last:border-b-0 ${row.isTotal ? "bg-slate-700/80 font-semibold" : ""}`}
                  >
                    <TableCell className={`font-medium ${row.isTotal ? "text-pink-400" : "text-slate-200"}`}>
                      {row.day}
                    </TableCell>
                    <TableCell className="text-slate-300 tabular-nums">
                      {row.date || ''}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 tabular-nums">
                      {row.pax?.toLocaleString?.() ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 tabular-nums">
                      {row.guests != null ? Math.round(row.guests) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-green-400 tabular-nums">
                      {row.sales != null ? row.sales.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-orange-400 tabular-nums">
                      {row.food != null ? row.food.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-sky-400 tabular-nums">
                      {row.bev != null ? row.bev.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-purple-400 tabular-nums">
                      {row.labor != null ? row.labor.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getVarianceBar(row.salesForecasted, row.salesActual)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ForecastResultsTable;

