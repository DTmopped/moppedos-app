import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { ListChecks, AlertTriangle } from "lucide-react";
import { parseSinglePerformanceLogEntry } from "@/lib/performanceUtils.js";
import PerformanceLogTable from "components/performance/PerformanceLogTable.jsx";

const defaultLogInput = `Date: 2025-05-13
Forecasted Sales: 5000
Forecasted Food: 1500
Forecasted Bev: 1000
Forecasted Labor: 700
Total Sales: 5300
Food Cost: 1600
Beverage Cost: 950
Labor Cost: 800

Date: 2025-05-14
Forecasted Sales: 5200
Forecasted Food: 1560
Forecasted Bev: 1040
Forecasted Labor: 728
Total Sales: 4800
Food Cost: 1500
Beverage Cost: 1000
Labor Cost: 650`;

const DailyPerformanceLog = () => {
  const [logInput, setLogInput] = useState(defaultLogInput);
  const [logData, setLogData] = useState([]);
  const [error, setError] = useState("");

  const parseLogData = useCallback(() => {
    setError("");
    setLogData([]);
    if (!logInput.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    try {
      const dailyEntriesRaw = logInput.trim().split("\n\n");
      const parsedEntries = dailyEntriesRaw.map(entryRaw => parseSinglePerformanceLogEntry(entryRaw));
      
      setLogData(parsedEntries);
      if(parsedEntries.length === 0) {
        setError("No valid log entries found. Please check your input format.");
      }
    } catch (e) {
      console.error("Parsing error:", e);
      setError(`Error: ${e.message}`);
      setLogData([]);
    }
  }, [logInput]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="glassmorphic-card card-hover-glow">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-600 shadow-lg">
              <ListChecks className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Daily Performance Log</CardTitle>
              <CardDescription className="text-muted-foreground">
                Paste combined forecast and actuals to track daily performance.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-background/70 dark:bg-background/50 border border-border/50 rounded-md">
            <p className="text-sm font-medium text-primary mb-1">Required Format (separate entries with a blank line):</p>
            <pre className="text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
{`Date: YYYY-MM-DD
Forecasted Sales: NNNN
Forecasted Food: NNNN
Forecasted Bev: NNNN
Forecasted Labor: NNNN
Total Sales: NNNN
Food Cost: NNNN
Beverage Cost: NNNN
Labor Cost: NNNN

(Blank line for next entry)

Date: YYYY-MM-DD
...and so on`}
            </pre>
          </div>
          <div className="space-y-4">
            <Textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Paste your log data here..."
              className="min-h-[200px] text-sm font-mono bg-background/70 dark:bg-background/50 focus:border-primary transition-all duration-300 placeholder-muted-foreground"
            />
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={parseLogData} variant="gradient" className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300">
                Update Log
              </Button>
            </motion.div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-900/30 p-3 rounded-md border border-red-500/30 dark:border-red-700 flex items-start"
              >
                <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-500 dark:text-red-400 flex-shrink-0" /> 
                <span>{error}</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {logData.length > 0 && (
         <PerformanceLogTable logData={logData} />
      )}
    </motion.div>
  );
};

export default DailyPerformanceLog;
