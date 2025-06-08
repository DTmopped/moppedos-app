import React from 'react';
import { motion } from 'framer-motion';

const ShiftPrepDetails = ({ shiftKey, shiftInfo }) => (
  <motion.div 
    key={shiftKey} 
    className="bg-slate-700/50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-600/50 dark:border-slate-700 shadow-md shift-block"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className={`text-lg font-semibold ${shiftInfo.color || 'text-slate-100'} mb-2 flex items-center`}>
      {shiftInfo.icon} {shiftInfo.name}
    </h3>
    <pre className="bg-slate-800/70 dark:bg-slate-900/70 p-3 rounded-md text-xs text-slate-300 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto font-mono border border-slate-700/70 dark:border-slate-600/80 shadow-inner print:h-auto print:max-h-none print:bg-white print:text-black print:border-gray-300">
      {shiftInfo.prepText}
    </pre>
  </motion.div>
);

export default ShiftPrepDetails;