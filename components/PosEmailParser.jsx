import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";
import { DollarSign, TrendingUp, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useData } from "contexts/DataContext.jsx";
import { useToast } from "components/ui/use-toast.jsx";

const PosEmailParser = () => {
  const [emailInput, setEmailInput] = useState(
    "Subject: Daily Sales Summary – May 13\nLocation: MOPPED BBQ – Terminal 4\nDate: 2025-05-13\nTotal Net Sales: $5,320.00\nBreakdown:\n- Food Sales: $3,800.00\n- Beverage Sales: $1,520.00\nCOGS:\n- Food Cost: $1,170.00\n- Beverage Cost: $310.00\nLabor:\n- Labor Hours: 34.5\n- Labor Cost: $760.00\nNotes:\n- Rainy day, slightly lower passenger traffic than expected."
  );
  const [parsedDataUI, setParsedDataUI] = useState(null);
  const [error, setError] = useState("");
  const { addActualEntry } = useData();
  const { toast } = useToast();

  const extractValue = useCallback((text, label) => {
    const regex = new RegExp(`${label}:\\s*\\$?([\\d,\\.]+)`, "i");
    const match = text.match(regex);
    return match ? parseFloat(match[1].replace(/,/g, "")) : null;
  }, []);

  const parsePOSEmail = useCallback(() => {
    setError("");
    setParsedDataUI(null);

    if (!emailInput.trim()) {
      setError("POS email content cannot be empty.");
      return;
    }

    const text = emailInput.toLowerCase();
    try {
      const dateMatch = text.match(/date:\s*([\d\-]+)/i);
      const date = dateMatch ? dateMatch[1] : "N/A";
      
      if (date === "N/A") {
        setError("Date not found in email content. Please ensure it's in the format 'Date: YYYY-MM-DD'.");
        return;
      }
      
      const sales = extractValue(text, "total net sales");
      const foodCost = extractValue(text, "food cost");
      const beverageCost = extractValue(text, "beverage cost");
      const laborCost = extractValue(text, "labor cost");
      
      const hoursMatch = text.match(/labor hours:\s*([\d\.]+)/i);
      const laborHours = hoursMatch ? parseFloat(hoursMatch[1]) : null;

      if (sales === null) {
        setError("'Total Net Sales' field not found or invalid. Please ensure it's in the format 'Total Net Sales: $X,XXX.XX'.");
        return;
      }
      if (foodCost === null) {
        setError("'Food Cost' field not found or invalid.");
        return;
      }
      if (beverageCost === null) {
        setError("'Beverage Cost' field not found or invalid.");
        return;
      }
      if (laborCost === null) {
        setError("'Labor Cost' field not found or invalid.");
        return;
      }
      if (laborHours === null && text.includes("labor hours:")) {
        setError("Labor Hours field is present but has an invalid value. Please check the email content.");
        return;
      }

      let foodPct = 0, bevPct = 0, laborPct = 0;

      if (sales > 0) {
        foodPct = (foodCost / sales) * 100;
        bevPct = (beverageCost / sales) * 100;
        laborPct = (laborCost / sales) * 100;
      } else if (sales === 0) {
         setError("Total Net Sales is zero. Cost percentages cannot be calculated meaningfully.");
      }

      const dataForContext = {
        date,
        actualSales: sales,
        foodCost,
        beverageCost,
        laborCost,
      };
      addActualEntry(dataForContext);

      const dataForUI = {
        date,
        sales,
        foodCost,
        foodPct,
        beverageCost,
        bevPct,
        laborCost,
        laborPct,
        laborHours: laborHours === null ? 'N/A' : laborHours,
      };
      setParsedDataUI(dataForUI);

      toast({
        title: "POS Data Parsed",
        description: `Actuals for ${date} added/updated in the central data store.`,
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (e) {
      console.error("POS Parsing error:", e);
      setError("An error occurred during parsing. Please check the email content format and console for details.");
      setParsedDataUI(null);
    }
  }, [emailInput, extractValue, addActualEntry, toast]);

  const getRowClass = (pct, limit) => {
    if (parsedDataUI && parsedDataUI.sales === 0) return "";
    if (isNaN(pct) || pct === 0) return ""; 
    return pct > limit ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300";
  };

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
            <div className="p-3 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">POS Email Parser Bot</CardTitle>
              <CardDescription className="text-slate-400">
                Paste daily POS email content to parse and view key metrics. Data will be saved to the central store.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <Label htmlFor="posEmailInput" className="text-sm font-medium text-slate-300">Daily POS Email Content</Label>
            <Textarea
              id="posEmailInput"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Paste POS email content here... e.g.&#10;Date: 2023-10-27&#10;Total Net Sales: $1,234.56&#10;Food Cost: $300.00&#10;Beverage Cost: $150.00&#10;Labor Cost: $200.00&#10;Labor Hours: 25.5&#10;..."
              className="min-h-[200px] text-sm font-mono bg-slate-700 border-slate-600 text-slate-300 focus:border-amber-500 transition-all duration-300 placeholder-slate-500"
            />
          </div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={parsePOSEmail} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300">
              <TrendingUp className="mr-2 h-4 w-4" /> Parse POS Email & Save
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

      {parsedDataUI && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Parsed POS Metrics</CardTitle>
              <CardDescription className="text-slate-400">Date: {parsedDataUI.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-slate-700 shadow-inner">
                <Table>
                  <TableHeader className="bg-slate-700/50">
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300">Metric</TableHead>
                      <TableHead className="text-right text-slate-300">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b border-slate-700 hover:bg-slate-700/60 transition-colors">
                      <TableCell className="font-medium text-slate-200">Total Sales</TableCell>
                      <TableCell className="text-right text-slate-300">${parsedDataUI.sales.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className={`border-b border-slate-700 hover:bg-slate-700/60 transition-colors ${getRowClass(parsedDataUI.foodPct, 30)}`}>
                      <TableCell className="font-medium text-slate-200">Food Cost</TableCell>
                      <TableCell className="text-right">
                        ${parsedDataUI.foodCost.toFixed(2)} 
                        {parsedDataUI.sales > 0 ? ` (${parsedDataUI.foodPct.toFixed(1)}%)` : ' (N/A)'}
                      </TableCell>
                    </TableRow>
                    <TableRow className={`border-b border-slate-700 hover:bg-slate-700/60 transition-colors ${getRowClass(parsedDataUI.bevPct, 20)}`}>
                      <TableCell className="font-medium text-slate-200">Beverage Cost</TableCell>
                      <TableCell className="text-right">
                        ${parsedDataUI.beverageCost.toFixed(2)}
                        {parsedDataUI.sales > 0 ? ` (${parsedDataUI.bevPct.toFixed(1)}%)` : ' (N/A)'}
                      </TableCell>
                    </TableRow>
                    <TableRow className={`border-b border-slate-700 hover:bg-slate-700/60 transition-colors ${getRowClass(parsedDataUI.laborPct, 14)}`}>
                      <TableCell className="font-medium text-slate-200">Labor Cost</TableCell>
                      <TableCell className="text-right">
                        ${parsedDataUI.laborCost.toFixed(2)}
                        {parsedDataUI.sales > 0 ? ` (${parsedDataUI.laborPct.toFixed(1)}%)` : ' (N/A)'}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-slate-700/60 transition-colors last:border-b-0">
                      <TableCell className="font-medium text-slate-200">Labor Hours</TableCell>
                      <TableCell className="text-right text-slate-300">{parsedDataUI.laborHours} {parsedDataUI.laborHours === 'N/A' ? '' : 'hrs'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
       {!parsedDataUI && !error && emailInput && (
        <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
            <CardContent className="pt-6">
                <div className="text-center text-slate-400 flex flex-col items-center">
                    <Info size={32} className="mb-2 text-amber-500" />
                    <p>Enter POS email data and click "Parse POS Email & Save" to see results.</p>
                    <p className="text-xs mt-1">Ensure the format includes lines like 'Date: YYYY-MM-DD', 'Total Net Sales: $X,XXX.XX', etc.</p>
                </div>
            </CardContent>
        </Card>
       )}
    </motion.div>
  );
};

export default PosEmailParser;
