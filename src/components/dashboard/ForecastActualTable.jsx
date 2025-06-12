import React from "react";
import ReactDOMServer from 'react-dom/server';
import { motion } from "framer-motion";
import { Button } from "../ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.jsx";
import { BarChartHorizontalBig, Printer, AlertTriangle, CheckCircle2, FileDown } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import PrintableFvaDashboard from "./dashboard/PrintableFvaDashboard.jsx";

const foodTarget = 0.30;
const bevTarget = 0.20;
const laborTarget = 0.14;

const FvaDashboard = () => {
  const { forecastData, actualData } = useData();

  const getClass = (pct, target) => {
    if (isNaN(pct)) return "";
    return pct > target ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700";
  };

  const combinedData = forecastData.map(forecast => {
    const actual = actualData.find(a => a.date === forecast.date);
    if (actual) {
      const foodPct = actual.actualSales > 0 ? actual.foodCost / actual.actualSales : 0;
      const bevPct = actual.actualSales > 0 ? actual.beverageCost / actual.actualSales : 0;
      const laborPct = actual.actualSales > 0 ? actual.laborCost / actual.actualSales : 0;
      return { ...forecast, ...actual, foodPct, bevPct, laborPct, hasActuals: true };
    }
    return { ...forecast, actualSales: 0, foodCost: 0, beverageCost: 0, laborCost: 0, foodPct: 0, bevPct: 0, laborPct: 0, hasActuals: false };
  });

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl bg-white text-slate-800 border border-slate-200">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg">
              <BarChartHorizontalBig className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Forecast vs. Actual Dashboard</CardTitle>
              <CardDescription className="text-slate-500">
                Daily comparison of forecasted and actual performance metrics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ForecastActualTable;
