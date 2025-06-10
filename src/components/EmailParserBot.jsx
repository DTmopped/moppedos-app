import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";
import { MailCheck, TrendingUp, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useData } from "../contexts/DataContext.jsx"; 
import { useToast } from "components/ui/use-toast.jsx";
import { getDayFromDate, DAY_ORDER, COST_PERCENTAGES } from "@/lib/dateUtils.js";

const parseEmailContentForForecast = (emailText) => {
  const dayRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*([0-9,]+)/gi;
  let match;
  const results = {};
  let foundData = false;

  while ((match = dayRegex.exec(emailText)) !== null) {
    const day = match[1];
    const passengers = parseInt(match[2].replace(/,/g, ''));
    if (!isNaN(passengers)) {
      results[day] = passengers;
      foundData = true;
    }
  }
  return { results, foundData };
};

const calculateForecastMetricsFromEmail = (parsedDayData, captureRate, avgSpend, baseDate, addForecastEntryCallback) => {
  const processedData = [];
  let totalTraffic = 0, totalGuests = 0, totalSales = 0, totalFood = 0, totalBev = 0, totalLabor = 0;
  let entriesAddedToContext = 0;

  DAY_ORDER.forEach((dayName, index) => {
    if (parsedDayData[dayName] !== undefined) {
      const pax = parsedDayData[dayName];
      const guests = pax * captureRate;
      const sales = guests * avgSpend;
      const food = sales * COST_PERCENTAGES.food;
      const bev = sales * COST_PERCENTAGES.bev;
      const labor = sales * COST_PERCENTAGES.labor;
      
      const forecastDate = getDayFromDate(baseDate, index);

      processedData.push({ day: dayName, date: forecastDate, pax, guests, sales, food, bev, labor });
      if (addForecastEntryCallback) {
        addForecastEntryCallback({ date: forecastDate, forecastSales: sales });
        entriesAddedToContext++;
      }
      
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

const useEmailParserForm = (initialEmail, initialCaptureRate, initialAvgSpend) => {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [captureRateInput, setCaptureRateInput] = useState(initialCaptureRate);
  const [avgSpendInput, setAvgSpendInput] = useState(initialAvgSpend);
  const [error, setError] = useState("");

  const validateInputs = useCallback(() => {
    const capture = parseFloat(captureRateInput) / 100;
    const spend = parseFloat(avgSpendInput);

    if (isNaN(capture) || capture <= 0 || capture > 1) {
      setError("Invalid Capture Rate. Must be a percentage (e.g., 8.0 for 8.0%) between 0 and 100.");
      return false;
    }
    if (isNaN(spend) || spend <= 0) {
      setError("Invalid Spend per Guest. Must be a positive number.");
      return false;
    }
    if (!emailInput.trim()) {
      setError("Email input cannot be empty.");
      return false;
    }
    return { capture, spend };
  }, [captureRateInput, avgSpendInput, emailInput]);

  const extractBaseDate = useCallback(() => {
    const lines = emailInput.trim().split("\n");
    const dateLine = lines.find(line => /date:\s*([\d\-]+)/i.test(line));
    if (dateLine) {
      const dateMatch = dateLine.match(/date:\s*([\d\-]+)/i);
      if (dateMatch && dateMatch[1]) {
        const baseDate = dateMatch[1];
        const testDate = new Date(baseDate);
        if (isNaN(testDate.getTime())) {
          setError("Invalid base date found in input. Please use YYYY-MM-DD format (e.g., Date: 2025-05-13).");
          return null;
        }
        return baseDate;
      }
    }
    setError("Base date line not found. Please include a line like 'Date: YYYY-MM-DD' (e.g., Date: 2025-05-13 for Monday).");
    return null;
  }, [emailInput]);

  return {
    emailInput, setEmailInput,
    captureRateInput, setCaptureRateInput,
    avgSpendInput, setAvgSpendInput,
    error, setError,
    validateInputs, extractBaseDate
  };
};


const EmailParserBot = () => {
  const { 
    emailInput, setEmailInput, 
    captureRateInput, setCaptureRateInput, 
    avgSpendInput, setAvgSpendInput, 
    error, setError, 
    validateInputs, extractBaseDate 
  } = useEmailParserForm(
    "Subject: Terminal 4 Weekly Passenger Forecast – May 13 to May 19\nDate: 2025-05-13\nTotal Forecast: 110,000 passengers\nBreakdown by day:\n- Monday: 15000\n- Tuesday: 16000\n- Wednesday: 15500\n- Thursday: 17000\n- Friday: 19500\n- Saturday: 18000\n- Sunday: 9000",
    "8.0",
    "15"
  );
  
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const { addForecastEntry } = useData();
  const { toast } = useToast();

  const parseEmail = useCallback(() => {
    setError("");
    setForecastDataUI([]);

    const validated = validateInputs();
    if (!validated) return;
    const { capture: currentCaptureRate, spend: currentAvgSpend } = validated;
    
    const baseDate = extractBaseDate();
    if (!baseDate) return;

    try {
      const { results: parsedDayData, foundData } = parseEmailContentForForecast(emailInput);

      if (!foundData) {
        setError("No valid day data found in the email text. Ensure days (e.g., Monday, Tuesday) are followed by a colon and a number (e.g., Monday: 1,234).");
        return;
      }
      
      const { processedData, entriesAddedToContext, baseDate: forecastBaseDate } = calculateForecastMetricsFromEmail(parsedDayData, currentCaptureRate, currentAvgSpend, baseDate, addForecastEntry);
      
      if (processedData.length === 0) {
        setError("Could not parse any day data. Please check the email format.");
        return;
      }
      
      setForecastDataUI(processedData);
      if (entriesAddedToContext > 0) {
        toast({
          title: "Forecast Parsed & Saved",
          description: `${entriesAddedToContext} forecast entries for week starting ${forecastBaseDate} added/updated.`,
          action: <CheckCircle className="text-green-500" />,
        });
      }

    } catch (e) {
      console.error("Parsing error:", e);
      setError("An error occurred during parsing. Please check input formats and console for details.");
    }
  }, [validateInputs, extractBaseDate, emailInput, addForecastEntry, toast, setError, setForecastDataUI]);

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
            <div className="p-3 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-600 shadow-lg">
              <MailCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">Forecast Email Parser Bot</CardTitle>
              <CardDescription className="text-slate-400">
                Paste weekly airport forecast email (ensure 'Date: YYYY-MM-DD' for Monday is included), set capture rate & spend to generate and save forecast.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <Label htmlFor="emailInput" className="text-sm font-medium text-slate-300">Weekly Airport Forecast Email</Label>
            <Textarea
              id="emailInput"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Paste email text here... e.g.&#10;Subject: Weekly Forecast&#10;Date: 2025-05-13&#10;Monday: 12,500 passengers&#10;Tuesday: 11,800&#10;..."
              className="min-h-[180px] text-sm font-mono bg-slate-800 border-slate-600 text-slate-300 focus:border-teal-500 transition-all duration-300 placeholder-slate-500"
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
                className="bg-slate-800 border-slate-600 text-slate-300 focus:border-teal-500 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgSpend" className="text-sm font-medium text-slate-300">Spend per Guest ($)</Label>
              <Input
                id="avgSpend"
                type="number"
                value={avgSpendInput}
                onChange={(e) => setAvgSpendInput(e.target.value)}
                placeholder="e.g., 15"
                step="0.5"
                className="bg-slate-800 border-slate-600 text-slate-300 focus:border-teal-500 transition-all duration-300"
              />
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={parseEmail} className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300">
              <TrendingUp className="mr-2 h-4 w-4" /> Parse & Forecast & Save
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

      {forecastDataUI.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">Forecast Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-slate-700 shadow-inner">
                <Table>
                  <TableHeader className="bg-slate-700/50">
                    <TableRow className="border-slate-600">
                      <TableHead className="min-w-[100px] text-slate-300">Day</TableHead>
                      <TableHead className="min-w-[100px] text-slate-300">Date</TableHead>
                      <TableHead className="text-right min-w-[100px] text-slate-300">Traffic</TableHead>
                      <TableHead className="text-right min-w-[100px] text-slate-300">Guests</TableHead>
                      <TableHead className="text-right min-w-[100px] text-slate-300">Sales ($)</TableHead>
                      <TableHead className="text-right min-w-[100px] text-slate-300">Food (30%)</TableHead>
                      <TableHead className="text-right min-w-[100px] text-slate-300">Bev (20%)</TableHead>
                      <TableHead className="text-right min-w-[100px] text-slate-300">Labor (14%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecastDataUI.map((row, index) => (
                      <motion.tr
                        key={row.day + index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-slate-700/60 transition-colors border-b border-slate-700 last:border-b-0 ${row.isTotal ? "bg-slate-700/80 font-semibold" : ""}`}
                      >
                        <TableCell className={`font-medium ${row.isTotal ? "text-teal-400" : "text-slate-200"}`}>{row.day}</TableCell>
                        <TableCell className="text-slate-300">{row.date || ''}</TableCell>
                        <TableCell className="text-right text-slate-300">{row.pax.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-300">{Math.round(row.guests)}</TableCell>
                        <TableCell className="text-right text-green-400">{row.sales.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-orange-400">{row.food.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sky-400">{row.bev.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-purple-400">{row.labor.toFixed(2)}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmailParserBot;
