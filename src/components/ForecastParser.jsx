import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "components/ui/card.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table.jsx";
import { Calculator, TrendingUp } from "lucide-react";

const ForecastParser = () => {
  const [inputText, setInputText] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [error, setError] = useState("");

  const spendPerHead = 15;
  const foodPct = 0.3;
  const bevPct = 0.2;
  const laborPct = 0.14;

  const generateForecast = () => {
    setError("");
    setForecastData([]);
    if (!inputText.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    try {
      const lines = inputText.trim().split("\n");
      const days = {};
      let foundData = false;

      const dayMap = {
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sun: "Sunday",
      };

      lines.forEach((line) => {
        const match = line.match(/^([A-Za-z]+)\s*[:\-–—]\s*(\d+)$/);
        if (match) {
          const [_, rawDay, rawValue] = match;
          const short = rawDay.trim().slice(0, 3).toLowerCase();
          const day = dayMap[short];
          const pax = parseInt(rawValue);
          if (day && !isNaN(pax)) {
            days[day] = pax;
            foundData = true;
          }
        }
      });

      if (!foundData) {
        setError("No valid day data found. Please check your input format.");
        return;
      }

      const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const processedData = [];

      dayOrder.forEach((day) => {
        if (days[day] !== undefined) {
          const pax = days[day];
          const sales = pax * spendPerHead;
          const food = sales * foodPct;
          const bev = sales * bevPct;
          const labor = sales * laborPct;
          processedData.push({ day, pax, sales, food, bev, labor });
        }
      });

      if (processedData.length === 0) {
        setError("Could not parse any valid day data.");
        return;
      }

      setForecastData(processedData);
    } catch (e) {
      console.error("Parsing error:", e);
      setError(
        "An error occurred while parsing the data. Please check your input."
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="shadow-lg border-primary/20 border-2 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gradient">
                Weekly Forecast Parser
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Paste your weekly throughput email data to generate a forecast.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              id="input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Example:\nMon: 150\nTue - 200\nWed — 180\nThu: 190\n..."
              className="min-h-[150px] text-sm font-mono focus:border-primary transition-all duration-300"
            />
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={generateForecast}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Generate Forecast
              </Button>
            </motion.div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {forecastData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-md overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl text-gradient">
                Forecast Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-semibold text-muted-foreground">
                        Day
                      </th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">
                        Passengers
                      </th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">
                        Sales ($)
                      </th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">
                        Food COGS (30%)
                      </th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">
                        Bev COGS (20%)
                      </th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">
                        Labor Target (14%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.map((row, index) => (
                      <motion.tr
                        key={row.day}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b last:border-b-0 hover:bg-accent/50 transition-colors"
                      >
                        <td className="p-3 font-medium text-primary">
                          {row.day}
                        </td>
                        <td className="p-3 text-right">
                          {row.pax.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-green-600 font-medium">
                          {row.sales.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-orange-600">
                          {row.food.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-blue-600">
                          {row.bev.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-purple-600">
                          {row.labor.toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ForecastParser;
