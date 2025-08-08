// src/components/WeeklyOrderGuide.jsx
import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button.jsx';
import { Printer, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategory from '@/components/orderguide/OrderGuideCategory';

// ✅ storage-driven hook (your version that returns loading/error/groupedData/refresh)
import { useOrderGuide } from '@/hooks/useOrderGuide';

const parBasedCategories = ['PaperGoods', 'CleaningSupplies', 'Condiments'];

const WeeklyOrderGuide = () => {
  const {
    isAdminMode: adminMode,
    toggleAdminMode,
    printDate,
    setPrintDate,
    // if you later store the active location in context, grab it here:
    // activeLocationId,
  } = useData();

  // TODO: replace with a real location id once multi-unit wiring is done
  const TEST_LOCATION_ID = null; // e.g. '00fe305a-6b02-4eaa-9bfe-cbc2d46d9e17'

  // ✅ fetch live data from Supabase (via your view)
  const { loading, error, groupedData, refresh } = useOrderGuide({
    locationId: TEST_LOCATION_ID,
  });

  const printableRef = useRef();

  // ✅ refresh print date when data changes
  useEffect(() => {
    setPrintDate?.(new Date());
  }, [groupedData, setPrintDate]);

  // ✅ Helpers unchanged (variance-based color + icon)
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

  // ✅ Map DB/view rows -> your UI shape
  // groupedData is expected as { [category]: [{ item_name, unit, on_hand, par_level, inventory_status, ... }] }
  const uiGuideData = useMemo(() => {
    if (!groupedData || typeof groupedData !== 'object') return {};

    const mapped = {};
    Object.entries(groupedData).forEach(([category, rows]) => {
      mapped[category] = (rows || []).map((r) => {
        const name = r.item_name ?? r.name ?? '';
        const unit = r.unit ?? '';
        const actualNum = Number(r.on_hand ?? r.actual ?? 0);
        const forecastNum = Number(r.par_level ?? r.forecast ?? 0);
        const varianceNum = actualNum - forecastNum;

        // prefer inventory_status (Critical/Low/Needs Order/In Stock) if present, else fall back
        const statusRaw = r.inventory_status || r.item_status || r.status || 'auto';
        const status = String(statusRaw).toLowerCase();

        return {
          name,
          unit,
          actual: actualNum,
          forecast: forecastNum,
          variance: Number.isFinite(varianceNum) ? Number(varianceNum.toFixed(1)) : 0,
          status, // 'critical' | 'low' | 'in stock' | 'par item' | 'custom' | 'auto', etc.
        };
      });
    });
    return mapped;
  }, [groupedData]);

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
          Sorry — couldn’t load the order guide. {String(error)}
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
