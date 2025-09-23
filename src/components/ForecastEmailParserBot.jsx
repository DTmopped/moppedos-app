import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import { useData } from "@/contexts/DataContext";
import AdminPanel from "./forecast/AdminPanel.jsx";
import AdminModeToggle from "@/components/ui/AdminModeToggle";
import { Accordion } from "@/components/ui/accordion"; // <-- IMPORT ACCORDION
import ForecastWeekAccordion from "./forecast/ForecastWeekAccordion.jsx"; // <-- IMPORT THE WEEK ACCORDION

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  // --- HOOKS ---
  const { locationId, loadingLocation, isAdminMode, adminSettings, refreshData } = useData();
  const { captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal, amSplit } = adminSettings;
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [isSaving, setIsSaving] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  // --- NEW STATE FOR SAVED FORECASTS ---
  const [savedForecasts, setSavedForecasts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // --- EFFECTS ---
  useEffect(() => {
    if (!loadingLocation && locationId) {
      const dateString = `Date: ${activeWeekStartDate.toISOString().split('T')[0]}`;
      setEmailInput(`${dateString}\nMonday:\nTuesday:\nWednesday:\nThursday:\nFriday:\nSaturday:\nSunday:`);
    }
  }, [activeWeekStartDate, loadingLocation, locationId]);

  // --- NEW EFFECT TO FETCH SAVED FORECASTS ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!locationId) return;
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('fva_daily_history')
        .select('*')
        .eq('location_id', locationId)
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching forecast history:", error);
        setError("Could not load saved forecasts.");
      } else {
        setSavedForecasts(data);
      }
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [locationId, refreshData]); // Re-fetch when location changes or after a save

  // --- DATA GROUPING FOR ACCORDION ---
  const groupedForecasts = useMemo(() => {
    const groups = {};
    savedForecasts.forEach(forecast => {
      const forecastDate = new Date(forecast.date + 'T00:00:00'); // Ensure correct date parsing
      const startOfWeek = getStartOfWeek(forecastDate);
      const key = startOfWeek.toISOString().split('T')[0];
      if (!groups[key]) {
        groups[key] = { startDate: key, results: [] };
      }
      // Re-create the structure that ForecastWeekAccordion expects
      const dayName = DAY_ORDER[forecastDate.getDay() -1] || 'Sunday';
      groups[key].results.push({
        day: dayName,
        date: forecast.date,
        sales: forecast.forecast_sales,
        food: forecast.forecast_sales * forecast.food_cost_pct,
        bev: forecast.forecast_sales * forecast.bev_cost_pct,
        labor: forecast.forecast_sales * forecast.labor_cost_pct,
        // pax and guests are not stored, so we derive them or show 'N/A'
        pax: Math.round(forecast.forecast_sales / spendPerGuest / captureRate),
        guests: Math.round(forecast.forecast_sales / spendPerGuest),
      });
    });

    // Add total rows to each group
    Object.values(groups).forEach(group => {
      const totals = group.results.reduce((acc, row) => {
        acc.sales += row.sales || 0;
        acc.food += row.food || 0;
        acc.bev += row.bev || 0;
        acc.labor += row.labor || 0;
        acc.pax += row.pax || 0;
        acc.guests += row.guests || 0;
        return acc;
      }, { sales: 0, food: 0, bev: 0, labor: 0, pax: 0, guests: 0 });
      group.results.push({ ...totals, day: 'Total', isTotal: true });
    });

    return Object.values(groups).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [savedForecasts, spendPerGuest, captureRate]);


  // --- HANDLERS ---
  const handleWeekChange = useCallback((direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  }, []);

  const parseAndSaveForecast = useCallback(async () => {
    // ... (This function is correct and does not need changes)
    if (!locationId) {
      setError("Location is not available. Please wait or refresh the page.");
      return;
    }
    setError("");
    setIsSaving(true);

    try {
      const lines = emailInput.split('\n').map(l => l.trim()).filter(Boolean);
      const dateLine = lines.find(line => /^date\s*:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");

      const baseDateStr = dateLine.split(':')[1]?.trim();
      const baseDate = new Date(baseDateStr);
      if (isNaN(baseDate.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");

      const recordsToInsert = [];
      const datesToDelete = [];
      
      const dayRegex = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:\s*([0-9][0-9,]*)$/i;

      for (const line of lines) {
        const match = line.match(dayRegex);
        if (!match) continue;

        const dayName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const paxValue = parseInt(match[2].replace(/,/g, ''), 10);
        if (!Number.isFinite(paxValue)) continue;

        const dayIndex = DAY_ORDER.indexOf(dayName);
        if (dayIndex === -1) continue;

        const forecastDate = new Date(baseDate);
        forecastDate.setDate(forecastDate.getDate() + dayIndex);
        const dateString = forecastDate.toISOString().split('T')[0];
        
        datesToDelete.push(dateString);

        const guests = Math.round(paxValue * captureRate);
        const sales = guests * spendPerGuest;

        recordsToInsert.push({
          location_id: locationId,
          date: dateString,
          forecast_sales: sales,
          food_cost_pct: foodCostGoal,
          bev_cost_pct: bevCostGoal,
          labor_cost_pct: laborCostGoal,
        });
      }

      if (recordsToInsert.length === 0) throw new Error("No valid day data found to process.");

      const { error: deleteError } = await supabase.from('fva_daily_history').delete().eq('location_id', locationId).in('date', datesToDelete);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from('fva_daily_history').insert(recordsToInsert);
      if (insertError) throw insertError;

      toast({ title: "Forecast Saved!", description: `Your forecast for week of ${baseDate.toLocaleDateString()} has been saved.` });
      
      if (refreshData) refreshData();
      
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [ emailInput, toast, locationId, captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal, refreshData ]);

  // --- RENDER LOGIC ---
  if (loadingLocation) {
    return (
      <Card className="shadow-lg border-gray-200 bg-white flex items-center justify-center p-10">
        <div className="flex flex-col items-center text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <span className="font-semibold">Loading Location Data...</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-end">
        <AdminModeToggle />
      </div>

      {isAdminMode && <AdminPanel />}

      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader>
            <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg">
                <MailCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Forecast Center</CardTitle>
                <CardDescription className="text-gray-500">
                    Select a week, input daily traffic, and save your forecast.
                </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6 border">
              <Button variant="outline" onClick={() => handleWeekChange('prev')} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="text-center font-semibold text-gray-700">
                  <p>Editing Forecast For</p>
                  <p className="text-blue-600 font-semibold">{activeWeekStartDate.toLocaleDateString()}</p>
              </div>
              <Button variant="outline" onClick={() => handleWeekChange('next')} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100">
                  Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          </div>
          <div className="space-y-2 mb-6">
            <Label htmlFor="emailInput" className="text-sm font-medium text-gray-700">Weekly Traffic Data</Label>
            <Textarea
              id="emailInput"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Date: YYYY-MM-DD&#10;Monday: 12345&#10;Tuesday: 16000"
              className="min-h-[180px] text-sm font-mono bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"
            />
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={parseAndSaveForecast} 
              disabled={isSaving} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:bg-gray-400"
            >
              <TrendingUp className="mr-2 h-4 w-4" /> 
              {isSaving ? "Saving..." : "Parse & Save Forecast"}
            </Button>
          </motion.div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-200 flex items-start"
            >
              <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-600 flex-shrink-0" /> 
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* --- THIS IS THE MISSING PIECE --- */}
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
            Saved Forecasts
        </h3>
        {loadingHistory ? (
            <p className="text-gray-500">Loading history...</p>
        ) : groupedForecasts.length === 0 ? (
            <p className="text-gray-500">No saved forecasts found for this location.</p>
        ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
                {groupedForecasts.map(week => (
                    <ForecastWeekAccordion 
                        key={week.startDate} 
                        week={week}
                        amSplit={amSplit} // Pass the amSplit from adminSettings
                    />
                ))}
            </Accordion>
        )}
      </div>
    </motion.div>
  );
};

export default ForecastEmailParserBot;




















