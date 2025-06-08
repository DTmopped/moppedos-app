import React, { useState, useCallback } from 'react';
import { useData } from "../contexts/DataContext.js";
import { useToast } from "../components/ui/use-toast.js";
import { parseSinglePerformanceLogEntry, parsePosActualsEntry, PERFORMANCE_LOG_REQUIRED_KEYS } from "@/lib/performanceUtils.js";
import { AlertTriangle, CheckCircle, ListChecks } from "lucide-react";

export const TARGET_FOOD_PCT = 30;
export const TARGET_BEV_PCT = 20;
export const TARGET_LABOR_PCT = 14;

export const REQUIRED_POS_ACTUALS_KEYS = [
    "date", "total net sales", "food cost", "beverage cost", "labor cost"
];

export const defaultInput = `Date: 2025-05-13
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

export const usePerformanceAnalyzerLogic = () => {
  const [inputText, setInputText] = useState(defaultInput);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  const { addActualEntry } = useData();
  const { toast } = useToast();

  const analyzeData = useCallback(() => {
    setError("");
    setAnalysisResult(null);
    if (!inputText.trim()) {
      setError("Input cannot be empty.");
      toast({ title: "Input Error", description: "Input cannot be empty.", variant: "destructive", action: <AlertTriangle className="text-yellow-500"/> });
      return;
    }

    try {
      const lowerInput = inputText.toLowerCase();
      const isPerformanceLogFormat = PERFORMANCE_LOG_REQUIRED_KEYS.some(key => lowerInput.includes(key.replace("_", " ").replace("total sales", "total sales"))) || inputText.includes("\n\n");

      if (isPerformanceLogFormat) {
        const dailyEntriesRaw = inputText.trim().split("\n\n");
        const parsedEntries = dailyEntriesRaw.map(entryRaw => parseSinglePerformanceLogEntry(entryRaw));
        if (parsedEntries.length === 0) {
          setError("No valid performance log entries found. Check format.");
          toast({ title: "Parsing Error", description: "No valid performance log entries found. Check format.", variant: "destructive", action: <AlertTriangle className="text-red-500"/> });
        } else {
          setAnalysisResult({ type: "performanceLog", data: parsedEntries });
           toast({
            title: "Performance Log Analyzed",
            description: `${parsedEntries.length} entries processed.`,
            className: "bg-blue-600 text-white",
            action: <ListChecks className="text-white" />,
          });
        }
      } else {
        const toastFn = (options) => toast({...options, className: "bg-green-600 text-white", action: <CheckCircle className="text-white" />});
        const parsedEntry = parsePosActualsEntry(inputText, REQUIRED_POS_ACTUALS_KEYS, addActualEntry, toastFn, TARGET_FOOD_PCT, TARGET_BEV_PCT, TARGET_LABOR_PCT);
        setAnalysisResult({ type: "posActuals", data: [parsedEntry] });
      }
    } catch (e) {
      console.error("Parsing error:", e);
      setError(`Error: ${e.message}`);
      setAnalysisResult(null);
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive", action: <AlertTriangle className="text-red-500"/> });
    }
  }, [inputText, addActualEntry, toast]);

  const getVarianceColor = (variance) => {
    if (variance === "N/A" || variance === undefined) return "text-muted-foreground";
    const val = parseFloat(variance);
    if (val > 1) return "text-red-400 font-semibold";
    if (val < -1) return "text-green-400 font-semibold";
    return "text-yellow-400";
  };
  
  const getPercentageString = (value, percentage, variance) => {
    if (percentage === "N/A" || percentage === undefined) return `$${value}`;
    return `$${value} (${percentage}% | Var: ${variance > 0 ? '+' : ''}${variance} pp)`;
  };

  const getPerfLogPercentageClass = (pct, target) => {
    if (pct === 0 && target === 0) return "text-slate-400"; 
    return pct > target ? "text-red-400 font-semibold bg-red-500/10 px-1 py-0.5 rounded" : "text-green-400 bg-green-500/10 px-1 py-0.5 rounded";
  };

  return {
    inputText,
    setInputText,
    analysisResult,
    error,
    analyzeData,
    getVarianceColor,
    getPercentageString,
    getPerfLogPercentageClass
  };
};
