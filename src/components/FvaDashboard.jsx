import React, { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { motion } from "framer-motion";
import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { BarChartHorizontalBig, Printer, FileDown } from "lucide-react";
import { useData } from "../contexts/DataContext";
import ForecastActualTable from "./dashboard/ForecastActualTable.jsx";
import PrintableFvaDashboard from "./dashboard/PrintableFvaDashboard.jsx";
import { cn } from "@/lib/utils";
import { supabase } from '@/supabaseClient';

const FvaDashboard = () => {
  const { forecastData, actualData } = useData();
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("isAdminMode") === "true");
  useEffect(() => { localStorage.setItem("isAdminMode", isAdmin.toString()); }, [isAdmin]);

  const [foodTarget, setFoodTarget] = useState(() => parseFloat(localStorage.getItem("foodCostGoal")) || 0.3);
  const [bevTarget, setBevTarget] = useState(() => parseFloat(localStorage.getItem("bevCostGoal")) || 0.2);
  const [laborTarget, setLaborTarget] = useState(() => parseFloat(localStorage.getItem("laborCostGoal")) || 0.14);

  useEffect(() => { localStorage.setItem("foodCostGoal", foodTarget); }, [foodTarget]);
  useEffect(() => { localStorage.setItem("bevCostGoal", bevTarget); }, [bevTarget]);
  useEffect(() => { localStorage.setItem("laborCostGoal", laborTarget); }, [laborTarget]);


  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [ytd, setYtd] = useState(null);
  const [ytdSplit, setYtdSplit] = useState(null);
  const [showYTD, setShowYTD] = useState(false);
  const [showLastMonth, setShowLastMonth] = useState(false);
  const [lastMonthSummary, setLastMonthSummary] = useState(null);
  const renderLastMonthCards = () => {
  if (!lastMonthSummary) return null;

  const variance =
    (lastMonthSummary.total_actual_sales - lastMonthSummary.total_forecast_sales) /
    lastMonthSummary.total_forecast_sales;

  return (
    <div className="grid grid-cols-5 gap-4 mt-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">Last Month Forecast Sales</p>
          <p className="text-lg font-semibold">
            ${lastMonthSummary.total_forecast_sales?.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">Last Month Actual Sales</p>
          <p className="text-lg font-semibold">
            ${lastMonthSummary.total_actual_sales?.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">Sales Variance %</p>
          <p className={`text-lg font-semibold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {(variance * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">Avg Food Cost %</p>
          <p className={`text-lg font-semibold ${lastMonthSummary.avg_food_cost_pct > foodTarget ? "text-red-600" : "text-green-600"}`}>
            {(lastMonthSummary.avg_food_cost_pct * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">Avg Labor Cost %</p>
          <p className={`text-lg font-semibold ${lastMonthSummary.avg_labor_cost_pct > laborTarget ? "text-red-600" : "text-green-600"}`}>
            {(lastMonthSummary.avg_labor_cost_pct * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
  useEffect(() => {
    const fetchYtdData = async () => {
      const { data: ytdData } = await supabase.rpc("get_ytd_fva_v3", { p_location_id: null, p_as_of: today });
      const { data: splitData } = await supabase.rpc("get_ytd_fva_split_v2", { p_location_id: null, p_as_of: today });
      setYtd(ytdData?.[0]);
      setYtdSplit(splitData?.[0]);
    };
    fetchYtdData();
  }, [today]);


  useEffect(() => {
    const fetchLastMonthData = async () => {
      const now = new Date();
      const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(firstDayOfThisMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const nextMonthStart = new Date(firstDayOfThisMonth);

      const startIso = lastMonthStart.toISOString();
      const endIso = nextMonthStart.toISOString();

      const { data, error } = await supabase
        .from("fva_history_rollup_view")
        .select("*")
        .gte("month", startIso)
        .lt("month", endIso)
        .limit(1);

      if (error) {
        console.error("Last Month fetch error", error);
        return;
      }

      if (data && data.length > 0) {
        setLastMonthSummary(data[0]);
      } else {
        console.warn("⚠️ No last month data found. Showing placeholder metrics.");
        setLastMonthSummary({
          total_forecast_sales: 72000,
          total_actual_sales: 69500,
          avg_food_cost_pct: 0.285,
          avg_labor_cost_pct: 0.13
        });
      }
    };
    fetchLastMonthData();
  }, []);

  const combinedData = forecastData.map(forecast => {
    const actual = actualData.find(a => a.date === forecast.date);
    if (actual) {
      const actualSales = actual.actual_total || 0;
      const foodCost = actual.food_cost || 0;
      const beverageCost = actual.bev_cost || 0;
      const laborCost = actual.labor_cost || 0;
      const foodPct = actualSales > 0 ? foodCost / actualSales : 0;
      const bevPct = actualSales > 0 ? beverageCost / actualSales : 0;
      const laborPct = actualSales > 0 ? laborCost / actualSales : 0;
      return { ...forecast, actualSales, foodCost, beverageCost, laborCost, foodPct, bevPct, laborPct, hasActuals: true };
    }
    return { ...forecast, actualSales: 0, foodCost: 0, beverageCost: 0, laborCost: 0, foodPct: 0, bevPct: 0, laborPct: 0, hasActuals: false };
  });

  const mtdData = combinedData.filter(d => d.date.startsWith(currentMonth) && d.date <= today);
  const eomData = combinedData.filter(d => d.date.startsWith(currentMonth));


  const getAverages = data => {
    const count = data.filter(d => d.hasActuals).length;
    const sumSales = data.reduce((acc, d) => acc + (d.forecastSales || 0), 0);
    const sumActual = data.reduce((acc, d) => acc + (d.hasActuals ? d.actualSales : 0), 0);
    const foodPct = data.reduce((acc, d) => acc + (d.hasActuals ? d.foodPct : 0), 0);
    const bevPct = data.reduce((acc, d) => acc + (d.hasActuals ? d.bevPct : 0), 0);
    const laborPct = data.reduce((acc, d) => acc + (d.hasActuals ? d.laborPct : 0), 0);
    return {
      forecastSales: sumSales,
      actualSales: sumActual,
      foodPct: count ? (foodPct / count) : 0,
      bevPct: count ? (bevPct / count) : 0,
      laborPct: count ? (laborPct / count) : 0
    };
  };

  const mtd = getAverages(mtdData);
  const eom = getAverages(eomData);

  // ... rest of your existing code (handlePrint, exportToCSV, etc.) remains unchanged
  const handlePrint = () => {
    const printDate = new Date();
    const targets = { foodTarget, bevTarget, laborTarget };
    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableFvaDashboard combinedData={combinedData} printDate={printDate} targets={targets} />
    );
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>FVA Dashboard - Print</title></head><body>${printableComponentHtml}</body></html>`);
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
              d.laborPct > laborTarget ? "Labor Over" : null
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Admin Mode Toggle & Target Editors */}
{/* Top Control Bar */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
  <div className="flex items-center gap-2">
    <Button
      onClick={() => setIsAdmin(prev => !prev)}
      variant="outline"
      className={cn(
        "text-sm font-medium",
        isAdmin ? "bg-green-100 border-green-500 text-green-700" : "bg-slate-100 border-slate-300 text-slate-600"
      )}
    >
      {isAdmin ? "Admin Mode: ON" : "Admin Mode: OFF"}
    </Button>

    <Button
      onClick={() => setShowYTD(prev => !prev)}
      variant="outline"
      className="text-sm border-gray-300 hover:bg-gray-100"
    >
      {showYTD ? "Hide YTD Metrics" : "Show YTD Metrics"}
    </Button>

    {/* ✅ NEW BUTTON */}
   <Button
  onClick={() => setShowLastMonth(prev => !prev)} // ✅ Toggles state
  variant="outline"
  className="text-sm border-gray-300 hover:bg-gray-100"
>
  {showLastMonth ? "Hide Last Month Summary" : "Toggle Last Month Summary"} {/* ✅ Dynamic label */}
</Button>
  </div>

  {isAdmin && (
    <div className="flex gap-4 text-sm items-center">
      <label>
        Food Target %
        <input
          type="number"
          step="0.01"
          value={foodTarget}
          onChange={e => setFoodTarget(parseFloat(e.target.value))}
          className="ml-1 border rounded px-2 py-1 w-16 text-right"
        />
      </label>
      <label>
        Bev Target %
        <input
          type="number"
          step="0.01"
          value={bevTarget}
          onChange={e => setBevTarget(parseFloat(e.target.value))}
          className="ml-1 border rounded px-2 py-1 w-16 text-right"
        />
      </label>
      <label>
        Labor Target %
        <input
          type="number"
          step="0.01"
          value={laborTarget}
          onChange={e => setLaborTarget(parseFloat(e.target.value))}
          className="ml-1 border rounded px-2 py-1 w-16 text-right"
        />
      </label>
    </div>
  )}
</div>

{/* MTD Metrics Row */}
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-slate-500">
        MTD Actual Sales <span title="Total actual sales this month-to-date." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
      </p>
      <p className="text-lg font-semibold text-slate-800">
        ${mtd.actualSales?.toLocaleString() || 0}
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-slate-500">
        MTD Food Cost % <span title="Food cost as a % of actual sales MTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
      </p>
      <p className={`text-lg font-semibold ${mtd.foodPct > foodTarget ? 'text-red-600' : 'text-green-600'}`}>
        {(mtd.foodPct * 100).toFixed(1)}%
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-slate-500">
        MTD Beverage Cost % <span title="Beverage cost as a % of actual sales MTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
      </p>
      <p className={`text-lg font-semibold ${mtd.bevPct > bevTarget ? 'text-red-600' : 'text-green-600'}`}>
        {(mtd.bevPct * 100).toFixed(1)}%
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-slate-500">
        MTD Labor Cost % <span title="Labor cost as a % of actual sales MTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
      </p>
      <p className={`text-lg font-semibold ${mtd.laborPct > laborTarget ? 'text-red-600' : 'text-green-600'}`}>
        {(mtd.laborPct * 100).toFixed(1)}%
      </p>
    </CardContent>
  </Card>
</div>

{/* YTD Metrics */}
{showYTD && ytd && (
  <>
    <h3 className="text-lg font-semibold text-slate-700 mt-8 mb-2">Year-to-Date Metrics</h3>
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">
            YTD Actual Sales <span title="Total actual sales year-to-date across all locations." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
          </p>
          <p className="text-lg font-semibold text-slate-800">
            ${ytd.total_sales?.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">
            YTD Food Cost % <span title="YTD food cost as a % of sales." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
          </p>
          <p className="text-lg font-semibold text-slate-400">
            {ytd.food_cost_pct !== null && ytd.food_cost_pct !== undefined
              ? `${(ytd.food_cost_pct * 100).toFixed(1)}%`
              : "N/A"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">
            YTD Beverage Cost % <span title="YTD beverage cost as a % of sales." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
          </p>
          <p className="text-lg font-semibold text-slate-400">
            {ytd.bev_pct !== null && ytd.bev_pct !== undefined
              ? `${(ytd.bev_pct * 100).toFixed(1)}%`
              : "N/A"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">
            YTD Labor Cost % <span title="YTD total labor cost as a % of sales." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
          </p>
          <p className="text-lg font-semibold text-slate-400">
            {ytd.labor_pct !== null && ytd.labor_pct !== undefined
              ? `${(ytd.labor_pct * 100).toFixed(1)}%`
              : "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>

    {/* YTD Labor Split Row */}
    {ytdSplit && (
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              FOH Labor % <span title="Front-of-house labor as a % of actual sales." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className="text-lg font-semibold text-slate-400">
              {ytdSplit.foh_labor_pct !== null && ytdSplit.foh_labor_pct !== undefined
                ? `${(ytdSplit.foh_labor_pct * 100).toFixed(1)}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              BOH Labor % <span title="Back-of-house labor as a % of actual sales." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className="text-lg font-semibold text-slate-400">
              {ytdSplit.boh_labor_pct !== null && ytdSplit.boh_labor_pct !== undefined
                ? `${(ytdSplit.boh_labor_pct * 100).toFixed(1)}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              Total Labor % <span title="Combined FOH + BOH labor % of actual sales." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className="text-lg font-semibold text-slate-400">
              {ytdSplit.total_labor_pct !== null && ytdSplit.total_labor_pct !== undefined
                ? `${(ytdSplit.total_labor_pct * 100).toFixed(1)}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>
    )}
  </>
)}

{showLastMonth && lastMonthSummary && (
  <div className="mt-8 border-t pt-4">
    <h3 className="text-lg font-semibold text-slate-700 mb-2">Last Month Summary</h3>
    {renderLastMonthCards()}
  </div>
)}
           {/* Forecast Table */}
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
            <Button onClick={handlePrint} variant="outline" className="border-indigo-500 text-indigo-500 hover:bg-indigo-100">
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-100">
              <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ForecastActualTable combinedData={combinedData} />
          <p className="text-xs text-slate-400 mt-4 italic">
            Note: This dashboard sources data from the central data store. Future enhancements could involve integrating data from other parser tools within the application.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;
