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

// Helper functions
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  const { locationId } = useUserAndLocation();
  const { isAdminMode, adminSettings } = useData();
  const {
    captureRate,
    spendPerGuest,
    amSplit, // We will use this to pass down
    foodCostGoal,
    bevCostGoal,
    laborCostGoal,
  } = adminSettings;

  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [openAccordion, setOpenAccordion] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchAllForecasts = async () => {
      if (!locationId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from('weekly_forecasts')
        .select('location_id, date, day, pax, guests, sales, food, bev, labor')
        .eq('location_id', locationId);

      if (error) {
        setError("Could not load forecast history.");
        console.error(error);
      } else {
        setAllForecasts(data || []);
        if (!openAccordion) {
            const activeWeekId = getStartOfWeek(activeWeekStartDate).toISOString().split('T')[0];
            setOpenAccordion(activeWeekId);
        }
      }
      setIsLoading(false);
    };
    fetchAllForecasts();
  }, [locationId]);

  // Update text area
  useEffect(() => {
    const weekData = allForecasts.filter(f => {
      const forecastDate = new Date(f.date);
      const startOfWeek = getStartOfWeek(forecastDate);
      return startOfWeek.getTime() === activeWeekStartDate.getTime();
    });

    const dateString = `Date: ${activeWeekStartDate.toISOString().split('T')[0]}`;
    if (weekData.length > 0) {
      const sortedWeekData = weekData.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
      const paxData = sortedWeekData.map(day => `${day.day}: ${day.pax}`).join('\n');
      setEmailInput(`${dateString}\n${paxData}`);
    } else {
      setEmailInput(dateString);
    }
  }, [activeWeekStartDate, allForecasts]);

  // Week navigation
  const handleWeekChange = (direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // Save function
  const parseAndSaveForecast = useCallback(async () => {
    if (!locationId) {
        setError("No location selected. Cannot save forecast.");
        return;
    }
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

        // Calculations are done here, but only raw data is saved
        const guests = Math.round(pax * captureRate);
        const sales = guests * spendPerGuest;
        const food = sales * foodCostGoal;
        const bev = sales * bevCostGoal;
        const labor = sales * laborCostGoal;

        // *** LOGIC FIX: Only include columns that exist in the database ***
        recordsToUpsert.push({
          location_id: locationId,
          date: forecastDate.toISOString().split('T')[0],
          day,
          pax,
          guests,
          sales,
          food,
          bev,
          labor,
        });
      });

      if (recordsToUpsert.length === 0) throw new Error("No valid day data found to process.");

      const { error: upsertError } = await supabase.from('weekly_forecasts').upsert(recordsToUpsert, { onConflict: 'location_id, date' });
      if (upsertError) throw upsertError;

      setAllForecasts(prev => {
          const updated = prev.filter(p => !recordsToUpsert.some(nr => nr.date === p.date && p.location_id === nr.location_id));
          return [...updated, ...recordsToUpsert].sort((a, b) => new Date(a.date) - new Date(b.date));
      });
      
      const weekId = getStartOfWeek(baseDate).toISOString().split('T')[0];
      setOpenAccordion(weekId);

      toast({
        title: "Forecast Saved!",
        description: `${recordsToUpsert.length} days have been saved.`,
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (e) {
      setError(`Error: ${e.message}`);
      console.error("Forecast generation error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [ emailInput, toast, locationId, captureRate, spendPerGuest, foodCostGoal, bevCostGoal, laborCostGoal ]);

  // Group data for display
  const groupedForecasts = useMemo(() => {
    const groups = {};
    allForecasts.forEach(forecast => {
      const startOfWeek = getStartOfWeek(new Date(forecast.date));
      const key = startOfWeek.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = { startDate: key, results: [] };
      groups[key].results.push(forecast);
    });

    Object.values(groups).forEach(group => {
        const totals = group.results.reduce((acc, row) => ({
            pax: acc.pax + (row.pax || 0),
            guests: acc.guests + (row.guests || 0),
            sales: acc.sales + (row.sales || 0),
            food: acc.food + (row.food || 0),
            bev: acc.bev + (row.bev || 0),
            labor: acc.labor + (row.labor || 0),
        }), { pax: 0, guests: 0, sales: 0, food: 0, bev: 0, labor: 0 });
        group.results.push({ ...totals, day: 'Total', isTotal: true });
    });

    return Object.values(groups).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [allForecasts]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* ... Admin Toggle and Panel ... */}
      <div className="flex justify-end"> <AdminModeToggle /> </div>
      {isAdminMode && <AdminPanel />}

      {/* ... Main Card ... */}
      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader> {/* ... */} </CardHeader>
        <CardContent> {/* ... */} </CardContent>
      </Card>

      {/* ... Saved Forecasts Section ... */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 mb-4">
            Saved Forecasts
        </h3>
        {isLoading && allForecasts.length === 0 && <p className="text-gray-500">Loading history...</p>}
        {!isLoading && groupedForecasts.length === 0 && <p className="text-gray-500">No saved forecasts found.</p>}
        
        <Accordion 
          type="single" 
          collapsible 
          value={openAccordion} 
          onValueChange={setOpenAccordion}
          className="space-y-4"
        >
          {groupedForecasts.map(week => (
              <ForecastWeekAccordion 
                  key={week.startDate} 
                  week={week}
                  amSplit={amSplit} // *** LOGIC FIX: Pass amSplit down ***
              />
          ))}
        </Accordion>
      </div>
    </motion.div>
  );
};

export default ForecastEmailParserBot;








