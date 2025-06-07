import React from 'react';
import { Textarea } from "components/ui/textarea.jsx";
import { Button } from "components/ui/button.jsx";
import { motion } from "framer-motion";
import { FileText, ListChecks } from "lucide-react";


const PerformanceInputArea = ({ inputText, setInputText, analyzeData }) => {
  const titleColor = "from-teal-500 to-cyan-600";
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-md">
          <p className="text-sm font-medium text-purple-300 mb-1 flex items-center"><FileText size={16} className="mr-2"/>POS Actuals Format (Single Day):</p>
          <pre className="text-xs text-slate-400 bg-slate-800 p-2 rounded overflow-x-auto tabular-nums">
{`Date: YYYY-MM-DD
Total Net Sales: $0.00
Food Cost: $0.00
Beverage Cost: $0.00
Labor Hours: 0 (Optional)
Labor Cost: $0.00`}
          </pre>
        </div>
        <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-md">
          <p className="text-sm font-medium text-yellow-300 mb-1 flex items-center"><ListChecks size={16} className="mr-2"/>Performance Log Format (Multi-Day):</p>
          <pre className="text-xs text-slate-400 bg-slate-800 p-2 rounded overflow-x-auto">
{`Date: YYYY-MM-DD
Forecasted Sales: NNNN
Forecasted Food: NNNN
... (all required fields)
Total Sales: NNNN
Food Cost: NNNN
... (all required fields)

(Blank line for next entry)

Date: YYYY-MM-DD
...and so on`}
          </pre>
        </div>
      </div>
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste your data here..."
        className="min-h-[200px] text-sm font-mono bg-slate-700 border-slate-600 text-slate-300 focus:border-teal-500 transition-all duration-300 placeholder-slate-500"
      />
      <motion.div whileTap={{ scale: 0.98 }} className="mt-4">
        <Button onClick={analyzeData} className={`w-full bg-gradient-to-r ${titleColor} hover:brightness-110 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300`}>
          Analyze & Save Data
        </Button>
      </motion.div>
    </>
  );
};

export default PerformanceInputArea;
