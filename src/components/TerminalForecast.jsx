import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";
import { PlaneTakeoff, TrendingUp, Info, CheckCircle } from "lucide-react";
import { useData } from "../contexts/DataContext.jsx";
import { useToast } from "./ui/use-toast.jsx";
import { getDayFromDate, DAY_ORDER, COST_PERCENTAGES } from "@/lib/dateUtils.js";

const parseTerminalTrafficInput = (trafficInputString) => {
  const lines = trafficInputString.trim().split("\n");
  const daysData = {};
  let foundData = false;

  lines.forEach(line => {
    const parts = line.split(":").map(v => v.trim());
    if (parts.length === 2) {
      const key = parts[0];
      const value = parts[1];
      if (!/weekly throughput/i.test(key) && !/date/i.test(key)) {
        const dayName = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        const pax = parseInt(value.replace(/,/g, ''), 10);
        if (!isNaN(pax) && DAY_ORDER.includes(dayName)) {
          daysData[dayName] = pax;
          foundData = true;
        }
      }
    }
  });
  return { daysData, foundData };
};

const calculateTerminalForecastMetrics = (daysData, capture, spend, baseDate, addForecastEntryCallback) => {
  const processedData = [];
  let totalTraffic = 0, totalGuests = 0, totalSales = 0, totalFood = 0, totalBev = 0, totalLabor = 0;
  let entriesAddedToContext = 0;

  DAY_ORDER.forEach((dayName, index) => {
    if (daysData[dayName] !== undefined) {
      const pax = daysData[dayName];
      const guests = pax * capture;
      const sales = guests * spend;
      const food = sales * COST_PERCENTAGES.food;
      const bev = sales * COST_PERCENTAGES.bev;
      const labor = sales * COST_PERCENTAGES.labor;
      
      const forecastDate = getDayFromDate(baseDate, index);

      processedData.push({ day: dayName, date: forecastDate, pax, guests, sales, food, bev, labor });
      addForecastEntryCallback({ date: forecastDate, forecastSales: sales });
      entriesAddedToContext++;

      totalTraffic += pax;
      totalGuests += guests;
      totalSales += sales;
      totalFood += food;
      totalBev += bev;
      totalLabor += labor;
    }
  });

  if (processedData.length > 0) {
    processedData.push({
      day: "Total / Avg",
      pax: totalTraffic,
      guests: totalGuests,
      sales: totalSales,
      food: totalFood,
      bev: totalBev,
      labor: totalLabor,
      isTotal: true,
    });
  }
  return { processedData, entriesAddedToContext, baseDate };
};

const TerminalForecast = () => {
  const [trafficInput, setTrafficInput] = useState("Weekly Throughput: 100000\nDate: 2025-05-12\nMonday: 14000\nTuesday: 15000\nWednesday: 16000\nThursday: 13000\nFriday: 17000\nSaturday: 15000\nSunday: 10000");
  const [captureRate, setCaptureRate] = useState("7.5");
  const [avgSpend, setAvgSpend] = useState("15");
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState("");
  const { addForecastEntry } = useData();
  const { toast } = useToast();

  const validateTerminalInputs = useCallback(() => {
    const capture = parseFloat(captureRate) / 100;
    const spend = parseFloat(avgSpend);

    if (isNaN(capture) || capture <= 0 || capture > 1) {
      setError("Invalid Capture Rate. Please enter a percentage (e.g., 7.5 for 7.5%). It must be between 0 and 100.");
      return false;
    }
    if (isNaN(spend) || spend <= 0) {
      setError("Invalid Average Spend. Please enter a positive number.");
      return false;
    }
    if (!trafficInput.trim()) {
      setError("Traffic input cannot be empty.");
      return false;
    }
    return { capture, spend };
  }, [captureRate, avgSpend, trafficInput]);

  const extractBaseDateFromTerminalInput = useCallback(() => {
    const lines = trafficInput.trim().split("\n");
    const dateLine = lines.find(line => /date:\s*([\d\-]+)/i.test(line));
    if (dateLine) {
      const dateMatch = dateLine.match(/date:\s*([\d\-]+)/i);
      if (dateMatch && dateMatch[1]) {
        const baseDate = dateMatch[1];
        const testDate = new Date(baseDate);
        if (isNaN(testDate.getTime())) {
          setError("Invalid base date found in input. Please use YYYY-MM-DD format (e.g., Date: 2025-05-12).");
          return null;
        }
        return baseDate;
      }
    }
    setError("Base date line not found. Please include a line like 'Date: YYYY-MM-DD' (e.g., Date: 2025-05-12).");
    return null;
  }, [trafficInput]);

  const generateTerminalForecast = useCallback(() => {
    setError("");
    setForecastDataUI([]);

    const validated = validateTerminalInputs();
    if (!validated) return;
    const { capture, spend } = validated;

    const baseDate = extractBaseDateFromTerminalInput();
    if (!baseDate) return;

    try {
      const { daysData, foundData } = parseTerminalTrafficInput(trafficInput);

      if (!foundData) {
        setError("No valid day data found in traffic input. Please check format (e.g., Monday: 14000).");
        return;
      }

      const { processedData, entriesAddedToContext, baseDate: forecastBaseDate } = calculateTerminalForecastMetrics(daysData, capture, spend, baseDate, addForecastEntry);
      
      if (processedData.length === 0) {
        setError("Could not parse any day data. Ensure days are correctly spelled and followed by a colon and number.");
        return;
      }

      setForecastDataUI(processedData);
      if (entriesAddedToContext > 0) {
        toast({
          title: "Forecast Generated",
          description: `${entriesAddedToContext} forecast entries for week starting ${forecastBaseDate} added/updated in the central data store.`,
          action: <CheckCircle className="text-green-500" />,
        });
      }

    } catch (e) {
      console.error("Parsing error:", e);
      setError("An error occurred while parsing. Please check input formats and console for details.");
    }
  }, [validateTerminalInputs, extractBaseDateFromTerminalInput, trafficInput, addForecastEntry, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg">
              <PlaneTakeoff className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Weekly Terminal Forecast</CardTitle>
              <CardDescription className="text-slate-400">
                Input terminal traffic, capture rate, and average spend to generate a weekly forecast.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="captureRate" className="text-sm font-medium text-slate-300">Capture Rate (%)</Label>
              <Input
                id="captureRate"
                type="number"
                value={captureRate}
                onChange={(e) => setCaptureRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgSpend" className="text-sm font-medium text-slate-300">Average Spend ($)</Label>
              <Input
                id="avgSpend"
                type="number"
                value={avgSpend}
                onChange={(e) => setAvgSpend(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="trafficInput" className="text-sm font-medium text-slate-300">Weekly Terminal Email Data</Label>
            <textarea
              id="trafficInput"
              value={trafficInput}
              onChange={(e) => {
                console.log("🧪 Typing:", e.target.value);
                setTrafficInput(e.target.value);
              }}
              placeholder={`Date: 2025-05-12\nMonday: 14000\nTuesday: 15000\n...`}
              className="w-full min-h-[180px] text-sm font-mono bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 placeholder-slate-500"
            />
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={generateTerminalForecast}>
              <TrendingUp className="mr-2 h-4 w-4" /> Generate Forecast & Save
            </Button>
          </motion.div>

          {error && <p className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md border border-red-700 flex items-start"><Info size={18} className="mr-2 mt-0.5 text-red-400 flex-shrink-0" /> {error}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TerminalForecast;
