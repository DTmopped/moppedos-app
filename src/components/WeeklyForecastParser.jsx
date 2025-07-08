import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { Calculator } from "lucide-react";
import ForecastInputArea from "components/forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "components/forecast/ForecastResultsTable.jsx";

const WeeklyForecastParser = () => {
  const [inputText, setInputText] = useState("");
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState("");

  // Admin mode settings from localStorage
  const captureRate = Number(localStorage.getItem("captureRate")) || 0.08;
  const spendPerGuest = Number(localStorage.getItem("spendPerGuest")) || 40;
  const amSplit = Number(localStorage.getItem("amSplit")) || 0.6; // 60/40 AM/PM

  const generateForecast = () => {
    setError("");
    setForecastDataUI([]);

    try {
      const lines = inputText.trim().split("\n");
      const data = [];
      let startDate = null;

      for (let line of lines) {
        if (/^Date:/i.test(line)) {
          const match = line.match(/\d{4}-\d{2}-\d{2}/);
          if (match) {
            startDate = new Date(match[0]);
          }
        } else {
          const parts = line.split(":");
          if (parts.length === 2) {
            const day = parts[0].trim();
            const pax = parseInt(parts[1].replace(/,/g, ""), 10);
            if (!isNaN(pax)) {
              data.push({ day, pax });
            }
          }
        }
      }

      if (!startDate || data.length === 0) {
        setError("Invalid input format. Make sure you include 'Date: YYYY-MM-DD' and valid day entries like 'Monday: 62340'.");
        return;
      }

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const result = data.map((item, idx) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + idx);

        const guests = Math.round(item.pax * captureRate);
        const amGuests = Math.round(guests * amSplit);
        const pmGuests = guests - amGuests;
        const sales = guests * spendPerGuest;

        return {
          day: item.day,
          date: date.toISOString().split("T")[0],
          pax: item.pax,
          guests,
          amGuests,
          pmGuests,
          sales,
          food: sales * (Number(localStorage.getItem("foodCostGoal")) || 0.3),
          bev: sales * (Number(localStorage.getItem("bevCostGoal")) || 0.2),
          labor: sales * (Number(localStorage.getItem("laborCostGoal")) || 0.14),
        };
      });

      // Add total row
      const totals = result.reduce(
        (acc, row) => {
          acc.pax += row.pax;
          acc.guests += row.guests;
          acc.amGuests += row.amGuests;
          acc.pmGuests += row.pmGuests;
          acc.sales += row.sales;
          acc.food += row.food;
          acc.bev += row.bev;
          acc.labor += row.labor;
          return acc;
        },
        {
          pax: 0,
          guests: 0,
          amGuests: 0,
          pmGuests: 0,
          sales: 0,
          food: 0,
          bev: 0,
          labor: 0,
        }
      );

      result.push({
        day: "Total",
        ...totals,
        isTotal: true,
      });

      setForecastDataUI(result);
    } catch (e) {
      console.error("Parsing error:", e);
      setError("An error occurred while parsing the data. Check your format and try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="glassmorphic-card border border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 shadow-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600">Weekly Forecast Parser</CardTitle>
              <CardDescription className="text-muted-foreground">
                Paste weekly throughput to generate sales and labor projections.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ForecastInputArea
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200 mt-4">{error}</p>}
        </CardContent>
      </Card>

      {forecastDataUI.length > 0 && (
        <ForecastResultsTable forecastDataUI={forecastDataUI} />
      )}
    </motion.div>
  );
};

export default WeeklyForecastParser;
