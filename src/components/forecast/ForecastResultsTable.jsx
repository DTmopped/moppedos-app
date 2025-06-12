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
                      {row.pax.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 tabular-nums">
                      {Math.round(row.guests)}
                    </TableCell>
                    <TableCell className="text-right text-green-400 tabular-nums">
                      {row.sales.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-orange-400 tabular-nums">
                      {row.food.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sky-400 tabular-nums">
                      {row.bev.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-purple-400 tabular-nums">
                      {row.labor.toFixed(2)}
                    </TableCell>
                  </motion.tr>
                ))}

                {/* ✅ MTD + EOM Summary Row */}
                {(() => {
                  const today = new Date();
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();

                  const rowsThisMonth = forecastDataUI.filter(row => {
                    const rowDate = new Date(row.date);
                    return rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear;
                  });

                  const mtdRows = rowsThisMonth.filter(row => new Date(row.date) <= today);
                  const actualRows = mtdRows.filter(row => row.sales > 0);

                  const mtdForecast = mtdRows.reduce((acc, row) => acc + row.sales, 0);
                  const mtdFood = actualRows.reduce((acc, row) => acc + row.food, 0);
                  const mtdBev = actualRows.reduce((acc, row) => acc + row.bev, 0);
                  const mtdLabor = actualRows.reduce((acc, row) => acc + row.labor, 0);
                  const mtdActuals = mtdFood + mtdBev + mtdLabor;

                  const avg = (val, len) => (len > 0 ? val / len : 0);

                  const eomForecast = rowsThisMonth.reduce((acc, row) => acc + row.sales, 0);
                  const daysWithActuals = actualRows.length;
                  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  const projectedEOM = daysWithActuals > 0 ? (mtdActuals / daysWithActuals) * totalDaysInMonth : 0;
                  const varianceProjection = projectedEOM - eomForecast;

                  return (
                    <TableRow className="bg-slate-900/70 font-semibold border-t border-slate-600">
                      <TableCell colSpan={2} className="text-slate-200">MTD Summary</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right text-green-300 tabular-nums">
                        {mtdActuals.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-orange-300 tabular-nums">
                        {avg(mtdFood, daysWithActuals).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sky-300 tabular-nums">
                        {avg(mtdBev, daysWithActuals).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-purple-300 tabular-nums">
                        {avg(mtdLabor, daysWithActuals).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ForecastResultsTable;

