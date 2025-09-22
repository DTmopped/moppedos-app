import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient"; // Ensure this path is correct
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { PlaneTakeoff, TrendingUp, Info, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "./ui/use-toast.jsx";
import ForecastWeekAccordion from "./ForecastWeekAccordion.jsx"; // Import the new component

// --- HELPER FUNCTIONS ---
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TerminalForecast = () => {
  // --- STATE MANAGEMENT ---
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [trafficInput, setTrafficInput] = useState("");
  const [captureRate, setCaptureRate] = useState("7.5");
  const [avgSpend, setAvgSpend] = useState("15");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchAllForecasts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('weekly_forecasts').select('*');
      if (error) {
        setError("Could not load forecast history.");
        console.error(error);
      } else {
        setAllForecasts(data || []);
      }
      setIsLoading(false);
    };
    fetchAllForecasts();
  }, []);

  // --- EFFECT TO POPULATE TEXTAREA ON WEEK CHANGE ---
  useEffect(() => {
    const weekData = allForecasts.filter(f => {
      const forecastDate = new Date(f.date);
      const startOfWeek = getStartOfWeek(forecastDate);
      return startOfWeek.getTime() === activeWeekStartDate.getTime();
    });

    const dateString = `Date: ${new Date(activeWeekStartDate).toISOString().split('T')[0]}`;
    if (weekData.length > 0) {
      const paxData = weekData.map(day => `${day.day}: ${day.pax}`).join('\n');
      setTrafficInput(`${dateString}\n${paxData}`);
    } else {
      setTrafficInput(dateString);
    }
  }, [activeWeekStartDate, allForecasts]);

  // --- FORECAST GENERATION & SAVING ---
  const generateTerminalForecast = useCallback(async () => {
    setError("");
    setIsLoading(true);

    const capture = parseFloat(captureRate) / 100;
    const spend = parseFloat(avgSpend);
    if (isNaN(capture) || isNaN(spend) || !trafficInput.trim()) {
      setError("Invalid inputs. Check capture rate, spend, and traffic data.");
      setIsLoading(false);
      return;
    }

    try {
      const lines = trafficInput.trim().split("\n");
      const dateLine = lines.find(line => /date:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");
      
      const baseDate = new Date(dateLine.split(":")[1].trim());
      const recordsToUpsert = [];

      lines.forEach(line => {
        const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*(\d+)/i);
        if (!match) return;

        const day = match[1];
        const pax = parseInt(match[2], 10);
        const dayIndex = DAY_ORDER.indexOf(day);
        if (dayIndex === -1) return;

        const forecastDate = new Date(baseDate);
        forecastDate.setDate(forecastDate.getDate() + dayIndex);

        const guests = Math.round(pax * capture);
        const sales = guests * spend;

        recordsToUpsert.push({
          date: forecastDate.toISOString().split('T')[0],
          day,
          pax,
          guests,
          sales,
          // Add other cost fields if your table has them
        });
      });

      if (recordsToUpsert.length === 0) throw new Error("No valid day data found to process.");

      const { error: upsertError } = await supabase.from('weekly_forecasts').upsert(recordsToUpsert, { onConflict: 'date' });
      if (upsertError) throw upsertError;

      // Refresh local state
      setAllForecasts(prev => {
          const updated = [...prev.filter(p => !recordsToUpsert.some(nr => nr.date === p.date))];
          return [...updated, ...recordsToUpsert].sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      toast({
        title: "Forecast Saved!",
        description: `${recordsToUpsert.length} days for week starting ${baseDate.toLocaleDateString()} have been saved.`,
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (e) {
      setError(`Error: ${e.message}`);
      console.error("Forecast generation

