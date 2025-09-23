import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { MailCheck, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import AdminPanel from "./forecast/AdminPanel.jsx";
import AdminModeToggle from "@/components/ui/AdminModeToggle";
import ForecastResultsTable from "./forecast/ForecastResultsTable.jsx"; // The new display component

const getStartOfWeekUTC = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
};
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ForecastEmailParserBot = () => {
  const { loadingLocation, isAdminMode, adminSettings } = useData();
  const { captureRate, spendPerGuest, amSplit, foodCostGoal, bevCostGoal, laborCostGoal } = adminSettings;
  
  const [activeWeekStartDate, setActiveWeekStartDate] = useState(getStartOfWeekUTC(new Date()));
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [forecastDataUI, setForecastDataUI] = useState([]); // State to hold the temporary forecast

  useEffect(() => {
    if (!loadingLocation) {
      const dateString = `${activeWeekStartDate.getUTCFullYear()}-${String(activeWeekStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(activeWeekStartDate.getUTCDate()).padStart(2, '0')}`;
      setEmailInput(`Date: ${dateString}\nMonday:\nTuesday:\nWednesday:\nThursday:\nFriday:\nSaturday:\nSunday:`);
    }
  }, [activeWeekStartDate, loadingLocation]);

  const handleWeekChange = useCallback((direction) => {
    setActiveWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setUTCDate(newDate.getUTCDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  }, []);

  const generateForecast = useCallback(() => {
    setError("");
    setForecastDataUI([]);

    try {
      const lines = emailInput.split('\n').map(l => l.trim()).filter(Boolean);
      const dateLine = lines.find(line => /^date\s*:/i.test(line));
      if (!dateLine) throw new Error("Date: YYYY-MM-DD line is missing.");

      const baseDateStr = dateLine.split(':')[1]?.trim();
      const baseDate = new Date(`${baseDateStr}T00:00:00Z`);
      if (isNaN(baseDate.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");

      const results = [];
      const dayRegex = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:\s*([0-9][0-9,]*)$/i;

      for (const line of lines) {
        const match = line.match(dayRegex);
        if (!match) continue;

        const dayName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const paxValue = parseInt(match[2].replace(/,/g, ''), 10);
        if (!Number.isFinite(paxValue)) continue;

        const dayIndex = DAY_ORDER.indexOf(dayName);
        if (dayIndex === -1) continue;

        const forecastDate = new Date(baseDate);
        forecastDate.setUTCDate(forecastDate.getUTCDate() + dayIndex);
        
        const guests = Math.round(paxValue * captureRate);
        const sales = guests * spendPerGuest;
        const amGuests = Math.round(guests * amSplit);
        const pmGuests = guests - amGuests;

        results.push({
          day: dayName,
          date: forecastDate.toISOString().split('T')[0],
          pax: paxValue,
          guests,
          amGuests,
          pmGuests,
          sales,
          food: sales * foodCostGoal,
          bev: sales * bevCostGoal,
          labor: sales * laborCostGoal,
        });
      }

      if (results.length === 0) throw new Error("No valid day data found to process.");
      
      const totals = results.reduce((acc, row) => {
          acc.pax += row.pax;
          acc.guests += row.guests;
          acc.sales += row.sales;
          acc.food += row.food;
          acc.bev += row.bev;
          acc.labor += row.labor;
          return acc;
      }, { pax: 0, guests: 0, sales: 0, food: 0, bev: 0, labor: 0 });

      results.push({ day: "Total", ...totals, isTotal: true });

      setForecastDataUI(results);

    } catch (e) {
      setError(`Error: ${e.message}`);
    }
  }, [emailInput, captureRate, spendPerGuest, amSplit, foodCostGoal, bevCostGoal, laborCostGoal]);

  if (loadingLocation) {
    return (
      <Card className="shadow-lg border-gray-200 bg-white flex items-center justify-center p-10">
        <div className="flex flex-col items-center text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <span className="font-semibold">Loading Location Data...</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-end">
        <AdminModeToggle />
      </div>

      {isAdminMode && <AdminPanel />}

      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader>
            <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg">
                <MailCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Forecast Center</CardTitle>
                <CardDescription className="text-gray-500">
                    Select a week, input daily traffic, and generate a forecast.
                </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6 border">
              <Button variant="outline" onClick={() => handleWeekChange('prev')} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="text-center font-semibold text-gray-700">
                  <p>Editing Forecast For</p>
                  <p className="text-blue-600 font-semibold">{activeWeekStartDate.toLocaleDateString('en-US', {timeZone: 'UTC'})}</p>
              </div>
              <Button variant="outline" onClick={() => handleWeekChange('next')} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100">
                  Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          </div>
          <div className="space-y-2 mb-6">
            <Label htmlFor="emailInput" className="text-sm font-medium text-gray-700">Weekly Traffic Data</Label>
            <Textarea
              id="emailInput"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Date: YYYY-MM-DD&#10;Monday: 12345&#10;Tuesday: 16000"
              className="min-h-[180px] text-sm font-mono bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"
            />
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={generateForecast} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="mr-2 h-4 w-4" /> 
              Generate Forecast
            </Button>
          </motion.div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-200 flex items-start"
            >
              <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-600 flex-shrink-0" /> 
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Display the generated forecast results in a table */}
      {forecastDataUI.length > 0 && (
        <ForecastResultsTable forecastDataUI={forecastDataUI} />
      )}
    </motion.div>
  );
};

export default ForecastEmailParserBot;























