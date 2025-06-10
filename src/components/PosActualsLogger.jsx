import React from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { FileText, BarChart2, Info, AlertTriangle } from "lucide-react";
import { usePosActualsParser, defaultInput as defaultPosInputText } from "@/hooks/usePosActualsParser";
import PosActualsResultsTable from "components/performance/PosActualsResultsTable.jsx";


const PosActualsInputSection = ({ inputText, setInputText, parseAndLogActuals }) => (
  <Card className="shadow-lg border-primary/20 border-2 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 text-slate-100">
    <CardHeader className="pb-4">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-lg">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">POS Actuals Logger</CardTitle>
          <CardDescription className="text-slate-400">
            Paste your daily POS email data to log and analyze actuals. Data will be saved.
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="mb-4 p-3 bg-slate-700/50 border border-slate-600 rounded-md">
        <p className="text-sm font-medium text-purple-300 mb-1">Required Format:</p>
        <pre className="text-xs text-slate-400 bg-slate-800 p-2 rounded overflow-x-auto">
{`Date: YYYY-MM-DD
Total Net Sales: $0.00
Food Cost: $0.00
Beverage Cost: $0.00
Labor Hours: 0 (Optional)
Labor Cost: $0.00`}
        </pre>
      </div>
      <div className="space-y-4">
        <Textarea
          id="actualsInput"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your POS report here..."
          className="min-h-[180px] text-sm font-mono bg-slate-700 border-slate-600 text-slate-300 focus:border-purple-500 transition-all duration-300 placeholder-slate-500"
        />
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button onClick={parseAndLogActuals} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300">
            <BarChart2 className="mr-2 h-4 w-4" /> Log Actuals & Save
          </Button>
        </motion.div>
      </div>
    </CardContent>
  </Card>
);

const InitialInfoCard = () => (
  <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
    <CardContent className="pt-6">
      <div className="text-center text-slate-400 flex flex-col items-center">
        <Info size={32} className="mb-2 text-purple-400" />
        <p>Enter POS data and click "Log Actuals & Save" to see results.</p>
        <p className="text-xs mt-1">Ensure the format includes lines like 'Date: YYYY-MM-DD', 'Total Net Sales: $X,XXX.XX', etc.</p>
      </div>
    </CardContent>
  </Card>
);


const PosActualsLogger = () => {
  const {
    inputText,
    setInputText,
    actualsDataUI,
    error,
    parseAndLogActuals,
    getVarianceColor,
    getPercentageString,
  } = usePosActualsParser(
    "Subject: Daily Sales Summary – May 13\nLocation: MOPPED BBQ – Terminal 4\nDate: 2025-05-13\nTotal Net Sales: $5,320.00\nBreakdown:\n- Food Sales: $3,800.00\n- Beverage Sales: $1,520.00\nCOGS:\n- Food Cost: $1,170.00\n- Beverage Cost: $310.00\nLabor:\n- Labor Hours: 34.5\n- Labor Cost: $760.00"
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <PosActualsInputSection 
        inputText={inputText}
        setInputText={setInputText}
        parseAndLogActuals={parseAndLogActuals}
      />

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

      {actualsDataUI && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PosActualsResultsTable 
            data={actualsDataUI} 
            getVarianceColor={getVarianceColor} 
            getPercentageString={getPercentageString} 
          />
        </motion.div>
      )}
      {!actualsDataUI && !error && inputText && ( 
        <InitialInfoCard />
      )}
    </motion.div>
  );
};

export default PosActualsLogger;
