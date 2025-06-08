import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Package } from 'lucide-react';

const PrepSectionCard = ({ sectionTitle, prepText, titleColor, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="glassmorphic-card h-full card-hover-glow">
      <CardHeader className="flex flex-row items-center space-x-3 pb-3">
        <Package size={24} className={`${iconColor || 'text-primary'} no-print`} />
        <CardTitle className={`text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r ${titleColor}`}>
          {sectionTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-slate-800/60 dark:bg-slate-900/70 p-4 rounded-lg text-sm text-slate-300 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto font-mono shadow-inner border border-slate-700/50 dark:border-slate-700 print:h-auto print:max-h-none print:bg-white print:text-black print:border-gray-300">
          {prepText || "Loading prep data..."}
        </pre>
      </CardContent>
    </Card>
  </motion.div>
);

export default PrepSectionCard;
