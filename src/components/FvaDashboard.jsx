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

  useEffect(() => {
    const fetchYtdData = async () => {
      const { data: ytdData } = await supabase.rpc("get_ytd_fva_v3", { p_location_id: null, p_as_of: today });
      const { data: splitData } = await supabase.rpc("get_ytd_fva_split_v2", { p_location_id: null, p_as_of: today });
      setYtd(ytdData?.[0]);
      setYtdSplit(splitData?.[0]);
    };
    fetchYtdData();
  }, [today]);

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Admin Button, MTD Metrics, Admin Targets */}
      {/* ... your existing cards */}

      {/* YTD Metrics */}
      {/* YTD Metrics */}
{ytd && (
  <div className="grid grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">YTD Actual Sales</p>
        <p className="text-lg font-semibold text-slate-800">${ytd.total_sales?.toLocaleString() || 0}</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">YTD Food Cost %</p>
        <p className="text-lg font-semibold text-green-600">{ytd.food_pct !== null ? `${(ytd.food_pct * 100).toFixed(1)}%` : "N/A"}</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">YTD Beverage Cost %</p>
        <p className="text-lg font-semibold text-blue-600">{ytd.bev_pct !== null ? `${(ytd.bev_pct * 100).toFixed(1)}%` : "N/A"}</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">YTD Labor Cost %</p>
        <p className="text-lg font-semibold text-purple-600">{ytd.labor_pct !== null ? `${(ytd.labor_pct * 100).toFixed(1)}%` : "N/A"}</p>
      </CardContent>
    </Card>
  </div>
)}

{ytdSplit && (
  <div className="grid grid-cols-3 gap-4">
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">FOH Labor %</p>
        <p className="text-lg font-semibold text-orange-600">{ytdSplit.foh_labor_pct !== null ? `${(ytdSplit.foh_labor_pct * 100).toFixed(1)}%` : "N/A"}</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">BOH Labor %</p>
        <p className="text-lg font-semibold text-yellow-600">{ytdSplit.boh_labor_pct !== null ? `${(ytdSplit.boh_labor_pct * 100).toFixed(1)}%` : "N/A"}</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">Total Labor %</p>
        <p className="text-lg font-semibold text-purple-700">{ytdSplit.total_labor_pct !== null ? `${(ytdSplit.total_labor_pct * 100).toFixed(1)}%` : "N/A"}</p>
      </CardContent>
    </Card>
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
