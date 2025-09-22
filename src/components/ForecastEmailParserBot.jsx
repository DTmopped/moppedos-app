import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import ForecastWeekAccordion from "./forecast/ForecastWeekAccordion.jsx";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";
import { useData } from "@/contexts/DataContext";
import AdminPanel from "./forecast/AdminPanel.jsx";
import AdminModeToggle from "@/components/ui/AdminModeToggle";
import { Accordion } from "@/components/ui/accordion";

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  const { locationId } = useUserAndLocation();
  const { isAdminMode, adminSettings, refreshData } = useData(); // Assuming refreshData exists in your context to refetch FVA data
  const { captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal } = adminSettings;

  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [openAccordion, setOpenAccordion] = useState(null);

  // This useEffect should now fetch from fva_daily_history to show existing forecasts
  useEffect(() => {
    const fetchForecastsForEditor = async () => {
      if (!locationId) return;
      const { data, error } = await supabase
        .from('fva_daily_history')
        .select('date, day, pax, forecast_sales') // Select only what's needed for the editor
        .eq('location_id', locationId);
      
      if (error) {
        console.error("Error fetching forecast history for editor:", error);
      } else {
        setAllForecasts(data || []);
      }
    };
    fetchForecastsForEditor();
  }, [locationId]);

  useEffect(() => {
    const weekData = allForecasts.filter(f => getStartOfWeek(new Date(f.date)).getTime() === activeWeekStartDate.getTime());
    const dateString = `Date: ${activeWeekStartDate.toISOString().split('T')[0]}`;
    if (weekData.length > 0) {
      const sortedWeekData = weekData.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
      // Assuming 'pax' exists in fva_daily_history. If not, this needs adjustment.
      const paxData = sortedWeekData.map(day => `${day.day}: ${day.pax || Math.round(day.forecast_sales / spendPerGuest / captureRate)}`).join('\n');
      setEmailInput(`${dateString}\n${paxData}`);
    } else {
      setEmailInput(dateString);
    }
  }, [activeWeekStartDate, allForecasts, spendPerGuest, captureRate]);

  const parseAndSaveForecast = useCallback(async () => {
    if (!locationId) { setError("No location selected."); return; }
    setError("");
    setIsLoading(true);

    try {
      const lines = emailInput.trim().split("\n");
      const dateLine = lines.find(line => /date:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");
      
      const baseDate = new Date(dateLine.split(":")[1].trim());
      const recordsToUpsert = [];

      lines.forEach(line => {
        const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*([0-9,]+)/i);
        if (!match) return;

        const day = match[1];
        const pax = parseInt(match[2].replace(/,/g, ''), 10);
        const dayIndex = DAY_ORDER.indexOf(day);
        if (dayIndex === -1) return;

        const forecastDate = new Date(baseDate);
        forecastDate.setDate(forecastDate.getDate() + dayIndex);

        const guests = Math.round(pax * captureRate);
        const sales = guests * spendPerGuest;

        recordsToUpsert.push({
          location_id: locationId,
          date: forecastDate.toISOString().split('T')[0],
          day: day,
          pax: pax,
          forecast_sales: sales,
          food_cost_pct: foodCostGoal,
          bev_cost_pct: bevCostGoal,
          labor_cost_pct: laborCostGoal,
        });
      });

      if (recordsToUpsert.length === 0) throw new Error("No valid day data found to process.");

      const { error: upsertError } = await supabase
        .from('fva_daily_history')
        .upsert(recordsToUpsert, { onConflict: 'location_id, date' }); 

      if (upsertError) throw upsertError;

      toast({ title: "Forecast Saved!", description: `Forecast data has been saved. The FVA dashboard will now reflect these numbers.` });
      
      // Trigger a refresh of the app's main data context so the FVA dashboard updates
      if (refreshData) {
        refreshData();
      }
      
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [ emailInput, toast, locationId, captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal, refreshData ]);

  // The accordion display can be simplified or removed, as the main FVA dashboard is the source of truth
  // For now, we'll leave it to show what was just saved.
  const groupedForecasts = useMemo(() => {
    // This grouping logic would need to be adapted if we still want to show accordions
    // based on the data now being saved to fva_daily_history.
    return []; // Simplified for now.
  }, []);

  return (
    <motion.div>
        {/* ... Your UI for parsing and saving ... */}
        {/* The "Saved Forecasts" accordion section is now redundant, as the main FVA dashboard serves this purpose.
            You can choose to remove it or adapt it to read from the fva_daily_history table. */}
    </motion.div>
  );
};

export default ForecastEmailParserBot;










