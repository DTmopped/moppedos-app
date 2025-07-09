import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "components/ui/card.jsx";
import { Calculator } from "lucide-react";
import ForecastInputArea from "components/forecast/ForecastInputArea.jsx";
import ForecastResultsTable from "components/forecast/ForecastResultsTable.jsx";
import AdminPanel from "components/forecast/AdminPanel.jsx";
import AdminModeToggle from "@/components/ui/AdminModeToggle";
import { useData } from "@/contexts/DataContext";

const WeeklyForecastParser = () => {
  const { isAdminMode, adminSettings, setForecastData } = useData(); // ✅ added setForecastData
  const [inputText, setInputText] = useState(() => {
    return localStorage.getItem("weeklyInputText") || "";
  });
  const [forecastDataUI, setForecastDataUI] = useState([]);
  const [error, setError] = useState("");

  const {
    captureRate: rawCaptureRate,
    spendPerGuest: rawSpendPerGuest,
    amSplit: rawAmSplit,
    foodCostGoal,
    bevCostGoal,
    laborCostGoal,
  } = adminSettings;

  const captureRate = Math.min(Math.max(parseFloat(rawCaptureRate), 0), 1);
  const spendPerGuest = Math.max(parseFloat(rawSpendPerGuest), 0);
  const amSplit = Math.min(Math.max(parseFloat(rawAmSplit), 0), 1);

  useEffect(() => {
    localStorage.setItem("weeklyInputText", inputText);
  }, [inputText]);

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
        setError("Invalid input format. Use 'Date: YYYY-MM-DD' followed by 'Monday: 12345'.");
        return;
      }

      const captureDecimal = parseFloat(captureRate);
      const spendPerGuestFloat = parseFloat(spendPerGuest);
      const amSplitDecimal = parseFloat(amSplit);
      const pmSplitDecimal = 1 - amSplitDecimal;

      const foodPct = parseFloat(foodCostGoal);
      const bevPct = parseFloat(bevCostGoal);
      const laborPct = parseFloat(laborCostGoal);

      const result = data.map((item, idx) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + idx);

        const guests = Math.round(item.pax * captureDecimal);
        const amGuests = Math.round(guests * amSplitDecimal);
        const pmGuests = guests - amGuests;
        const sales = guests * spendPerGuestFloat;

       return {
         day: item.day,
         date: date.toISOString().split("T")[0],
         pax: item.pax,
         guests,
         amGuests,
         pmGuests,
         sales,
         forecastSales: sales, // <- 🔥 Add this line
         food: sales * foodPct,
         bev: sales * bevPct,
         labor: sales * laborPct,
        };
        
      });

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
      setForecastData(result.filter(row => !row.isTotal)); // ✅ sync with dashboard
      localStorage.setItem("weeklyForecastResults", JSON.stringify(result));

    } catch (e) {
      console.error("Parsing error:", e);
      setError("An error occurred while parsing. Check the format and try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AdminModeToggle />
      </div>

      {isAdminMode && <AdminPanel />}

      <Card className="border border-slate-700 pointer-events-auto opacity-100">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 shadow-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600">
                Weekly Forecast Parser
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Paste weekly throughput to generate sales and labor projections.
              </CardDescription>
            </div>
          </div>

          <div className="bg-slate-800 text-slate-100 rounded-md px-4 py-2 mt-2 text-sm font-medium">
            Current Forecast Settings: {" "}
            <span className="ml-2">
              Capture Rate: {(captureRate * 100).toFixed(1)}% &nbsp;|&nbsp;
              Spend per Guest: ${spendPerGuest.toFixed(0)} &nbsp;|&nbsp;
              AM Split: {(amSplit * 100).toFixed(0)}%
            </span>
          </div>
        </CardHeader>

        <CardContent className="pointer-events-auto opacity-100">
          <ForecastInputArea
            inputText={inputText}
            setInputText={setInputText}
            generateForecast={generateForecast}
          />
          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200 mt-4">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {forecastDataUI.length > 0 && (
        <ForecastResultsTable forecastDataUI={forecastDataUI} />
      )}
    </div>
  );
};

export default WeeklyForecastParser;

