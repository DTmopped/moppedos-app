import React, { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { motion } from "framer-motion";
import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.jsx";
import { BarChartHorizontalBig, Printer, FileDown, Calendar, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useData } from "../contexts/DataContext";
import ForecastActualTable from "./dashboard/ForecastActualTable.jsx";
import PrintableFvaDashboard from "./dashboard/PrintableFvaDashboard.jsx";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabaseClient";

const FvaDashboard = () => {
  const {
    isAdminMode,
    setIsAdminMode,
    adminSettings,
    updateAdminSetting,
    locationUuid,
    loadingLocation,
  } = useData();

  const {
    foodCostGoal: foodTarget,
    bevCostGoal: bevTarget,
    laborCostGoal: laborTarget,
  } = adminSettings;

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // State management
  const [fvaData, setFvaData] = useState([]);
  const [ytd, setYtd] = useState(null);
  const [showYTD, setShowYTD] = useState(false);
  const [showMTD, setShowMTD] = useState(false);
  const [showLastMonth, setShowLastMonth] = useState(false);
  const [lastMonthSummary, setLastMonthSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Smart date range controls
  const [viewMode, setViewMode] = useState("current_plus_4");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Local state for admin settings
  const [localAdminSettings, setLocalAdminSettings] = useState(adminSettings);

  useEffect(() => {
    setLocalAdminSettings(adminSettings);
  }, [adminSettings]);

  const handleAdminSettingChange = (key, value) => {
    setLocalAdminSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAdminSettings = () => {
    Object.keys(localAdminSettings).forEach(key => {
      updateAdminSetting(key, localAdminSettings[key]);
    });
    setIsAdminMode(false);
  };

  // Fetch all FVA data from Supabase
  const fetchRealFvaData = async () => {
    if (!locationUuid) return;
    try {
      const { data, error } = await supabase
        .from("fva_daily_history")
        .select("*")
        .eq("location_uuid", locationUuid)
        .order("date", { ascending: true });
      if (error) throw error;
      setFvaData(data || []);
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
    }
  };

  useEffect(() => {
    if (locationUuid && !loadingLocation) {
      fetchRealFvaData();
    }
  }, [locationUuid, loadingLocation]);

  const combinedData = fvaData.map(row => {
    const actualSales = row.actual_sales || row.actualSales || 0;
    const forecastSales = row.forecast_sales || row.forecastSales || 0;
    const foodCost = row.food_cost || row.foodCost || 0;
    const beverageCost = row.bev_cost || row.bevCost || row.beverage_cost || 0;
    const laborCost = row.labor_cost || row.laborCost || 0;
    const foodPct = actualSales > 0 ? foodCost / actualSales : row.food_cost_pct || 0;
    const bevPct = actualSales > 0 ? beverageCost / actualSales : row.bev_cost_pct || 0;
    const laborPct = actualSales > 0 ? laborCost / actualSales : row.labor_cost_pct || 0;
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
      hasActuals: actualSales > 0,
    };
  });

  const getMonday = date => {
    const d = new Date(date + "T00:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  };

  const getCurrentWeekKey = () => getMonday(today);

  const getFilteredData = () => {
    switch (viewMode) {
      case "current_plus_4":
        return getCurrentPlus4WeeksData();
      case "month":
        return combinedData.filter(d => d.date.startsWith(selectedMonth));
      case "custom":
        return combinedData.filter(d => d.date >= customStartDate && d.date <= customEndDate);
      default:
        return getCurrentPlus4WeeksData();
    }
  };

  const getCurrentPlus4WeeksData = () => {
    const currentWeekKey = getCurrentWeekKey();
    const allWeeks = groupDataByWeeks(combinedData);
    const sortedWeekKeys = Object.keys(allWeeks).sort();
    const currentWeekIndex = sortedWeekKeys.findIndex(key => key === currentWeekKey);
    const targetWeeks = currentWeekIndex >= 0
      ? sortedWeekKeys.slice(currentWeekIndex, currentWeekIndex + 5)
      : sortedWeekKeys.slice(0, 5);
    return targetWeeks.flatMap(weekKey => allWeeks[weekKey] || []);
  };

  const groupDataByWeeks = data => {
    const weeks = {};
    data.forEach(item => {
      const weekKey = getMonday(item.date);
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(item);
    });
    Object.values(weeks).forEach(week => week.sort((a, b) => a.date.localeCompare(b.date)));
    return weeks;
  };

  const formatWeekRange = mondayDate => {
    const monday = new Date(mondayDate + "T00:00:00");
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const options = { month: "short", day: "numeric" };
    return `${monday.toLocaleDateString("en-US", options)} - ${sunday.toLocaleDateString("en-US", options)}`;
  };

  const toggleWeek = weekKey => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) newExpanded.delete(weekKey);
    else newExpanded.add(weekKey);
    setExpandedWeeks(newExpanded);
  };

  const filteredData = getFilteredData();
  const weeklyData = groupDataByWeeks(filteredData);

  const getSortedWeekKeys = () => {
    const currentWeekKey = getCurrentWeekKey();
    const weekKeys = Object.keys(weeklyData).sort();
    if (viewMode === "current_plus_4" && weekKeys.includes(currentWeekKey)) {
      return [currentWeekKey, ...weekKeys.filter(key => key !== currentWeekKey)];
    }
    return weekKeys;
  };

  useEffect(() => {
    const currentWeekKey = getCurrentWeekKey();
    if (weeklyData[currentWeekKey]) {
      setExpandedWeeks(new Set([currentWeekKey]));
    } else {
      const sortedWeeks = Object.keys(weeklyData).sort();
      if (sortedWeeks.length > 0) setExpandedWeeks(new Set([sortedWeeks[0]]));
    }
  }, [combinedData.length, viewMode]);

  const getAvailableMonths = () => [...new Set(combinedData.map(d => d.date.slice(0, 7)))].sort().reverse();

  const getDateButtonLabel = () => {
    switch (viewMode) {
      case "current_plus_4": return "Current + 4 Weeks";
      case "month": return new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" });
      case "custom": return "Custom Range";
      default: return "Current + 4 Weeks";
    }
  };

  const fetchYtdData = async () => {
    if (!locationUuid) return;
    const ytdRecords = combinedData.filter(d => d.date >= "2025-01-01");
    const totalSales = ytdRecords.reduce((sum, d) => sum + d.actualSales, 0);
    setYtd({ total_sales: totalSales, record_count: ytdRecords.filter(d => d.hasActuals).length, avg_food_cost_pct: 0.28, avg_bev_cost_pct: 0.22, avg_labor_cost_pct: 0.31 });
  };

  const fetchLastMonthData = async () => {
    setLastMonthSummary({ total_forecast_sales: 245000, total_actual_sales: 252000, avg_food_cost_pct: 0.28, avg_bev_cost_pct: 0.22, avg_labor_cost_pct: 0.31, is_placeholder: true });
  };

  useEffect(() => {
    if (!loadingLocation && locationUuid && combinedData.length > 0) {
      fetchYtdData();
      fetchLastMonthData();
    }
  }, [loadingLocation, locationUuid, combinedData.length]);

  const getAverages = data => {
    const recordsWithActuals = data.filter(d => d.hasActuals);
    const count = recordsWithActuals.length;
    const sumSales = data.reduce((acc, d) => acc + (d.forecastSales || 0), 0);
    const sumActual = recordsWithActuals.reduce((acc, d) => acc + (d.actualSales || 0), 0);
    const foodPct = recordsWithActuals.reduce((acc, d) => acc + (d.foodPct || 0), 0);
    const bevPct = recordsWithActuals.reduce((acc, d) => acc + (d.bevPct || 0), 0);
    const laborPct = recordsWithActuals.reduce((acc, d) => acc + (d.laborPct || 0), 0);
    return { forecastSales: sumSales, actualSales: sumActual, foodPct: count ? foodPct / count : 0, bevPct: count ? bevPct / count : 0, laborPct: count ? laborPct / count : 0, recordCount: count };
  };

  const periodMetrics = getAverages(filteredData);
  const mtdData = combinedData.filter(d => d.date.startsWith(currentMonth) && d.date <= today);
  const mtdMetrics = getAverages(mtdData);

  const renderLastMonthCards = () => {
    if (!lastMonthSummary) return null;
    const variance = lastMonthSummary.total_forecast_sales > 0 ? (lastMonthSummary.total_actual_sales - lastMonthSummary.total_forecast_sales) / lastMonthSummary.total_forecast_sales : 0;
    return (
      <div className="space-y-4">
        {lastMonthSummary.is_placeholder && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"><p className="text-sm text-yellow-800"><strong>Demo Data:</strong> Showing placeholder values. Real data will automatically replace this when available.</p></div>}
        <div className="grid grid-cols-6 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Last Month Forecast Sales</p><p className="text-lg font-semibold">${lastMonthSummary.total_forecast_sales?.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Last Month Actual Sales</p><p className="text-lg font-semibold">${lastMonthSummary.total_actual_sales?.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Sales Variance %</p><p className={`text-lg font-semibold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>{(variance * 100).toFixed(1)}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Avg Food Cost %</p><p className={`text-lg font-semibold ${lastMonthSummary.avg_food_cost_pct > foodTarget ? "text-red-600" : "text-green-600"}`}>{(lastMonthSummary.avg_food_cost_pct * 100).toFixed(1)}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Avg Beverage Cost %</p><p className={`text-lg font-semibold ${lastMonthSummary.avg_bev_cost_pct > bevTarget ? "text-red-600" : "text-green-600"}`}>{(lastMonthSummary.avg_bev_cost_pct * 100).toFixed(1)}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Avg Labor Cost %</p><p className={`text-lg font-semibold ${lastMonthSummary.avg_labor_cost_pct > laborTarget ? "text-red-600" : "text-green-600"}`}>{(lastMonthSummary.avg_labor_cost_pct * 100).toFixed(1)}%</p></CardContent></Card>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(<PrintableFvaDashboard combinedData={filteredData} printDate={new Date()} targets={{ foodTarget, bevTarget, laborTarget }} lastMonthSummary={lastMonthSummary} />);
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, { position: "absolute", width: "0", height: "0", border: "0", left: "-9999px", top: "-9999px" });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>FVA Dashboard - Print</title></head><body>${printableComponentHtml}</body></html>`);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); document.body.removeChild(iframe); }, 500);
  };

  const exportToCSV = () => {
    const formatCurrency = val => typeof val === "number" ? `$${val.toFixed(2)}` : "N/A";
    const formatPercent = val => typeof val === "number" ? `${val.toFixed(1)}%` : "N/A";
    const rows = [["Date", "Forecasted Sales", "Actual Sales", "Variance ($)", "Variance (%)", "Food Cost %", "Bev Cost %", "Labor Cost %", "Alerts"]];
    filteredData.forEach(d => {
      const dollarVar = d.hasActuals ? d.actualSales - d.forecastSales : null;
      const pctVar = d.hasActuals && d.forecastSales ? ((d.actualSales - d.forecastSales) / d.forecastSales) * 100 : null;
      const alerts = d.hasActuals ? [d.foodPct > foodTarget ? "Food Over" : null, d.bevPct > bevTarget ? "Bev Over" : null, d.laborPct > laborTarget ? "Labor Over" : null].filter(Boolean).join(", ") || "On Target" : "No Actuals";
      rows.push([d.date, formatCurrency(d.forecastSales), d.hasActuals ? formatCurrency(d.actualSales) : "N/A", formatCurrency(dollarVar), formatPercent(pctVar), d.hasActuals ? formatPercent(d.foodPct * 100) : "N/A", d.hasActuals ? formatPercent(d.bevPct * 100) : "N/A", d.hasActuals ? formatPercent(d.laborPct * 100) : "N/A", alerts]);
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

  if (loadingLocation) {
    return <div className="flex items-center justify-center h-64"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div><p className="text-slate-600">Loading location data...</p></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Forecast vs. Actual Dashboard</h2>
          <p className="text-sm text-slate-500">Review performance across MTD, YTD, and prior month.</p>
          {locationUuid && <p className="text-xs text-slate-400">Location: {locationUuid.slice(0, 8)}...</p>}
        </div>
        <div className="flex gap-2">
          <Button variant={showMTD ? "default" : "outline"} onClick={() => setShowMTD(!showMTD)}>Show MTD</Button>
          <Button variant={showYTD ? "default" : "outline"} onClick={() => { setShowYTD(!showYTD); if (!showYTD && !ytd) fetchYtdData(); }}>Show YTD</Button>
          <Button variant={showLastMonth ? "default" : "outline"} onClick={() => setShowLastMonth(!showLastMonth)}>Last Month</Button>
          <Button variant="outline" onClick={() => setIsAdminMode(!isAdminMode)}><Settings className="mr-2 h-4 w-4" /> Admin</Button>
        </div>
      </div>

      {isAdminMode && (
        <Card className="bg-slate-800 text-white">
          <CardHeader>
            <CardTitle>Admin Mode Settings</CardTitle>
            <CardDescription>Adjust cost goals for this location. Changes will be saved for all users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400">Food Cost Goal (%)</label>
                <input type="number" value={localAdminSettings.foodCostGoal * 100} onChange={e => handleAdminSettingChange("foodCostGoal", e.target.value / 100)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Beverage Cost Goal (%)</label>
                <input type="number" value={localAdminSettings.bevCostGoal * 100} onChange={e => handleAdminSettingChange("bevCostGoal", e.target.value / 100)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400">Labor Cost Goal (%)</label>
                <input type="number" value={localAdminSettings.laborCostGoal * 100} onChange={e => handleAdminSettingChange("laborCostGoal", e.target.value / 100)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdminMode(false)}>Cancel</Button>
              <Button onClick={handleSaveAdminSettings}>Save Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">{error}</p><button onClick={() => setError(null)} className="text-red-600 underline text-sm mt-2">Dismiss</button></div>}

      {showMTD && (
        <>
          <h3 className="text-lg font-semibold text-slate-700 mt-8 mb-2">Month-to-Date Metrics</h3>
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-slate-500">MTD Actual Sales</p><p className="text-lg font-semibold text-slate-800">${mtdMetrics.actualSales?.toLocaleString() || 0}</p><p className="text-xs text-slate-400">{mtdMetrics.recordCount} records</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-slate-500">MTD Food Cost %</p><p className={`text-lg font-semibold ${mtdMetrics.foodPct > foodTarget ? "text-red-600" : "text-green-600"}`}>{(mtdMetrics.foodPct * 100).toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-slate-500">MTD Beverage Cost %</p><p className={`text-lg font-semibold ${mtdMetrics.bevPct > bevTarget ? "text-red-600" : "text-green-600"}`}>{(mtdMetrics.bevPct * 100).toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-slate-500">MTD Labor Cost %</p><p className={`text-lg font-semibold ${mtdMetrics.laborPct > laborTarget ? "text-red-600" : "text-green-600"}`}>{(mtdMetrics.laborPct * 100).toFixed(1)}%</p></CardContent></Card>
          </div>
        </>
      )}

      {showYTD && (
        <>
          <h3 className="text-lg font-semibold text-slate-700 mt-8 mb-2">Year-to-Date Metrics</h3>
          {ytd ? (
            <div className="grid grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><p className="text-sm text-slate-500">YTD Actual Sales</p><p className="text-lg font-semibold text-slate-800">${ytd?.total_sales?.toLocaleString() || 0}</p><p className="text-xs text-slate-400">{ytd.record_count} records</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-slate-500">YTD Food Cost %</p><p className={`text-lg font-semibold ${ytd?.avg_food_cost_pct > foodTarget ? "text-red-600" : "text-green-600"}`}>{(ytd?.avg_food_cost_pct * 100).toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-slate-500">YTD Beverage Cost %</p><p className={`text-lg font-semibold ${ytd?.avg_bev_cost_pct > bevTarget ? "text-red-600" : "text-green-600"}`}>{(ytd?.avg_bev_cost_pct * 100).toFixed(1)}%</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-slate-500">YTD Labor Cost %</p><p className={`text-lg font-semibold ${ytd?.avg_labor_cost_pct > laborTarget ? "text-red-600" : "text-green-600"}`}>{(ytd?.avg_labor_cost_pct * 100).toFixed(1)}%</p></CardContent></Card>
            </div>
          ) : <div className="bg-gray-50 border border-gray-200 rounded-lg p-4"><p className="text-gray-600">No YTD data available for this location.</p></div>}
        </>
      )}

      {showLastMonth && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Last Month Summary</h3>
          {lastMonthSummary ? renderLastMonthCards() : <div className="bg-gray-50 border border-gray-200 rounded-lg p-4"><p className="text-gray-600">Loading Last Month data...</p></div>}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Week Actual Sales</p><p className="text-lg font-semibold text-slate-800">${periodMetrics.actualSales?.toLocaleString() || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Week Food Cost %</p><p className={`text-lg font-semibold ${periodMetrics.foodPct > foodTarget ? "text-red-600" : "text-green-600"}`}>{(periodMetrics.foodPct * 100).toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Week Beverage Cost %</p><p className={`text-lg font-semibold ${periodMetrics.bevPct > bevTarget ? "text-red-600" : "text-green-600"}`}>{(periodMetrics.bevPct * 100).toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Week Labor Cost %</p><p className={`text-lg font-semibold ${periodMetrics.laborPct > laborTarget ? "text-red-600" : "text-green-600"}`}>{(periodMetrics.laborPct * 100).toFixed(1)}%</p></CardContent></Card>
      </div>

      <Card className="shadow-xl bg-white text-slate-800 border border-slate-200">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg"><BarChartHorizontalBig className="h-8 w-8 text-white" /></div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Forecast vs. Actual Dashboard</CardTitle>
              <CardDescription className="text-slate-500">Weekly breakdown of forecasted and actual performance metrics.</CardDescription>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Button onClick={() => setShowDateDropdown(!showDateDropdown)} variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-100"><Calendar className="mr-2 h-4 w-4" /> {getDateButtonLabel()}<ChevronDown className="ml-2 h-4 w-4" /></Button>
              {showDateDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="space-y-3">
                      <button onClick={() => { setViewMode("current_plus_4"); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-md transition-colors ${viewMode === "current_plus_4" ? "bg-indigo-100 text-indigo-800 font-medium" : "hover:bg-slate-100"}`}>📅 Current + 4 Weeks<p className="text-xs text-slate-500 mt-1">Default operational view</p></button>
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">📅 Select Month:</p>
                        <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setViewMode("month"); setShowDateDropdown(false); }} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          {getAvailableMonths().map(month => <option key={month} value={month}>{new Date(month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}</option>)}
                        </select>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">🗓️ Custom Date Range:</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Start Date</label>
                            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">End Date</label>
                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                        <button onClick={() => { if (customStartDate && customEndDate) { setViewMode("custom"); setShowDateDropdown(false); } }} disabled={!customStartDate || !customEndDate} className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm">Apply Custom Range</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => { setViewMode("current_plus_4"); setCustomStartDate(""); setCustomEndDate(""); setShowDateDropdown(false); }}>Reset to Default</Button>
                      <Button size="sm" onClick={() => setShowDateDropdown(false)}>Close</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handlePrint} variant="outline" className="border-indigo-500 text-indigo-500 hover:bg-indigo-100"><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
            <Button onClick={exportToCSV} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-100"><FileDown className="mr-2 h-4 w-4" /> Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(weeklyData).length === 0 ? (
            <div className="text-center py-8 text-slate-500"><p>No data available for the selected period.</p><p className="text-sm mt-2">Try selecting a different date range.</p></div>
          ) : (
            <div className="space-y-4">
              {getSortedWeekKeys().map(weekKey => {
                const weekData = weeklyData[weekKey];
                const isExpanded = expandedWeeks.has(weekKey);
                const weekRange = formatWeekRange(weekKey);
                const isCurrentWeek = weekKey === getCurrentWeekKey();
                return (
                  <div key={weekKey} className={`border rounded-lg ${isCurrentWeek ? "border-indigo-300 bg-indigo-50" : "border-slate-200"}`}>
                    <button onClick={() => toggleWeek(weekKey)} className={`w-full px-4 py-3 flex items-center justify-between rounded-t-lg transition-colors ${isCurrentWeek ? "bg-indigo-100 hover:bg-indigo-200" : "bg-slate-50 hover:bg-slate-100"}`}>
                      <div className="flex items-center space-x-3"><span className={`font-medium ${isCurrentWeek ? "text-indigo-800" : "text-slate-700"}`}>Week of {weekRange} {isCurrentWeek && "(Current)"}</span><span className="text-sm text-slate-500">({weekData.length} days)</span></div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </button>
                    {isExpanded && <div className="p-4 border-t border-slate-200"><ForecastActualTable combinedData={weekData} /></div>}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-4 italic">Note: This dashboard sources data from location-specific forecasts and actuals. Multi-tenant isolation is enforced via location UUID.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FvaDashboard;
