import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card.jsx";

const PosActualsResultsTable = ({ data, getVarianceColor, getPercentageString }) => {
  if (!data) {
    return (
      <Card className="shadow-md overflow-hidden bg-slate-800/70 border-slate-700 backdrop-blur-sm text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Daily Actuals Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">No POS actuals data to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md overflow-hidden bg-slate-800/70 border-slate-700 backdrop-blur-sm text-slate-100">
      <CardHeader>
        <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Daily Actuals Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-slate-700 shadow-inner">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr><th colSpan="2" className="p-3 text-left font-semibold text-slate-300 border-b border-slate-600">Date: {data.date}</th></tr>
              <tr><th className="p-3 text-left font-semibold text-slate-300">Category</th><th className="p-3 text-right font-semibold text-slate-300">Actual / Variance</th></tr>
            </thead>
            <tbody>
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="border-b border-slate-700 hover:bg-slate-700/60 transition-colors">
                <td className="p-3 font-medium text-slate-200">Total Sales</td><td className="p-3 text-right font-semibold text-green-400">${data.sales}</td>
              </motion.tr>
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="border-b border-slate-700 hover:bg-slate-700/60 transition-colors">
                <td className="p-3 font-medium text-slate-200">Food Cost</td><td className={`p-3 text-right ${getVarianceColor(data.foodVariance)}`}>{getPercentageString(data.food, data.foodPct, data.foodVariance)}</td>
              </motion.tr>
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="border-b border-slate-700 hover:bg-slate-700/60 transition-colors">
                <td className="p-3 font-medium text-slate-200">Beverage Cost</td><td className={`p-3 text-right ${getVarianceColor(data.bevVariance)}`}>{getPercentageString(data.bev, data.bevPct, data.bevVariance)}</td>
              </motion.tr>
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="border-b border-slate-700 hover:bg-slate-700/60 transition-colors">
                <td className="p-3 font-medium text-slate-200">Labor Cost</td><td className={`p-3 text-right ${getVarianceColor(data.laborVariance)}`}>{getPercentageString(data.labor, data.laborPct, data.laborVariance)}</td>
              </motion.tr>
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="hover:bg-slate-700/60 transition-colors last:border-b-0">
                <td className="p-3 font-medium text-slate-200">Labor Hours</td><td className="p-3 text-right text-slate-300">{data.hours} {data.hours === 'N/A' ? '' : 'hrs'}</td>
              </motion.tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PosActualsResultsTable;
