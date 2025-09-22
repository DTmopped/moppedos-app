import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";
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
  const { locationId } = useUserAndLocation(); 
  const { isAdminMode, adminSettings, refreshData } = useData();
  const { captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal } = adminSettings;

  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // A new state to explicitly track if the locationId is valid
  const [isLocationIdValid, setIsLocationIdValid] = useState(false);

  useEffect(() => {
    // This effect now validates the locationId whenever it changes.
    if (locationId && typeof locationId === 'string' && locationId.length > 1) {
        setIsLocationIdValid(true);
    } else {
        setIsLocationIdValid(false);
    }
  }, [locationId]);

  useEffect(() => {
    const dateString = `Date: ${activeWeekStartDate.toISOString().split('T')[0]}`;
    setEmailInput(dateString + "\nMonday: \nTuesday: \nWednesday: \nThursday: \nFriday: \nSaturday: \nSunday: ");
  }, [activeWeekStartDate]);

  const handleWeekChange = (direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const parseAndSaveForecast = useCallback(async () => {
    if (!isLocationIdValid) { 
      setError("Location ID is not yet available. Please wait a moment and try again."); 
      return; 
    }
    setError("");
    setIsLoading(true);

    try {
      const lines = emailInput.trim().split("\n");
      const dateLine = lines.find(line => /date:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");
      
      const baseDate = new Date(dateLine.split(":")[1].trim());
      const recordsToInsert = [];
      const datesToDelete = [];

      lines.forEach(line => {
        const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*([0-9,]+)/i);
        if (!match || !match[2]) return;

        const dayName = match[1];
        const paxValue = parseInt(match[2].replace(/,/g, ''), 10);
        if (isNaN(paxValue)) return;

        const dayIndex = DAY_ORDER.indexOf(dayName);
        if (dayIndex === -1) return;

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
      });

      if (recordsToInsert.length === 0) throw new Error("No valid day data found to process.");

      const { error: deleteError } = await supabase
        .from('fva_daily_history')
        .delete()
        .eq('location_id', locationId)
        .in('date', datesToDelete);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('fva_daily_history')
        .insert(recordsToInsert);

      if (insertError) throw insertError;

      toast({ title: "Forecast Saved!", description: `Your forecast has been saved and the FVA dashboard has been updated.` });
      
      if (refreshData) {
        refreshData();
      }
      
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [ emailInput, toast, locationId, isLocationIdValid, captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal, refreshData ]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-end">
        <AdminModeToggle />
      </div>

      {isAdminMode && <AdminPanel />}

      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader>
            {/* ... Card Header UI ... */}
        </CardHeader>
        <CardContent>
            {/* ... Week Navigation and Textarea UI ... */}
          
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={parseAndSaveForecast} 
              // Disable the button if locationId is not valid OR if it's already loading
              disabled={!isLocationIdValid || isLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <TrendingUp className="mr-2 h-4 w-4" /> 
              {isLoading ? "Saving..." : (isLocationIdValid ? "Parse & Save Forecast" : "Loading Location...")}
            </Button>
          </motion.div>
          {error && (
            <motion.div>
                {/* ... Error Display UI ... */}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ForecastEmailParserBot;
















