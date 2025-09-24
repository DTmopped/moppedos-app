import React, { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { motion } from "framer-motion";
import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { BarChartHorizontalBig, Printer, FileDown, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useData } from "../contexts/DataContext";
import ForecastActualTable from "./dashboard/ForecastActualTable.jsx";
import PrintableFvaDashboard from "./dashboard/PrintableFvaDashboard.jsx";
import { cn } from "@/lib/utils";
import { supabase } from '@/supabaseClient';

const FvaDashboard = () => {
  const {
    isAdminMode,
    setIsAdminMode,
    adminSettings,
    updateAdminSetting,
    locationUuid,
    loadingLocation
  } = useData();

  const {
    foodCostGoal: foodTarget,
    bevCostGoal: bevTarget,
    laborCostGoal: laborTarget
  } = adminSettings;

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // State management
  const [fvaData, setFvaData] = useState([]);
  const [ytd, setYtd] = useState(null);
  const [showYTD, setShowYTD] = useState(false);
  const [showLastMonth, setShowLastMonth] = useState(false);
  const [lastMonthSummary, setLastMonthSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ NEW: Month selector and date range state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());

  // ✅ Fetch real FVA data from database
  const fetchRealFvaData = async () => {
    if (!locationUuid) return;
    
    const { data } = await supabase
      .from('fva_daily_history')
      .select('*')
      .eq('location_uuid', locationUuid)
      .order('date', { ascending: true });
    
    setFvaData(data || []);
  };

  useEffect(() => {
    fetchRealFvaData();
  }, [locationUuid]);

  // ✅ Process data into combined format
  const combinedData = fvaData.map(row => {
    const actualSales = row.actual_sales || 0;
    const forecastSales = row.forecast_sales || 0;
    const foodCost = row.food_cost || 0;
    const beverageCost = row.bev_cost || 0;
    const laborCost = row.labor_cost || 0;
    const foodPct = actualSales > 0 ? foodCost / actualSales : (row.food_cost_pct || 0);
    const bevPct = actualSales > 0 ? beverageCost / actualSales : (row.bev_cost_pct || 0);
    const laborPct = actualSales > 0 ? laborCost / actualSales : (row.labor_cost_pct || 0);
    const hasActuals = actualSales > 0;
    
    return {
      date: row.date,
      forecastSales,
      actualSales,
      foodCost,
      beverageCost,
      laborCost,
      foodPct,
      bevPct,
      laborPct,
      hasActuals
    };
  });

  // ✅ NEW: Get available months from data
  const getAvailableMonths = () => {
    const months = [...new Set(combinedData.map(d => d.date.slice(0, 7)))];
    return months.sort().reverse(); // Most recent first
  };

  // ✅ NEW: Filter data based on selection
  const getFilteredData = () => {
    if (showCustomRange && customStartDate && customEndDate) {
      return combinedData.filter(d => d.date >= customStartDate && d.date <= customEndDate);
    }
    return combinedData.filter(d => d.date.startsWith(selectedMonth));
  };

  // ✅ NEW: Group data by weeks (Monday-Sunday)
  const groupDataByWeeks = (data) => {
    const weeks = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      // Get Monday of the week
      const monday = new Date(date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      
      const weekKey = monday.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(item);
    });

    // Sort each week's data by date
    Object.keys(weeks).forEach(weekKey => {
      weeks[weekKey].sort((a, b) => a.date.localeCompare(b.date));
    });

    return weeks;
  };

  // ✅ NEW: Format week range for display
  const formatWeekRange = (mondayDate) => {
    const monday = new Date(mondayDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
  };

  // ✅ NEW: Toggle week expansion
  const toggleWeek = (weekKey) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  // ✅ Get filtered and grouped data
  const filteredData = getFilteredData();
  const weeklyData = groupDataByWeeks(filteredData);
  const availableMonths = getAvailableMonths();

  // Auto-expand current week
  useEffect(() => {
    const currentWeekData = groupDataByWeeks(combinedData.filter(d => d.date <= today));
    const currentWeekKeys = Object.keys(currentWeekData).sort();
    if (currentWeekKeys.length > 0) {
      const latestWeek = currentWeekKeys[currentWeekKeys.length - 1];
      setExpandedWeeks(new Set([latestWeek]));
    }
  }, [combinedData, today]);

  // ✅ YTD and Last Month functions (unchanged)
  const fetchYtdData = async () => {
    if (loadingLocation || !locationUuid) return;

    try {
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

  const fetchLastMonthData = async () => {
    if (loadingLocation || !locationUuid) return;

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
      }
    } catch (err) {
      console.error('Error fetching last month data:', err);
    }
  };

  useEffect(() => {
    if (!loadingLocation && locationUuid) {
      fetchYtdData();
      fetchLastMonthData();
    }
  }, [loadingLocation, locationUuid, today]);

  // ✅ Calculate metrics for filtered data
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

  const periodMetrics = getAverages(filteredData);

  // ✅ Render functions
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

  // ✅ Export and print functions (simplified for filtered data)
  const handlePrint = () => {
    const printDate = new Date();
    const targets = { foodTarget, bevTarget, laborTarget };
    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableFvaDashboard
        combinedData={filteredData}
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
    const formatCurrency = val => typeof val === "number" ? `$${val.toFixed(2)}` : "N/A";
    const formatPercent = val => typeof val === "number" ? `${val.toFixed(1)}%` : "N/A";

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

    filteredData.forEach(d => {
      const dollarVar = d.hasActuals ? d.actualSales - d.forecastSales : null;
      const pctVar = d.hasActuals && d.forecastSales
        ? ((d.actualSales - d.forecastSales) / d.forecastSales) * 100
        : null;

      const forecastFoodCost = d.hasActuals ? d.forecastSales * d.foodPct : null;
      const actualFoodCost = d.hasActuals ? d.actualSales * d.foodPct : null;
      const foodVar = d.hasActuals ? actualFoodCost - forecastFoodCost : null;

      const alerts = d.hasActuals
        ? [
            foodVar > 0 ? "Food Over" : null,
            d.bevPct > bevTarget ? "Bev Over" : null,
            d.laborPct > laborTarget ? "Labor Over" : null,
          ].filter(Boolean).join(", ") || "On Target"
        : "No Actuals";

      rows.push([
        d.date,
        formatCurrency(d.forecastSales),
        d.hasActuals ? formatCurrency(d.actualSales) : "N/A",
        formatCurrency(dollarVar),
        formatPercent(pctVar),
        d.hasActuals ? `${formatCurrency(forecastFoodCost)} / ${formatCurrency(actualFoodCost)} / ${formatCurrency(foodVar)}` : "N/A",
        d.hasActuals ? `${formatPercent(d.bevPct * 100)}` : "N/A",
        d.hasActuals ? `${formatPercent(d.laborPct * 100)}` : "N/A",
        alerts,
      ]);
    });

    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fva-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Loading state
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-indigo-50 min-h-screen"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Forecast vs. Actual Dashboard</h1>
          <p className="text-slate-600">Review performance across MTD, YTD, and prior month.</p>
          <p className="text-sm text-slate-500">Location: {locationUuid?.slice(0, 8)}...</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowYTD(!showYTD)}
          >
            Show YTD
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLastMonth(!showLastMonth)}
          >
            Last Month
          </Button>
        </div>
      </div>

      {/* ✅ NEW: Month Selector and Date Range Controls */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">View Period:</span>
              </div>
              
              {!showCustomRange ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomRange(!showCustomRange)}
              >
                {showCustomRange ? 'Month View' : 'Custom Range'}
              </Button>
              {(showCustomRange || selectedMonth !== currentMonth) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomRange(false);
                    setSelectedMonth(currentMonth);
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Mode Toggle */}
      {isAdminMode && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <span className="text-yellow-800 font-medium">Admin Mode Active</span>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={(e) => setIsAdminMode(e.target.checked)}
              className="mr-2"
            />
          </label>
        </div>
      )}

      {/* Period Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              Period Actual Sales <span title="Total actual sales for selected period." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className="text-lg font-semibold text-slate-800">
              ${periodMetrics.actualSales?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              Period Food Cost % <span title="Food cost as a % of actual sales for period." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className={`text-lg font-semibold ${periodMetrics.foodPct > foodTarget ? 'text-red-600' : 'text-green-600'}`}>
              {(periodMetrics.foodPct * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              Period Beverage Cost % <span title="Beverage cost as a % of actual sales for period." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className={`text-lg font-semibold ${periodMetrics.bevPct > bevTarget ? 'text-red-600' : 'text-green-600'}`}>
              {(periodMetrics.bevPct * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">
              Period Labor Cost % <span title="Labor cost as a % of actual sales for period." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
            </p>
            <p className={`text-lg font-semibold ${periodMetrics.laborPct > laborTarget ? 'text-red-600' : 'text-green-600'}`}>
              {(periodMetrics.laborPct * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* YTD Metrics */}
      {showYTD && (
        <>
          <h3 className="text-lg font-semibold text-slate-700 mt-8 mb-2">Year-to-Date Metrics</h3>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Actual Sales <span title="Total actual sales year-to-date for this location." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  ${ytd?.total_sales?.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Food Cost % <span title="Average food cost as a % of actual sales YTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className={`text-lg font-semibold ${ytd?.avg_food_cost_pct > foodTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {ytd?.avg_food_cost_pct ? (ytd.avg_food_cost_pct * 100).toFixed(1) : '0.0'}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Beverage Cost % <span title="Average beverage cost as a % of actual sales YTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className={`text-lg font-semibold ${ytd?.avg_bev_cost_pct > bevTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {ytd?.avg_bev_cost_pct ? (ytd.avg_bev_cost_pct * 100).toFixed(1) : '0.0'}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  YTD Labor Cost % <span title="Average labor cost as a % of actual sales YTD." className="ml-1 text-blue-400 cursor-help">ℹ️</span>
                </p>
                <p className={`text-lg font-semibold ${ytd?.avg_labor_cost_pct > laborTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {ytd?.avg_labor_cost_pct ? (ytd.avg_labor_cost_pct * 100).toFixed(1) : '0.0'}%
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

      {/* ✅ NEW: Weekly Accordion View */}
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
                Weekly breakdown of forecasted and actual performance metrics.
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
          {Object.keys(weeklyData).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No data available for the selected period.</p>
              <p className="text-sm mt-2">Try selecting a different month or date range.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(weeklyData)
                .sort((a, b) => b.localeCompare(a)) // Most recent first
                .map(weekKey => {
                  const weekData = weeklyData[weekKey];
                  const isExpanded = expandedWeeks.has(weekKey);
                  const weekRange = formatWeekRange(weekKey);
                  
                  return (
                    <div key={weekKey} className="border border-slate-200 rounded-lg">
                      <button
                        onClick={() => toggleWeek(weekKey)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-t-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-slate-700">
                            Week of {weekRange}
                          </span>
                          <span className="text-sm text-slate-500">
                            ({weekData.length} days)
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200">
                          <ForecastActualTable combinedData={weekData} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
          
          <p className="text-xs text-slate-400 mt-4 italic">
            Note: This dashboard sources data from location-specific forecasts and actuals. Multi-tenant isolation is enforced via location UUID.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;
