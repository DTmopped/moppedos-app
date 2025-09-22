import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, Info, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import ForecastWeekAccordion from "./forecast/ForecastWeekAccordion.jsx";
import { useUserAndLocation } from "@/hooks/useUserAndLocation"; // ✅ 1. Import the hook to get locationId

// --- Helper functions ---
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  const { locationId } = useUserAndLocation(); // ✅ 2. Get the current locationId from your context/hook
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [captureRateInput, setCaptureRateInput] = useState("8.0");
  const [avgSpendInput, setAvgSpendInput] = useState("40");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // --- Fetch data for the CURRENT location ---
  useEffect(() => {
    const fetchAllForecasts = async () => {
      if (!locationId) return; // ✅ Don't fetch if no location is selected
      setIsLoading(true);
      
      // ✅ 3. Add .eq('location_id', locationId) to the query
      const { data, error } = await supabase
        .from('weekly_forecasts')
        .select('*')
        .eq('location_id', locationId); 

      if (error) {
        setError("Could not load forecast history for this location.");
        console.error(error);
      } else {
        setAllForecasts(data || []);
      }
      setIsLoading(false);
    };
    fetchAllForecasts();
  }, [locationId]); // ✅ Re-fetch if the locationId changes

  // --- Effect to update textarea (no changes needed here) ---
  useEffect(() => {
    const weekData = allForecasts.filter(f => {
      const forecastDate = new Date(f.date);
      const startOfWeek = getStartOfWeek(forecastDate);
      return startOfWeek.getTime() === activeWeekStartDate.getTime();
    });

    const dateString = `Date: ${activeWeekStartDate.toISOString().split('T')[0]}`;
    if (weekData.length > 0) {
      const paxData = weekData.map(day => `${day.day}: ${day.pax}`).join('\n');
      setEmailInput(`${dateString}\n${paxData}`);
    } else {
      setEmailInput(dateString);
    }
  }, [activeWeekStartDate, allForecasts]);

  // --- Week navigation handlers (no changes needed here) ---
  const handleWeekChange = (direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // --- Updated save/generate function ---
  const parseAndSaveForecast = useCallback(async () => {
    if (!locationId) { // ✅ Check for locationId before saving
        setError("No location selected. Cannot save forecast.");
        return;
    }
    setError("");
    setIsLoading(true);

    const capture = parseFloat(captureRateInput) / 100;
    const spend = parseFloat(avgSpendInput);
    if (isNaN(capture) || isNaN(spend) || !emailInput.trim()) {
      setError("Invalid inputs. Check capture rate, spend, and traffic data.");
      setIsLoading(false);
      return;
    }

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

        const guests = Math.round(pax * capture);
        const sales = guests * spend;

        recordsToUpsert.push({
          location_id: locationId, // ✅ 4. Add location_id to every record
          date: forecastDate.toISOString().split('T')[0],
          day,
          pax,
          guests,
          sales,
        });
      });

      if (recordsToUpsert.length === 0) throw new Error("No valid day data found to process.");

      // ✅ 5. Use the composite key for the onConflict clause
      const { error: upsertError } = await supabase.from('weekly_forecasts').upsert(recordsToUpsert, { onConflict: 'location_id, date' });
      if (upsertError) throw upsertError;

      setAllForecasts(prev => {
          const updated = prev.filter(p => !recordsToUpsert.some(nr => nr.date === p.date && p.location_id === nr.location_id));
          return [...updated, ...recordsToUpsert].sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      toast({
        title: "Forecast Saved!",
        description: `${recordsToUpsert.length} days for week starting ${baseDate.toLocaleDateString()} have been saved.`,
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (e) {
      setError(`Error: ${e.message}`);
      console.error("Forecast generation error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [emailInput, captureRateInput, avgSpendInput, toast, locationId]); // ✅ Add locationId to dependency array

  // --- Group data for accordion display (no changes needed here) ---
  const groupedForecasts = useMemo(() => {
    // ... same grouping logic as before
  }, [allForecasts]);

  // --- JSX RETURN (no changes needed here) ---
  return (
    <motion.div>
        {/* ... all your existing JSX ... */}
    </motion.div>
  );
};

export default ForecastEmailParserBot;



