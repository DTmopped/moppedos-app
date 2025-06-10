import React from "react";
import ReactDOMServer from 'react-dom/server';
import { motion } from "framer-motion";
import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { BarChartHorizontalBig, Printer, AlertTriangle, CheckCircle2, FileDown } from "lucide-react";
import { useData } from "../contexts/DataContext";
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

  const handlePrint = () => {
    const printDate = new Date();
    const targets = { foodTarget, bevTarget, laborTarget };

    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableFvaDashboard 
        combinedData={combinedData} 
        printDate={printDate}
        targets={targets}
      />
    );

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FVA Dashboard - Print</title>
        </head>
        <body>
          ${printableComponentHtml}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();

    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  const exportToCSV = () => {
    const rows = [
      ["Date", "Forecasted Sales", "Actual Sales", "Food Cost %", "Bev Cost %", "Labor Cost %", "Alerts"],
      ...combinedData.map(d => {
        const food = d.hasActuals ? `${(d.foodPct * 100).toFixed(1)}%` : "N/A";
        const bev = d.hasActuals ? `${(d.bevPct * 100).toFixed(1)}%` : "N/A";
        const labor = d.hasActuals ? `${(d.laborPct * 100).toFixed(1)}%` : "N/A";
        const alert = d.hasActuals
          ? [
              d.foodPct > foodTarget ? "Food Over" : null,
              d.bevPct > bevTarget ? "Bev Over" : null,
              d.laborPct > laborTarget ? "Labor Over" : null,
            ].filter(Boolean).join(", ") || "On Target"
          : "No Actuals";
        return [d.date, d.forecastSales, d.hasActuals ? d.actualSales : "N/A", food, bev, labor, alert];
      })
    ];
    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `fva-dashboard-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="flex space-x-2">
            <Button onClick={handlePrint} variant="outline" className="border-indigo-500 text-indigo-500 hover:bg-indigo-100">
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-100">
              <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
          <p className="text-xs text-slate-400 mt-4 italic">
            Note: This dashboard sources data from the central data store. Future enhancements could involve integrating data from other parser tools within the application.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;

import React from "react";
import ReactDOMServer from 'react-dom/server';
import { motion } from "framer-motion";
import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { BarChartHorizontalBig, Printer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useData } from "../contexts/DataContext";
import PrintableFvaDashboard from "./dashboard/PrintableFvaDashboard.jsx";

const foodTarget = 0.30;
const bevTarget = 0.20;
const laborTarget = 0.14;

const FvaDashboard = () => {
  const { forecastData, actualData } = useData();

  const getClass = (pct, target) => {
    if (isNaN(pct)) return "";
    return pct > target ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300";
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

  const handlePrint = () => {
    const printDate = new Date();
    const targets = { foodTarget, bevTarget, laborTarget };
    
    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableFvaDashboard 
        combinedData={combinedData} 
        printDate={printDate}
        targets={targets}
      />
    );

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';

    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FVA Dashboard - Print</title>
        </head>
        <body>
          ${printableComponentHtml}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg">
              <BarChartHorizontalBig className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Forecast vs. Actual Dashboard</CardTitle>
              <CardDescription className="text-slate-400">
                Daily comparison of forecasted and actual performance metrics.
              </CardDescription>
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button onClick={handlePrint} variant="outline" className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors no-print">
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-slate-700 shadow-inner">
            <Table>
              <TableHeader className="bg-slate-700/50">
                <TableRow className="border-slate-600">
                  <TableHead className="min-w-[100px] text-slate-300">Date</TableHead>
                  <TableHead className="text-right min-w-[150px] text-slate-300">Forecasted Sales ($)</TableHead>
                  <TableHead className="text-right min-w-[150px] text-slate-300">Actual Sales ($)</TableHead>
                  <TableHead className="text-right min-w-[120px] text-slate-300">Food Cost %</TableHead>
                  <TableHead className="text-right min-w-[120px] text-slate-300">Bev Cost %</TableHead>
                  <TableHead className="text-right min-w-[120px] text-slate-300">Labor Cost %</TableHead>
                  <TableHead className="min-w-[180px] text-slate-300">Alerts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinedData.map((day, index) => {
                  let alerts = [];
                  if (day.hasActuals) {
                    if (day.foodPct > foodTarget) alerts.push({ text: "Food Over", type: "error" });
                    if (day.bevPct > bevTarget) alerts.push({ text: "Bev Over", type: "error" });
                    if (day.laborPct > laborTarget) alerts.push({ text: "Labor Over", type: "error" });
                  }

                  return (
                    <motion.tr
                      key={day.date + index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/60 transition-colors"
                    >
                      <TableCell className="font-medium text-slate-200">{day.date}</TableCell>
                      <TableCell className="text-right text-slate-300">{day.forecastSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-slate-300">
                        {day.hasActuals ? day.actualSales.toFixed(2) : <span className="text-slate-500">N/A</span>}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${day.hasActuals ? getClass(day.foodPct, foodTarget) : ''}`}>
                        {day.hasActuals ? `${(day.foodPct * 100).toFixed(1)}%` : <span className="text-slate-500">N/A</span>}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${day.hasActuals ? getClass(day.bevPct, bevTarget) : ''}`}>
                        {day.hasActuals ? `${(day.bevPct * 100).toFixed(1)}%` : <span className="text-slate-500">N/A</span>}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${day.hasActuals ? getClass(day.laborPct, laborTarget) : ''}`}>
                        {day.hasActuals ? `${(day.laborPct * 100).toFixed(1)}%` : <span className="text-slate-500">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {!day.hasActuals ? (
                           <span className="flex items-center text-slate-500">
                             <AlertTriangle size={16} className="mr-1.5 flex-shrink-0" /> No Actuals
                           </span>
                        ) : alerts.length === 0 ? (
                          <span className="flex items-center text-green-400">
                            <CheckCircle2 size={16} className="mr-1.5 flex-shrink-0" /> On Target
                          </span>
                        ) : (
                          alerts.map((alert, i) => (
                            <span key={i} className="flex items-center text-red-400 mb-1 last:mb-0">
                              <AlertTriangle size={16} className="mr-1.5 flex-shrink-0" /> {alert.text}
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
          <p className="text-xs text-slate-500 mt-4 italic">
            Note: This dashboard sources data from the central data store. Future enhancements could involve integrating data from other parser tools within the application.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;
