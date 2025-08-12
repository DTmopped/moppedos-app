// src/components/WeeklyOrderGuide.jsx
import React, {
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button.jsx';
import {
  Printer,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategory from '@/components/orderguide/OrderGuideCategory';

// storage-driven hook (returns { isLoading, error, itemsByCategory, refresh })
import { useOrderGuide } from '@/hooks/useOrderGuide';

// supabase client to fetch a default location
import { supabase } from '@/lib/supabaseClient';

const parBasedCategories = ['PaperGoods', 'CleaningSupplies', 'Condiments'];

const WeeklyOrderGuide = () => {
  const {
    isAdminMode: adminMode,
    toggleAdminMode,
    printDate,
    setPrintDate,
  } = useData();

  // --- NEW: pick a location automatically (first row in locations) ---
  const [locationId, setLocationId] = useState(null);
  const [locError, setLocError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLocError(null);
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setLocError(error);
      } else {
        setLocationId(data?.id ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch live data from Supabase view for the chosen location
  const { isLoading, error, itemsByCategory, refresh } =
    useOrderGuide(locationId);

  const printableRef = useRef();

  // refresh print date when data changes
  useEffect(() => {
    setPrintDate?.(new Date());
  }, [itemsByCategory, setPrintDate]);

  // Helpers (variance-based color + icon)
  const getStatusClass = useCallback((item) => {
    const { forecast, actual } = item || {};
    if (
      typeof forecast !== 'number' ||
      typeof actual !== 'number' ||
      forecast === 0
    )
      return '';
    const pct = ((actual - forecast) / forecast) * 100;

    if (Math.abs(pct) <= 10) return 'bg-green-500/10 text-green-700';
    if (pct <= 30) return 'bg-yellow-500/10 text-yellow-700';
    return 'bg-red-500/10 text-red-700';
  }, []);

  const getStatusIcon = useCallback((item) => {
    const { forecast, actual } = item || {};
    if (
      typeof forecast !== 'number' ||
      typeof actual !== 'number' ||
      forecast === 0
    ) {
      return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
    const pct = ((actual - forecast) / forecast) * 100;
    if (Math.abs(pct) <= 10)
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (pct <= 30) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <TrendingUp className="h-4 w-4 text-red-500" />;
  }, []);

  // The hook already normalizes rows; just alias to the UI var the rest
  // of this component expects.
  const uiGuideData = useMemo(() => {
    return itemsByCategory || {};
  }, [itemsByCategory]);

  // Early states around location discovery
  if (!locationId && !locError) {
    return (
      <div className="p-4 md:p-6 text-sm text-slate-600">
        Loading location…
      </div>
    );
  }
  if (locError) {
    return (
      <div className="p-4 md:p-6 text-sm text-red-600">
        Couldn’t load locations: {String(locError.message || locError)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Print Page Break Rule */}
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
          <Button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white no-print"
          >
            <Printer size={20} className="mr-2" /> Print
          </Button>
          <Button onClick={toggleAdminMode} variant="outline" className="no-print text-sm">
            {adminMode ? '🛠️ Admin Mode: ON' : 'Admin Mode: OFF'}
          </Button>
        </div>
      </div>

      {/* Loading / Error states for data */}
      {isLoading && (
        <div className="text-sm text-slate-600">Loading order guide…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">
          Sorry — couldn’t load the order guide. {String(error)}
          <Button className="ml-2" size="sm" onClick={refresh}>
            Retry
          </Button>
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
