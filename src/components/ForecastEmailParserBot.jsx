import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, Info, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "components/ui/use-toast.jsx";
import ForecastWeekAccordion from "./forecast/ForecastWeekAccordion.jsx";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";

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
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [allForecasts, setAllForecasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [captureRateInput, setCaptureRateInput] = useState("8.0");
  const [avgSpendInput, setAvgSpendInput] = useState("40");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Fetch data for the CURRENT location
  useEffect(() => {
    const fetchAllForecasts = async () => {
      if (!locationId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
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
  }, [locationId]);

  // Effect to update textarea when the active week or data changes
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

  // Week navigation handlers
  const handleWeekChange = (direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // Updated save/generate function
  const parseAndSaveForecast = useCallback(async () => {
    if (!locationId) {
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
          location_id: locationId,
          date: forecastDate.toISOString().split('T')[0],
          day,
          pax,
          guests,
          sales,
        });
      });

      if (recordsToUpsert.length === 0) throw new Error("No valid day data found to process.");

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
  }, [emailInput, captureRateInput, avgSpendInput, toast, locationId]);

  // Group data for accordion display
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

    return Object.values(groups).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
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
                Select a week, paste forecast data, and save. View all saved forecasts below.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
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
              placeholder="Date: YYYY-MM-DD&#10;Monday: 12345&#10;Tuesday: 16000"
              className="min-h-[180px] text-sm font-mono bg-slate-800 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="captureRate" className="text-sm font-medium text-slate-300">Capture Rate (%)</Label>
              <Input
                id="captureRate"
                type="number"
                value={captureRateInput}
                onChange={(e) => setCaptureRateInput(e.target.value)}
                placeholder="e.g., 8.0"
                step="0.1"
                className="bg-slate-800 border-slate-600 text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgSpend" className="text-sm font-medium text-slate-300">Spend per Guest ($)</Label>
              <Input
                id="avgSpend"
                type="number"
                value={avgSpendInput}
                onChange={(e) => setAvgSpendInput(e.target.value)}
                placeholder="e.g., 40"
                step="0.5"
                className="bg-slate-800 border-slate-600 text-slate-300"
              />
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={parseAndSaveForecast} className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300">
              <TrendingUp className="mr-2 h-4 w-4" /> 
              {isLoading ? "Saving..." : "Parse & Save Forecast"}
            </Button>
          </motion.div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md border border-red-700 flex items-start"
            >
              <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-400 flex-shrink-0" /> 
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

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




