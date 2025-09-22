import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient"; // Ensure this path is correct
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, Info, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import ForecastWeekAccordion from "./ForecastWeekAccordion.jsx"; // Import the new component

// --- HELPER FUNCTIONS ---
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};
const formatDate = (date) => date.toISOString().split('T')[0];
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  // --- STATE MANAGEMENT ---
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [captureRate, setCaptureRate] = useState("8.0");
  const [avgSpend, setAvgSpend] = useState("40");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // --- DATA FETCHING from Supabase ---
  useEffect(() => {
    const fetchForecasts = async () => {
      setIsLoading(true);
      const fromDate = new Date(new Date().setDate(new Date().getDate() - 28));
      const toDate = new Date(new Date().setDate(new Date().getDate() + 56));

      const { data, error } = await supabase
        .from('weekly_forecasts') // Ensure this is your table name
        .select('*')
        .gte('date', formatDate(fromDate))
        .lte('date', formatDate(toDate))
        .order('date', { ascending: true });

      if (error) {
        setError("Could not fetch forecast history.");
        console.error("Supabase fetch error:", error);
      } else {
        setAllForecasts(data || []);
      }
      setIsLoading(false);
    };
    fetchForecasts();
  }, []);

  // --- LOGIC to update input text when week changes ---
  useEffect(() => {
    const weekData = allForecasts.filter(f => {
      const forecastDate = new Date(f.date);
      const startOfWeek = getStartOfWeek(forecastDate);
      return startOfWeek.getTime() === activeWeekStartDate.getTime();
    });

    const text = `Date: ${formatDate(activeWeekStartDate)}\n` +
      (weekData.length > 0 ? weekData.map(day => `${day.day}: ${day.pax}`).join('\n') : "");
    setEmailInput(text);
  }, [activeWeekStartDate, allForecasts]);

  // --- SAVE LOGIC (UPDATED) ---
  const parseAndSaveForecast = useCallback(async () => {
    setError("");
    setIsLoading(true);

    const capture = parseFloat(captureRate) / 100;
    const spend = parseFloat(avgSpend);
    if (isNaN(capture) || isNaN(spend) || capture <= 0 || spend <= 0) {
        setError("Invalid Capture Rate or Average Spend.");
        setIsLoading(false);
        return;
    }

    try {
        const lines = emailInput.trim().split("\n");
        const recordsToUpsert = [];
        let baseDate = null;

        const dateLine = lines.find(line => /^date:/i.test(line.trim()));
        if (dateLine) baseDate = new Date(dateLine.split(":")[1].trim());
        if (!baseDate || isNaN(baseDate.getTime())) throw new Error("A valid 'Date: YYYY-MM-DD' line is required.");

        const dayData = {};
        lines.forEach(line => {
            const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*([0-9,]+)/i);
            if (match) dayData[match[1]] = parseInt(match[2].replace(/,/g, ''));
        });

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dayName = DAY_ORDER[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];
            
            const pax = dayData[dayName] || 0;
            const guests = pax * capture;
            const sales = guests * spend;

            recordsToUpsert.push({
                date: formatDate(currentDate),
                day: dayName,
                pax,
                guests,
                sales,
                // Add other cost columns if needed
            });
        }

        const { error: upsertError } = await supabase
            .from('weekly_forecasts')
            .upsert(recordsToUpsert, { onConflict: 'date' });

        if (upsertError) throw upsertError;

        toast({
            title: "Forecast Saved!",
            description: `Forecast for the week of ${formatDate(baseDate)} has been saved successfully.`,
            action: <CheckCircle className="text-green-500" />,
        });

        // Refresh local state
        setAllForecasts(prev => {
            const updated = [...prev.filter(p => !recordsToUpsert.some(r => r.date === p.date))];
            return [...updated, ...recordsToUpsert].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

    } catch (err) {
        setError(`Failed to save forecast: ${err.message}`);
        console.error("Save Error:", err);
    } finally {
        setIsLoading(false);
    }
  }, [emailInput, captureRate, avgSpend, toast]);

  // --- WEEK NAVIGATION ---
  const handleWeekChange = (direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // --- DATA GROUPING for display ---
  const groupedForecasts = useMemo(() => {
    const groups = {};
    allForecasts.forEach(forecast => {
      const startOfWeek = getStartOfWeek(new Date(forecast.date));
      const key = formatDate(startOfWeek);
      if (!groups[key]) groups[key] = { startDate: key, results: [] };
      groups[key].results.push(forecast);
    });

    Object.values(groups).forEach(group => {
        const totals = group.results.reduce((acc, row) => ({
            guests: acc.guests + row.guests,
            sales: acc.sales + row.sales,
        }), { guests: 0, sales: 0 });
        group.results.push({ ...totals, day: 'Total', isTotal: true });
    });

    return Object.values(groups).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [allForecasts]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-600 shadow-lg">
              <MailCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">Forecast Center</CardTitle>
              <CardDescription className="text-slate-400">
                Select a week, paste forecast data, and save. View all weekly forecasts below.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* --- NEW: Week Selector UI --- */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg mb-6">
              <Button variant="outline" onClick={() => handleWeekChange('prev')} className="bg-slate-700 border-slate-600">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="text-center font-semibold text-slate-200">
                  <p>Editing Forecast For</p>
                  <p className="text-teal-400">{formatDate(activeWeekStartDate)}</p>
              </div>
              <Button variant="outline" onClick={() => handleWeekChange('next')} className="bg-slate-700 border-slate-600">
                  Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="emailInput" className="text-sm font-medium text-slate-300">Weekly Forecast Data</Label>
            <Textarea id="emailInput" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="min-h-[180px] font-mono" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2"><Label>Capture Rate (%)</Label><Input type="number" value={captureRate} onChange={(e) => setCaptureRate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Spend per Guest ($)</Label><Input type="number" value={avgSpend} onChange={(e) => setAvgSpend(e.target.value)} /></div>
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={parseAndSaveForecast} disabled={isLoading} className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 text-base">
              <TrendingUp className="mr-2 h-4 w-4" /> {isLoading ? "Saving..." : "Parse & Save Forecast"}
            </Button>
          </motion.div>
          {error && <p className="mt-4 text-sm text-red-400"><Info size={18} className="mr-2 inline" />{error}</p>}
        </CardContent>
      </Card>

      {/* --- NEW: Collapsible Results Section --- */}
      <div className="mt-8">
        <h3 className="text-teal-400 font-semibold text-lg mb-3">Saved Forecasts</h3>
        {isLoading && allForecasts.length === 0 && <p className="text-slate-400">Loading saved forecasts...</p>}
        {!isLoading && groupedForecasts.length > 0 ? (
            groupedForecasts.map(week => (
                <ForecastWeekAccordion 
                    key={week.startDate} 
                    week={week}
                    isInitiallyOpen={getStartOfWeek(new Date(week.startDate)).getTime() === activeWeekStartDate.getTime()}
                />
            ))
        ) : (
            !isLoading && <p className="text-slate-400">No forecast data found for this period.</p>
        )}
      </div>
    </motion.div>
  );
};

export

