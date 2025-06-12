import React from "react";
import ReactDOMServer from 'react-dom/server';
import { motion } from "framer-motion";
import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { BarChartHorizontalBig, Printer, FileDown } from "lucide-react";
import { useData } from "../contexts/DataContext";
import ForecastActualTable from "./dashboard/ForecastActualTable.jsx"
import PrintableFvaDashboard from "./dashboard/PrintableFvaDashboard.jsx";

const foodTarget = 0.30;
const bevTarget = 0.20;
const laborTarget = 0.14;

const FvaDashboard = () => {
  const { forecastData, actualData } = useData();

  const combinedData = forecastData.map(forecast => {
    const actual = actualData.find(a => a.date === forecast.date);
    if (actual) {
      const foodPct = actual.actualSales > 0 ? actual.foodCost / actual.actualSales : 0;
      const bevPct = actual.actualSales > 0 ? actual.beverageCost / actual.actualSales : 0;
      const laborPct = actual.actualSales > 0 ? actual.laborCost / actual.actualSales : 0;
      return { ...forecast, ...actual, foodPct, bevPct, laborPct, hasActuals: true };
    }
    return {
      ...forecast,
      actualSales: 0,
      foodCost: 0,
      beverageCost: 0,
      laborCost: 0,
      foodPct: 0,
      bevPct: 0,
      laborPct: 0,
      hasActuals: false
    };
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
        <head><title>FVA Dashboard - Print</title></head>
        <body>${printableComponentHtml}</body>
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
        return [
          d.date,
          d.forecastSales,
          d.hasActuals ? d.actualSales : "N/A",
          food,
          bev,
          labor,
          alert
        ];
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
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                Forecast vs. Actual Dashboard
              </CardTitle>
              <CardDescription className="text-slate-500">
                Daily comparison of forecasted and actual performance metrics.
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-indigo-500 text-indigo-500 hover:bg-indigo-100"
            >
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-100"
            >
              <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ForecastActualTable combinedData={combinedData} />
          <p className="text-xs text-slate-400 mt-4 italic">
            Note: This dashboard sources data from the central data store.
            Future enhancements could involve integrating data from other parser tools within the application.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;
