import { useState, useCallback } from 'react';
import { useData } from '@/contexts/DataContext.jsx';
import { useToast } from '@/components/ui/use-toast.jsx';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { extractValueUtil } from '@/lib/performanceUtils.js'; // Assuming extractValueUtil is in performanceUtils

export const TARGET_FOOD_PCT_POS = 30;
export const TARGET_BEV_PCT_POS = 20;
export const TARGET_LABOR_PCT_POS = 14;

export const REQUIRED_POS_KEYS = [
    "date", "total net sales", "food cost", "beverage cost", "labor cost"
];

export const usePosActualsParser = (initialInputText = "") => {
  const [inputText, setInputText] = useState(initialInputText);
  const [actualsDataUI, setActualsDataUI] = useState(null);
  const [error, setError] = useState("");
  const { addActualEntry } = useData();
  const { toast } = useToast();

  const parseAndLogActuals = useCallback(() => {
    setError("");
    setActualsDataUI(null);
    if (!inputText.trim()) {
      setError("Input cannot be empty.");
      toast({ title: "Input Error", description: "Input cannot be empty.", variant: "destructive", action: <AlertTriangle className="text-yellow-500"/> });
      return;
    }

    const text = inputText.toLowerCase();
    try {
      const dateMatch = text.match(/date:\s*([\d\-]+)/i);
      const date = dateMatch ? dateMatch[1] : "N/A";

      if (date === "N/A") {
        setError("Date not found in input. Please ensure it's in the format 'Date: YYYY-MM-DD'.");
        toast({ title: "Format Error", description: "Date not found or invalid.", variant: "destructive", action: <AlertTriangle className="text-red-500"/> });
        return;
      }

      const actualSales = extractValueUtil(text, "total net sales");
      const foodCost = extractValueUtil(text, "food cost");
      const beverageCost = extractValueUtil(text, "beverage cost");
      const laborCost = extractValueUtil(text, "labor cost");
      const laborHoursMatch = text.match(/labor hours:\s*([\d\.]+)/i);
      const laborHours = laborHoursMatch ? parseFloat(laborHoursMatch[1]) : null;

      // Validate required fields
      for (const key of REQUIRED_POS_KEYS) {
        if (key === "date") continue; // Date already validated
        const value = extractValueUtil(text, key);
        if (value === null) {
          const friendlyKey = key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          setError(`'${friendlyKey}' field not found or invalid. Please ensure it's in the format '${friendlyKey}: $X,XXX.XX'.`);
          toast({ title: "Format Error", description: `'${friendlyKey}' field missing or invalid.`, variant: "destructive", action: <AlertTriangle className="text-red-500"/> });
          return;
        }
      }
      if (laborHours === null && text.includes("labor hours:")) {
         setError("Labor Hours field is present but has an invalid value. Please check the input content.");
         toast({ title: "Format Error", description: "Invalid Labor Hours value.", variant: "destructive", action: <AlertTriangle className="text-red-500"/> });
         return;
      }

      let foodPct = "N/A", bevPct = "N/A", laborPct = "N/A";
      let foodVariance = "N/A", bevVariance = "N/A", laborVariance = "N/A";

      if (actualSales === 0) {
        // setError("Total Sales is zero. Percentage calculations will be N/A.");
        // No error toast here, just N/A percentages
      } else if (actualSales > 0) {
        foodPct = ((foodCost / actualSales) * 100).toFixed(1);
        bevPct = ((beverageCost / actualSales) * 100).toFixed(1);
        laborPct = ((laborCost / actualSales) * 100).toFixed(1);

        foodVariance = (parseFloat(foodPct) - TARGET_FOOD_PCT_POS).toFixed(1);
        bevVariance = (parseFloat(bevPct) - TARGET_BEV_PCT_POS).toFixed(1);
        laborVariance = (parseFloat(laborPct) - TARGET_LABOR_PCT_POS).toFixed(1);
      }
      
      const dataForContext = { date, actualSales, foodCost, beverageCost, laborCost };
      addActualEntry(dataForContext); // Save to central store

      setActualsDataUI({
        date,
        sales: actualSales.toFixed(2),
        food: foodCost.toFixed(2), foodPct, foodVariance,
        bev: beverageCost.toFixed(2), bevPct, bevVariance,
        labor: laborCost.toFixed(2), laborPct, laborVariance,
        hours: laborHours === null ? 'N/A' : laborHours.toString(),
      });

      toast({
        title: "Actuals Logged",
        description: `Data for ${date} has been parsed and saved.`,
        className: "bg-green-600 text-white",
        action: <CheckCircle className="text-white" />,
      });

    } catch (e) {
      console.error("Parsing error:", e);
      setError(`An error occurred: ${e.message}. Please check the input format.`);
      toast({ title: "Parsing Error", description: e.message, variant: "destructive", action: <AlertTriangle className="text-red-500"/> });
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
    if (percentage === "N/A" || percentage === undefined) return `${value}`; // Display value even if percentage is N/A
    const varianceVal = parseFloat(variance);
    const variancePrefix = varianceVal > 0 ? '+' : '';
    return `${value} (${percentage}% | Var: ${variancePrefix}${varianceVal.toFixed(1)} pp)`;
  };


  return {
    inputText,
    setInputText,
    actualsDataUI,
    error,
    parseAndLogActuals,
    getVarianceColor,
    getPercentageString,
  };
};
