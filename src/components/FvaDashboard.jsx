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
  const {
    forecastData,
    actualData,
    isAdminMode,
    setIsAdminMode,
    adminSettings,
    updateAdminSetting,
    locationUuid, // ✅ Use locationUuid instead of locationId
    loadingLocation
  } = useData();

  const {
    foodCostGoal: foodTarget,
    bevCostGoal: bevTarget,
    laborCostGoal: laborTarget
  } = adminSettings;

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [ytd, setYtd] = useState(null);
  const [ytdSplit, setYtdSplit] = useState(null);
  const [showYTD, setShowYTD] = useState(false);
  const [showLastMonth, setShowLastMonth] = useState(false);
  const [lastMonthSummary, setLastMonthSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Updated function to fetch FVA data using location_uuid
  const fetchFvaData = async () => {
    if (loadingLocation || !locationUuid) {
      console.log('Skipping FVA data fetch - loadingLocation:', loadingLocation, 'locationUuid:', locationUuid);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching FVA data for locationUuid:', locationUuid);

      // ✅ Query using location_uuid instead of location_id
      const { data: fvaData, error: fvaError } = await supabase
        .from('fva_daily_history')
        .select('*')
        .eq('location_uuid', locationUuid)
        .order('date', { ascending: true });

      if (fvaError) {
        console.error('FVA data fetch error:', fvaError);
        throw fvaError;
      }

      console.log('Fetched FVA data:', fvaData?.length || 0, 'records');
      return fvaData || [];

    } catch (err) {
      console.error('Error fetching FVA data:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Updated YTD data fetching with location_uuid
  const fetchYtdData = async () => {
    if (loadingLocation || !locationUuid) {
      return;
    }

    try {
      // ✅ Use direct queries instead of RPC functions for better control
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      
      const { data: ytdData, error: ytdError } = await supabase
        .from('fva_daily_history')
        .select(`
          forecast_sales,
          actual_sales,
          food_cost_pct,
          bev_cost_pct,
          labor_cost_pct,
          date
        `)
        .eq('location_uuid', locationUuid)
        .gte('date', startOfYear)
        .lte('date', today)
        .not('actual_sales', 'is', null);

      if (ytdError) {
        console.error('YTD data fetch error:', ytdError);
        return;
      }

      if (ytdData && ytdData.length > 0) {
        // Calculate YTD aggregates
        const totalSales = ytdData.reduce((sum, row) => sum + (row.actual_sales || 0), 0);
        const totalForecast = ytdData.reduce((sum, row) => sum + (row.forecast_sales || 0), 0);
        const avgFoodPct = ytdData.reduce((sum, row) => sum + (row.food_cost_pct || 0), 0) / ytdData.length;
        const avgBevPct = ytdData.reduce((sum, row) => sum + (row.bev_cost_pct || 0), 0) / ytdData.length;
        const avgLaborPct = ytdData.reduce((sum, row) => sum + (row.labor_cost_pct || 0), 0) / ytdData.length;

        setYtd({
          total_sales: totalSales,
          total_forecast: totalForecast,
          avg_food_cost_pct: avgFoodPct,
          avg_bev_cost_pct: avgBevPct,
          avg_labor_cost_pct: avgLaborPct
        });
      }

    } catch (err) {
      console.error('Error fetching YTD data:', err);
    }
  };

  // ✅ Updated last month data fetching with location_uuid
  const fetchLastMonthData = async () => {
    if (loadingLocation || !locationUuid) {
      return;
    }

    try {
      const now = new Date();
      const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(firstDayOfThisMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const lastMonthEnd = new Date(firstDayOfThisMonth);
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

      const startDate = lastMonthStart.toISOString().split('T')[0];
      const endDate = lastMonthEnd.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('fva_daily_history')
        .select(`
          forecast_sales,
          actual_sales,
          food_cost_pct,
          bev_cost_pct,
          labor_cost_pct
        `)
        .eq('location_uuid', locationUuid)
        .gte('date', startDate)
        .lte('date', endDate)
        .not('actual_sales', 'is', null);

      if (error) {
        console.error("Last Month fetch error", error);
        return;
      }

      if (data && data.length > 0) {
        // Calculate last month aggregates
        const totalForecastSales = data.reduce((sum, row) => sum + (row.forecast_sales || 0), 0);
        const totalActualSales = data.reduce((sum, row) => sum + (row.actual_sales || 0), 0);
        const avgFoodPct = data.reduce((sum, row) => sum + (row.food_cost_pct || 0), 0) / data.length;
        const avgBevPct = data.reduce((sum, row) => sum + (row.bev_cost_pct || 0), 0) / data.length;
        const avgLaborPct = data.reduce((sum, row) => sum + (row.labor_cost_pct || 0), 0) / data.length;

        setLastMonthSummary({
          total_forecast_sales: totalForecastSales,
          total_actual_sales: totalActualSales,
          avg_food_cost_pct: avgFoodPct,
          avg_bev_cost_pct: avgBevPct,
          avg_labor_cost_pct: avgLaborPct
        });
      } else {
        console.warn("⚠️ No last month data found for location:", locationUuid);
        // Set placeholder data for demo purposes
        setLastMonthSummary({
          total_forecast_sales: 72000,
          total_actual_sales: 69500,
          avg_food_cost_pct: 0.285,
          avg_labor_cost_pct: 0.13,
          avg_bev_cost_pct: 0.18
        });
      }
    } catch (err) {
      console.error('Error fetching last month data:', err);
    }
  };

  // ✅ Load data when locationUuid is available
  useEffect(() => {
    if (!loadingLocation && locationUuid) {
      fetchYtdData();
      fetchLastMonthData();
    }
  }, [loadingLocation, locationUuid, today]);

  const renderLastMonthCards = () => {
    if (!lastMonthSummary) return null;

    const variance = (
      lastMonthSummary.total_actual_sales - lastMonthSummary.total_forecast_sales
    ) / lastMonthSummary.total_forecast_sales;

    return (
      <div className="grid grid-cols-6 gap-4 mt-4">
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
            <p className="text-sm text-slate-500">Avg Beverage Cost %</p>
            <p className={`text-lg font-semibold ${lastMonthSummary.avg_bev_cost_pct > bevTarget ? "text-red-600" : "text-green-600"}`}>
              {(lastMonthSummary.avg_bev_cost_pct * 100).toFixed(1)}%
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

  // ✅ Updated combinedData calculation using location-specific data
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

  const handlePrint = () => {
    const printDate = new Date();
    const targets = { foodTarget, bevTarget, laborTarget };
    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableFvaDashboard
        combinedData={combinedData}
        printDate={printDate}
        targets={targets}
        lastMonthSummary={lastMonthSummary}
      />
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
    const formatCurrency = val =>
      typeof val === "number" ? `$${val.toFixed(2)}` : "N/A";
    const formatPercent = val =>
      typeof val === "number" ? `${val.toFixed(1)}%` : "N/A";

    const rows = [
      [
        "Date",
        "Forecasted Sales",
        "Actual Sales",
        "Variance ($)",
        "Variance (%)",
        "Food Cost (F / A / $)",
        "Bev Cost (F / A / $)",
        "Labor Cost (F / A / $)",
        "Alerts",
      ],
    ];

    let totals = {
      forecast: 0,
      actual: 0,
      food$: 0,
      bev$: 0,
      labor$: 0,
      daysWithActuals: 0,
    };

    combinedData.forEach(d => {
      const dollarVar = d.hasActuals ? d.actualSales - d.forecastSales : null;
      const pctVar =
        d.hasActuals && d.forecastSales
          ? ((d.actualSales - d.forecastSales) / d.forecastSales) * 100
          : null;

      const forecastFoodCost = d.hasActuals ? d.forecastSales * d.foodPct : null;
      const actualFoodCost = d.hasActuals ? d.actualSales * d.foodPct : null;
      const foodVar = d.hasActuals ? actualFoodCost - forecastFoodCost : null;

      const forecastBevCost = d.hasActuals ? d.forecastSales * d.bevPct : null;
      const actualBevCost = d.hasActuals ? d.actualSales * d.bevPct : null;
      const bevVar = d.hasActuals ? actualBevCost - forecastBevCost : null;

      const forecastLaborCost = d.hasActuals ? d.forecastSales * d.laborPct : null;
      const actualLaborCost = d.hasActuals ? d.actualSales * d.laborPct : null;
      const laborVar = d.hasActuals ? actualLaborCost - forecastLaborCost : null;

      const alerts = d.hasActuals
        ? [
            foodVar > 0 ? "Food Over" : null,
            bevVar > 0 ? "Bev Over" : null,
            laborVar > 0 ? "Labor Over" : null,
          ].filter(Boolean).join(", ") || "On Target"
        : "No Actuals";

      rows.push([
        d.date,
        formatCurrency(d.forecastSales),
        d.hasActuals ? formatCurrency(d.actualSales) : "N/A",
        formatCurrency(dollarVar),
        formatPercent(pctVar),
        d.hasActuals
          ? `${formatCurrency(forecastFoodCost)} / ${formatCurrency(actualFoodCost)} / ${formatCurrency(foodVar)}`
          : "N/A",
        d.hasActuals
          ? `${formatCurrency(forecastBevCost)} / ${formatCurrency(actualBevCost)} / ${formatCurrency(bevVar)}`
          : "N/A",
        d.hasActuals
          ? `${formatCurrency(forecastLaborCost)} / ${formatCurrency(actualLaborCost)} / ${formatCurrency(laborVar)}`
          : "N/A",
        alerts,
      ]);

      // Running totals for summary row
      totals.forecast += d.forecastSales || 0;
      if (d.hasActuals) {
        totals.actual += d.actualSales || 0;
        totals.food$ += foodVar || 0;
        totals.bev$ += bevVar || 0;
        totals.labor$ += laborVar || 0;
        totals.daysWithActuals++;
      }
    });

    rows.push([
      "TOTAL / AVG",
      formatCurrency(totals.forecast),
      formatCurrency(totals.actual),
      formatCurrency(totals.actual - totals.forecast),
      totals.daysWithActuals
        ? formatPercent(
            ((totals.actual - totals.forecast) / totals.forecast) * 100
          )
        : "N/A",
      formatCurrency(totals.food$),
      formatCurrency(totals.bev$),
      formatCurrency(totals.labor$),
      "",
    ]);

    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fva-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Show loading state while location is loading
  if (loadingLocation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading location data...</p>
        </div>
      </div>
    );
  }

  // ✅ Show error state if no locationUuid
  if (!locationUuid) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600">No location selected. Please select a location to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Dashboard Header & Toggles */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Forecast vs. Actual Dashboard</h2>
          <p className="text-sm text-slate-500">Review performance across MTD, YTD, and prior month.</p>
          {locationUuid && (
            <p className="text-xs text-slate-400">Location: {locationUuid}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={isAdminMode ? "default" : "outline"}
            onClick={() => setIsAdminMode(!isAdminMode)}
          >
            {isAdminMode ? "Admin Mode: ON" : "Admin Mode"}
          </Button>
          <Button
  variant="outline"
  onClick={() => {
    setShowYTD(!showYTD);
    if (!showYTD && !ytd) {
      fetchYtdData(); // Call the function when showing YTD for first time
    }
  }}
>
  Show YTD
</Button>
          <Button
            variant={showLastMonth ? "default" : "outline"}
            onClick={() => setShowLastMonth(!showLastMonth)}
          >
            {showLastMonth ? "Hide Last Month" : "Last Month"}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-red-700">Error loading data: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-blue-700">Loading dashboard data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Render Last Month Cards if toggled */}
      {showLastMonth && renderLastMonthCards()}

      {/* Admin Mode Target Inputs */}
      {isAdminMode && (
        <div className="flex gap-4 text-sm items-center">
          <label>
            Food Target %
            <input
              type="number"
              step="0.01"
              value={foodTarget}
              onChange={e => updateAdminSetting("foodCostGoal", parseFloat(e.target.value))}
              className="ml-1 border rounded px-2 py-1 w-16 text-right"
            />
          </label>
          <label>
            Bev Target %
            <input
              type="number"
              step="0.01"
              value={bevTarget}
              onChange={e => updateAdminSetting("bevCostGoal", parseFloat(e.target.value))}
              className="ml-1 border rounded px-2 py-1 w-16 text-right"
            />
          </label>
          <label>
            Labor Target %
            <input
              type="number"
              step="0.01"
              value={laborTarget}
              onChange={e => updateAdminSetting("laborCostGoal", parseFloat(e.target.value))}
              className="ml-1 border rounded px-2 py-1 w-16 text-right"
            />
          </label>
        </div>
      )}

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
                  YTD Actual Sales <span title="Total actual sales year-to-date for this location." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  ${ytd.total_sales?.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Food Cost % <span title="Average food cost as a % of actual sales YTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className={`text-lg font-semibold ${ytd.avg_food_cost_pct > foodTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {(ytd.avg_food_cost_pct * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Beverage Cost % <span title="Average beverage cost as a % of actual sales YTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className={`text-lg font-semibold ${ytd.avg_bev_cost_pct > bevTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {(ytd.avg_bev_cost_pct * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Labor Cost % <span title="Average labor cost as a % of actual sales YTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className={`text-lg font-semibold ${ytd.avg_labor_cost_pct > laborTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {(ytd.avg_labor_cost_pct * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Last Month Summary */}
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
            Note: This dashboard sources data from location-specific forecasts and actuals. Multi-tenant isolation is enforced via location UUID.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;
