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
import { supabase } from "@/lib/supabaseClient";

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
      {ytd && (
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">YTD Actual Sales</p><p className="text-xl font-bold">${ytd.total_sales?.toLocaleString() || 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">YTD Food Cost %</p><p className="text-xl font-bold">{ytd.food_pct ?? "N/A"}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">YTD Beverage Cost %</p><p className="text-xl font-bold">{ytd.bev_pct ?? "N/A"}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">YTD Labor Cost %</p><p className="text-xl font-bold">{ytd.labor_pct ?? "N/A"}%</p></CardContent></Card>
        </div>
      )}

      {ytdSplit && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">FOH Labor %</p><p className="text-xl font-bold">{ytdSplit.foh_labor_pct ?? "N/A"}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">BOH Labor %</p><p className="text-xl font-bold">{ytdSplit.boh_labor_pct ?? "N/A"}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Labor %</p><p className="text-xl font-bold">{ytdSplit.total_labor_pct ?? "N/A"}%</p></CardContent></Card>
        </div>
      )}

      {/* Forecast Table */}
      {/* ... rest of your return */}
    </motion.div>
  );
};

export default FvaDashboard;
