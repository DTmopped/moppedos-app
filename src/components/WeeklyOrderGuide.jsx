// src/components/WeeklyOrderGuide.jsx
import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button.jsx';
import { Printer, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategory from '@/components/orderguide/OrderGuideCategory';

// Storage-driven hook
import { useOrderGuide } from '@/hooks/useOrderGuide';

const parBasedCategories = ['PaperGoods', 'CleaningSupplies', 'Condiments'];

const WeeklyOrderGuide = () => {
  const {
    isAdminMode: adminMode,
    toggleAdminMode,
    printDate,
    setPrintDate,
    // TODO: wire this from context when multi‑location is ready
    // activeLocationId,
  } = useData();

  // TEMP: use your Test Location UUID now; replace later with activeLocationId
  const locationId = '00fe305a-6b02-4eaa-9bfe-cbc2d46d9e17';

  // ✅ Call the hook with an *object* for long‑term extensibility
  const { isLoading, error, itemsByCategory, refresh } = useOrderGuide({ locationId });

  const printableRef = useRef();

  // Refresh print date when data changes
  useEffect(() => {
    setPrintDate?.(new Date());
  }, [itemsByCategory, setPrintDate]);

  // Variance-based styling helpers (same behavior as before)
  const getStatusClass = useCallback((item) => {
    const { forecast, actual } = item || {};
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return '';
    const pct = ((actual - forecast) / forecast) * 100;
    if (Math.abs(pct) <= 10) return 'bg-green-500/10 text-green-700';
    if (pct <= 30) return 'bg-yellow-500/10 text-yellow-700';
    return 'bg-red-500/10 text-red-700';
  }, []);

  const getStatusIcon = useCallback((item) => {
    const { forecast, actual } = item || {};
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) {
      return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
    const pct = ((actual - forecast) / forecast) * 100;
    if (Math.abs(pct) <= 10) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (pct <= 30) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <TrendingUp className="h-4 w-4 text-red-500" />;
  }, []);

  // Ensure we always pass a plain object to children/printable
  const uiGuideData = useMemo(() => itemsByCategory ?? {}, [itemsByCategory]);

  return (
    <div className="p-4 md:p-6">
      {/* Print Page Break Rule */}
      <style>
        {`
          @media print {
            .print-break { page-break-before: always; break-before: page; }
            .print-break:first-of-type { page-break-before: auto; break-before: auto; }
          }
        `}
      </style>

      <div className="flex justify-between items-center mb-6 gap-2">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"
        >
          Weekly Order Guide
        </motion.h1>
        <div className="flex gap-3">
          <Button onClick={() => window.print()} className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white no-print">
            <Printer size={20} className="mr-2" /> Print
          </Button>
          <Button onClick={toggleAdminMode} variant="outline" className="no-print text-sm">
            {adminMode ? '🛠️ Admin Mode: ON' : 'Admin Mode: OFF'}
          </Button>
        </div>
      </div>

      {/* Loading / Error states */}
      {isLoading && <div className="text-sm text-slate-600">Loading order guide…</div>}

      {error && (
        <div className="text-sm text-red-600">
          Sorry — couldn’t load the order guide. {String(error?.message ?? error)}
          <Button className="ml-2" size="sm" onClick={refresh}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && (
        <AnimatePresence>
          <motion.div
            key="order-guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {Object.entries(uiGuideData).map(([category, items], index) => {
              if (!Array.isArray(items)) return null;
              return (
                <div key={category} className={index !== 0 ? 'print-break' : ''}>
                  <h2 className="text-xl font-bold mb-2">{category}</h2>
                  <OrderGuideCategory
                    categoryTitle={category}
                    items={items}
                    getStatusClass={getStatusClass}
                    getStatusIcon={getStatusIcon}
                    parBasedCategories={parBasedCategories}
                  />
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Hidden printable */}
      <div style={{ display: 'none' }}>
        <PrintableOrderGuide
          ref={printableRef}
          guideData={uiGuideData}
          printDate={printDate?.toLocaleDateString?.() ?? ''}
        />
      </div>
    </div>
  );
};

export default WeeklyOrderGuide;
