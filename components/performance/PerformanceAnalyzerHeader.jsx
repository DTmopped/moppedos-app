import React from 'react';
import { CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { BarChartBig, FileText, ListChecks } from "lucide-react";

const PerformanceAnalyzerHeader = () => {
  const titleColor = "from-teal-500 to-cyan-600";
  return (
    <CardHeader className="pb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-full bg-gradient-to-tr ${titleColor} shadow-lg`}>
          <BarChartBig className="h-8 w-8 text-white" />
        </div>
        <div>
          <CardTitle className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${titleColor}`}>Performance Analyzer</CardTitle>
          <CardDescription className="text-slate-400">
            Paste daily POS actuals or multi-day performance logs to analyze and save data.
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
};

export default PerformanceAnalyzerHeader;
