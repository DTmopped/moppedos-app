// src/components/WeeklyOrderGuide.jsx
import React, { useMemo, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button.jsx';
import { Printer, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategory from '@/components/orderguide/OrderGuideCategory';

// ✅ new: storage-driven hook
import { useOrderGuide } from '@/hooks/useOrderGuide';

const parBasedCategories = ['PaperGoods', 'CleaningSupplies', 'Condiments'];

const WeeklyOrderGuide = () => {
  const {
    isAdminMode: adminMode,
    toggleAdminMode,
    printDate,
    setPrintDate,
  } = useData();

  // ✅ fetch live data from Supabase (via the view)
  const { loading, error, groupedData, refresh } = useOrderGuide({
    locationId: null, // pass a specific location UUID when you wire multi-unit
  });

  const printableRef = useRef();

  // ✅ set/refresh print date whenever data changes
  React.useEffect(() => {
    setPrintDate?.(new Date());
  }, [groupedData, setPrintDate]);

  // ✅ Map DB/view rows -> your UI shape
  // v_order_guide likely returns: { category, item_name, unit, on_hand, par_level, order_quantity, inventory_status, item_status }
  // Your UI expects: { name, forecast, actual, variance, unit, status }
  const uiGuideData = useMemo(() => {
    if (!groupedData) return {};

    const mapped = {};
    Object.entries(groupedData).forEach(([category, rows]) => {
      mapped[category] = rows.map((r) => {
        const name = r.item_name ?? r.name ?? '';
        const unit = r.unit ?? '';
        const actual = Number(r.on_hand ?? 0);
        const forecast = Number(r.par_level ?? 0);
        const variance = (actual - forecast).toFixed(1);

        // prefer inventory_status (Critical/Low/Needs Order/In Stock) -> lowercase for consistency
        const statusRaw = r.inventory_status || r.item_status || 'auto';
        const status = String(statusRaw).toLowerCase();

        return {
          name,
          unit,
          actual,
          forecast,
          variance,
          status, // 'critical' | 'low' | 'in stock' | 'par item' | 'custom' | 'auto' etc.
        };
      });
    });
    return mapped;
  }, [groupedData]);

  // ✅ Styling helpers (unchanged behavior)
  const getStatusClass = React.useCallback((item) => {
    const { forecast, actual } = item || {};
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return '';
    const pct = ((actual - forecast) / forecast) * 100;

    if (Math.abs(pct) <= 10) return 'bg-green-500/10 text-green-700';
    if (pct <= 30) return 'bg-yellow-500/10 text-yellow-700';
    return 'bg-red-500/10 text-red-700';
  }, []);

  const getStatusIcon = React.useCallback((item) => {
    const { forecast, actual } = item || {};
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) {
      return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
    const pct = ((actual - forecast) / forecast) * 100;
    if (Math.abs(pct) <= 10) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (pct <= 30) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <TrendingUp className="h-4 w-4 text-red-500" />;
  }, []);

  return (
    <div className="p-4 md:p-6">
      {/* Print Page Break Rule (kept) */}
      <style>
        {`
          @media print {
            .print-break {
              page-break-before: always;
              break-before: page;
            }
            .print-break:first-of-type {
              page-break-before: auto;
              break-before: auto;
            }
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
      {loading && (
        <div className="text-sm text-slate-600">Loading order guide…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">
          Sorry — couldn’t load order guide. {String(error)}
          <Button className="ml-2" size="sm" onClick={refresh}>Retry</Button>
        </div>
      )}

      {!loading && !error && (
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
