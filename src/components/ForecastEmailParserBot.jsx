import React, { useState, useEffect, useCallback } from "react";
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
  const { captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal } = adminSettings;
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [isSaving, setIsSaving] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // --- EFFECTS ---
  useEffect(() => {
    if (!loadingLocation && locationId) {
      // AI Patch: Remove trailing spaces for cleaner input
      const dateString = `Date: ${activeWeekStartDate.toISOString().split('T')[0]}`;
      setEmailInput(
        `${dateString}\nMonday:\nTuesday:\nWednesday:\nThursday:\nFriday:\nSaturday:\nSunday:`
      );
    }
  }, [activeWeekStartDate, loadingLocation, locationId]);

  // --- HANDLERS ---
  const handleWeekChange = useCallback((direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  }, []);

  const parseAndSaveForecast = useCallback(async () => {
    if (!locationId) {
      setError("Location is not available. Please wait or refresh the page.");
      return;
    }
    setError("");
    setIsSaving(true);

    try {
      // AI Patch: More robust line parsing
      const lines = emailInput.split('\n').map(l => l.trim()).filter(Boolean);
      const dateLine = lines.find(line => /^date\s*:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");

      const baseDateStr = dateLine.split(':')[1]?.trim();
      const baseDate = new Date(baseDateStr);
      if (isNaN(baseDate.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");

      const recordsToInsert = [];
      const datesToDelete = [];
      
      // AI Patch: More tolerant regex
      const dayRegex = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:\s*([0-9][0-9,]*)$/i;

      for (const line of lines) {
        const match = line.match(dayRegex);
        if (!match) continue;

        const dayName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const paxValue = parseInt(match[2].replace(/,/g, ''), 10);
        if (!Number.isFinite(paxValue)) continue;

        const dayIndex = DAY_ORDER.indexOf(dayName);
        if (dayIndex === -1) continue;

        // AI Patch: Correctly calculate date based on the parsed baseDate
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
          {/* ... CardHeader content ... */}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6 border">
              {/* AI Patch: Pass direction to handleWeekChange */}
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
          {/* ... Rest of the JSX ... */}
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
    </motion.div>
  );
};

export default ForecastEmailParserBot;




















