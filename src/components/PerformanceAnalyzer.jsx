import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "components/ui/card.jsx";
import { AlertTriangle, Info } from "lucide-react";
import PosActualsResultsTable from "components/performance/PosActualsResultsTable.jsx";
import PerformanceLogResultsTable from "components/performance/PerformanceLogTable.jsx";
import PerformanceAnalyzerHeader from "components/performance/PerformanceAnalyzerHeader.jsx";
import PerformanceInputArea from "components/performance/PerformanceInputArea.jsx";
import { usePerformanceAnalyzerLogic } from "@/hooks/usePerformanceAnalyzerLogic";

const PerformanceAnalyzer = () => {
  const {
    inputText,
    setInputText,
    analysisResult,
    error,
    analyzeData,
    getVarianceColor,
    getPercentageString,
    getPerfLogPercentageClass,
    isInitialState
  } = usePerformanceAnalyzerLogic();

  const renderResults = () => {
    if (!analysisResult) return null;

    if (analysisResult.type === "posActuals" && analysisResult.data.length > 0) {
      return <PosActualsResultsTable data={analysisResult.data[0]} getVarianceColor={getVarianceColor} getPercentageString={getPercentageString} />;
    }

    if (analysisResult.type === "performanceLog" && analysisResult.data.length > 0) {
      return <PerformanceLogResultsTable logData={analysisResult.data} getPercentageClass={getPerfLogPercentageClass} />;
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="shadow-xl border-primary/20 border-2 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 text-slate-100">
        <PerformanceAnalyzerHeader />
        <CardContent>
          <PerformanceInputArea inputText={inputText} setInputText={setInputText} analyzeData={analyzeData} />
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md border border-red-700 flex items-start">
              <AlertTriangle size={18} className="mr-2 mt-0.5 text-red-400 flex-shrink-0" /> 
              <span>{error}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="mt-6">
          {renderResults()}
        </motion.div>
      )}
      
      {isInitialState && !error && (
         <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
            <CardContent className="pt-6">
                <div className="text-center text-slate-400 flex flex-col items-center py-10">
                    <Info size={48} className="mb-4 text-teal-400" />
                    <p className="text-lg font-semibold text-slate-200">Welcome to the Performance Analyzer</p>
                    <p>Paste your daily POS actuals or multi-day performance logs into the text area above.</p>
                    <p>Click "Analyze & Save Data" to see the breakdown and save the information.</p>
                    <p className="text-xs mt-2">Ensure your input matches one of the formats described in the input area.</p>
                </div>
            </CardContent>
        </Card>
      )}

      {!isInitialState && !analysisResult && !error && inputText && (
        <Card className="shadow-lg bg-slate-800/70 border-slate-700 backdrop-blur-sm mt-6">
            <CardContent className="pt-6">
                <div className="text-center text-slate-400 flex flex-col items-center py-10">
                    <Info size={48} className="mb-4 text-teal-400" />
                    <p className="text-lg font-semibold text-slate-200">Ready to Analyze</p>
                    <p>You've entered data. Click "Analyze & Save Data" to process it.</p>
                </div>
            </CardContent>
        </Card>
       )}
    </motion.div>
  );
};

export default PerformanceAnalyzer;
