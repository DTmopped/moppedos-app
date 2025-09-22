import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient"; // --- NEW --- Ensure this path is correct
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, Info, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import ForecastWeekAccordion from "./ForecastWeekAccordion.jsx"; // --- NEW --- Import the accordion

// --- NEW --- Helper functions
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  // --- NEW --- State for multi-week functionality
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Existing State ---
  const [emailInput, setEmailInput] = useState("");
  const [captureRateInput, setCaptureRateInput] = useState("8.0");
  const [avgSpendInput, setAvgSpendInput] = useState("40");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // --- NEW --- Fetch all data from Supabase on initial load
  useEffect(() => {
    const fetchAllForecasts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('weekly_forecasts').select('*'); // Use your table name
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

  // --- NEW --- Effect to update the textarea when the active week or data changes
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

  // --- NEW --- Week navigation handlers
  const handleWeekChange = (direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // --- NEW --- Updated save/generate function
  const parseAndSaveForecast = useCallback(async () => {
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

      setAllForecasts(prev => {
          const updated = prev.filter(p => !recordsToUpsert.some(nr => nr.date === p.date));
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
  }, [emailInput, captureRateInput, avgSpendInput, toast]);

  // --- NEW --- Group data for accordion display
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
        }), { pax: 0, guests: 0, sales: 0 });
        group.results.push({ ...totals, day: 'Total', isTotal: true });
    });

    return Object.values(groups).sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // Show newest first
  }, [allForecasts]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <CardHeader>
            {/* ... Your existing CardHeader content ... */}
        </CardHeader>
        <CardContent>
          {/* --- NEW --- Week Selector */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg mb-6">
              <Button variant="outline" onClick={() => handleWeekChange('prev')} className="bg-slate-700 border-slate-600">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="text-center font-semibold text-slate-200">
                  <p>Editing Forecast For</p>
                  <p className="text-teal-400">{activeWeekStartDate.toLocaleDateString()}</p>
              </div>
              <Button variant="outline" onClick={() => handleWeekChange('next')} className="bg-slate-700 border-slate-600">
                  Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="emailInput" className="text-sm font-medium text-slate-300">Weekly Forecast Data</Label>
            <Textarea
              id="emailInput"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="min-h-[180px] text-sm font-mono bg-slate-800 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ... Your Capture Rate and Spend Inputs ... */}
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={parseAndSaveForecast} className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 ...">
              <TrendingUp className="mr-2 h-4 w-4" /> 
              {isLoading ? "Saving..." : "Parse & Save Forecast"}
            </Button>
          </motion.div>
          {error && ( /* ... Your error display ... */ )}
        </CardContent>
      </Card>

      {/* --- NEW --- Collapsible Results Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
            Saved Forecasts
        </h3>
        {isLoading && allForecasts.length === 0 && <p className="text-slate-400">Loading history...</p>}
        {!isLoading && groupedForecasts.length === 0 && <p className="text-slate-400">No saved forecasts found.</p>}
        {groupedForecasts.map(week => (
            <ForecastWeekAccordion 
                key={week.startDate} 
                week={week}
                isInitiallyOpen={getStartOfWeek(new Date(week.startDate)).getTime() === activeWeekStartDate.getTime()}
            />
        ))}
      </div>
    </motion.div>
  );
};

export default ForecastEmailParserBot;


