import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { Accordion } from "@/components/ui/accordion";
import { MailCheck, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/supabaseClient"; // Import supabase directly
import AdminPanel from "./forecast/AdminPanel.jsx";
import AdminModeToggle from "@/components/ui/AdminModeToggle";
import ForecastWeekAccordion from "./forecast/ForecastWeekAccordion.jsx";
import { saveForecastToSupabase } from "./forecast/saveForecast";

const getStartOfWeekUTC = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  const { 
    loadingLocation, 
    isAdminMode, 
    adminSettings,
    locationId // ✅ Correct variable name from DataContext
  } = useData();
  
  const { captureRate, spendPerGuest, amSplit, foodCostGoal, bevCostGoal, laborCostGoal } = adminSettings;
  
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeekUTC(new Date()));
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [savedForecasts, setSavedForecasts] = useState({});
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging for production troubleshooting
  useEffect(() => {
    if (!loadingLocation) {
      console.log('DataContext locationId:', locationId);
      console.log('Loading location complete:', !loadingLocation);
    }
  }, [loadingLocation, locationId]);

  // Function to load existing forecasts from Supabase
  const loadExistingForecasts = useCallback(async () => {
    // ✅ Guard: Don't load if still loading location or no locationId
    if (loadingLocation || !locationId) {
      console.log('Skipping forecast load - loadingLocation:', loadingLocation, 'locationId:', locationId);
      return;
    }
    
    setIsLoadingForecasts(true);
    try {
      console.log('Loading forecasts for locationId:', locationId);
      
      const { data, error } = await supabase
        .from('fva_daily_history')
        .select('*')
        .eq('location_id', locationId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Loaded forecast data:', data?.length || 0, 'records');

      // Group by week
      const groupedByWeek = {};
      data?.forEach(row => {
        const date = new Date(row.date + 'T00:00:00Z'); // Ensure UTC
        const weekStart = getStartOfWeekUTC(date).toISOString().split('T')[0];
        
        if (!groupedByWeek[weekStart]) {
          groupedByWeek[weekStart] = [];
        }
        
        // Convert Supabase data back to UI format
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        const guests = Math.round(row.forecast_sales / spendPerGuest);
        const pax = Math.round(guests / captureRate);
        const amGuests = Math.round(guests * amSplit);
        const pmGuests = guests - amGuests;
        
        groupedByWeek[weekStart].push({
          day: dayName,
          date: row.date,
          pax: pax,
          guests: guests,
          amGuests: amGuests,
          pmGuests: pmGuests,
          sales: row.forecast_sales,
          food: row.forecast_sales * row.food_cost_pct,
          bev: row.forecast_sales * row.bev_cost_pct,
          labor: row.forecast_sales * row.labor_cost_pct,
        });
      });

      // Add totals for each week and sort days
      Object.keys(groupedByWeek).forEach(weekStart => {
        const weekData = groupedByWeek[weekStart];
        
        // Sort days in correct order
        weekData.sort((a, b) => {
          const aIndex = DAY_ORDER.indexOf(a.day);
          const bIndex = DAY_ORDER.indexOf(b.day);
          return aIndex - bIndex;
        });
        
        // Calculate totals
        const totals = weekData.reduce((acc, row) => ({
          pax: acc.pax + row.pax,
          guests: acc.guests + row.guests,
          sales: acc.sales + row.sales,
          food: acc.food + row.food,
          bev: acc.bev + row.bev,
          labor: acc.labor + row.labor,
        }), { pax: 0, guests: 0, sales: 0, food: 0, bev: 0, labor: 0 });
        
        weekData.push({ day: "Total", ...totals, isTotal: true });
      });

      setSavedForecasts(groupedByWeek);
    } catch (error) {
      console.error('Error loading forecasts:', error);
      setError(`Error loading saved forecasts: ${error.message}`);
    } finally {
      setIsLoadingForecasts(false);
    }
  }, [locationId, loadingLocation, captureRate, spendPerGuest, amSplit]);

  // ✅ Only load forecasts when location is ready
  useEffect(() => {
    if (!loadingLocation && locationId) {
      loadExistingForecasts();
    }
  }, [loadingLocation, locationId, loadExistingForecasts]);

  // Load existing data for the active week into the textarea
  useEffect(() => {
    if (!loadingLocation && locationId) {
      const activeWeekKey = activeWeekStartDate.toISOString().split('T')[0];
      const existingWeekData = savedForecasts[activeWeekKey];
      
      if (existingWeekData && existingWeekData.length > 0) {
        // Populate textarea with existing data
        const nonTotalRows = existingWeekData.filter(row => !row.isTotal);
        let inputText = `Date: ${activeWeekKey}\n`;
        
        nonTotalRows.forEach(row => {
          inputText += `${row.day}: ${row.pax}\n`;
        });
        
        setEmailInput(inputText.trim());
      } else {
        // Default empty template
        const dateString = activeWeekKey;
        setEmailInput(`Date: ${dateString}\nMonday:\nTuesday:\nWednesday:\nThursday:\nFriday:\nSaturday:\nSunday:`);
      }
    }
  }, [activeWeekStartDate, loadingLocation, locationId, savedForecasts]);

  const handleWeekChange = useCallback((direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setUTCDate(newDate.getUTCDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
    setError(""); // Clear errors when changing weeks
    setSuccess(""); // Clear success messages
    setForecastDataUI([]); // Clear current display
  }, []);

  const generateForecast = useCallback(async () => {
    // ✅ Guard: Check if location is still loading
    if (loadingLocation) {
      setError("Please wait for location data to load.");
      return;
    }

    // ✅ Guard: Check if locationId is available
    if (!locationId) {
      setError("Missing location ID. Please ensure you're properly logged in.");
      return;
    }

    setError("");
    setSuccess("");
    setForecastDataUI([]);
    setIsSaving(true);

    try {
      console.log('Starting forecast generation for locationId:', locationId);

      const lines = emailInput.split('\n').map(l => l.trim()).filter(Boolean);
      const dateLine = lines.find(line => /^date\s*:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");

      const baseDateStr = dateLine.split(':')[1]?.trim();
      const baseDate = new Date(`${baseDateStr}T00:00:00Z`);
      if (isNaN(baseDate.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");

      // Parse the days from input
      const days = {};
      const dayRegex = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:\s*([0-9][0-9,]*)$/i;

      for (const line of lines) {
        const match = line.match(dayRegex);
        if (!match) continue;

        const dayName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const paxValue = match[2];
        days[dayName] = paxValue;
      }

      if (Object.keys(days).length === 0) throw new Error("No valid day data found to process.");

      console.log('Parsed days:', days);
      console.log('Saving with locationId:', locationId);

      // Save to Supabase using the provided function
      const result = await saveForecastToSupabase({
        supabase,
        locationId, // ✅ Using correct variable name
        baseDate,
        days,
        captureRate,
        spendPerGuest,
        foodCostGoal,
        bevCostGoal,
        laborCostGoal
      });

      console.log('Save result:', result);

      // Show success message
      setSuccess(`Successfully saved forecast for ${result.count} days!`);

      // Reload forecasts to update the accordion
      await loadExistingForecasts();

      // Clear the preview since it's now saved and will show in accordion
      setForecastDataUI([]);

    } catch (e) {
      console.error('Forecast generation error:', e);
      setError(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [emailInput, locationId, loadingLocation, captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal, loadExistingForecasts]);

  // ✅ Show loading state until location is ready
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

  // ✅ Show error if no location ID after loading
  if (!locationId) {
    return (
      <Card className="shadow-lg border-gray-200 bg-white">
        <CardContent className="text-center py-10">
          <div className="text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Location Not Found</p>
            <p className="text-sm">Please ensure you're properly logged in and have a location assigned.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeWeekKey = activeWeekStartDate.toISOString().split('T')[0];
  const hasExistingForecast = savedForecasts[activeWeekKey];

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
                    Select a week, input daily traffic, and generate a forecast.
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
                  <p className="text-blue-600 font-semibold">{activeWeekStartDate.toLocaleDateString('en-US', {timeZone: 'UTC'})}</p>
                  {hasExistingForecast && (
                    <p className="text-xs text-green-600 mt-1">✓ Forecast exists</p>
                  )}
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
              onClick={generateForecast} 
              disabled={isSaving || loadingLocation || !locationId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Forecast...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" /> 
                  Generate & Save Forecast
                </>
              )}
            </Button>
          </motion.div>
          
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200 flex items-start"
            >
              <CheckCircle size={18} className="mr-2 mt-0.5 text-green-600 flex-shrink-0" /> 
              <span>{success}</span>
            </motion.div>
          )}
          
          {/* Error Message */}
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

      {/* Display all saved forecasts in accordion format */}
      {isLoadingForecasts ? (
        <Card className="shadow-lg border-gray-200 bg-white flex items-center justify-center p-10">
          <div className="flex flex-col items-center text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-sm">Loading saved forecasts...</span>
          </div>
        </Card>
      ) : Object.keys(savedForecasts).length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
            Saved Forecasts
          </h3>
          <Accordion type="multiple" className="w-full space-y-2">
            {Object.entries(savedForecasts)
              .sort(([a], [b]) => new Date(b) - new Date(a)) // Most recent first
              .map(([startDate, results]) => (
                <ForecastWeekAccordion 
                  key={startDate}
                  week={{ startDate, results }}
                  amSplit={amSplit}
                />
              ))}
          </Accordion>
        </div>
      ) : (
        <Card className="shadow-lg border-gray-200 bg-white">
          <CardContent className="text-center py-10">
            <div className="text-gray-500">
              <MailCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Saved Forecasts</p>
              <p className="text-sm">Generate your first forecast to see it appear here.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ForecastEmailParserBot;























