// Multi-tenant WeeklyOrderGuide - dynamically gets user's location (no hardcoding)
import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useUserAndLocation } from '@/hooks/useUserAndLocation';
import { Button } from '@/components/ui/button.jsx';
import { Printer, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategory from '@/components/orderguide/OrderGuideCategory';

import { useOrderGuide } from '@/hooks/useOrderGuide';

const parBasedCategories = ['PaperGoods', 'CleaningSupplies', 'Condiments'];

const CATEGORY_ORDER = [
  'Meats',
  'Sides',
  'Bread',
  'Sweets',
  'Condiments',
  'Dry Goods',
  'Produce',
  'PaperGoods',
  'CleaningSupplies',
  'Dairy',
  'Uncategorized',
];

const CATEGORY_ALIASES = {
  'meats': 'Meats',
  'meat': 'Meats',
  'meat items': 'Meats',

  'dry goods': 'Dry Goods',
  'drygoods': 'Dry Goods',
  'produce': 'Produce',

  'sides': 'Sides',
  'side': 'Sides',
  'side items': 'Sides',

  'bread': 'Bread',
  'breads': 'Bread',

  'sweets': 'Sweets',
  'desserts': 'Sweets',
  'sweet': 'Sweets',

  'condiments': 'Condiments',
  'sauces': 'Condiments',

  'paper goods': 'PaperGoods',
  'paper': 'PaperGoods',
  'paper products': 'PaperGoods',

  'cleaning supplies': 'CleaningSupplies',
  'cleaners': 'CleaningSupplies',
  'sanitizer': 'CleaningSupplies',

  'dairy': 'Dairy',
  'milk': 'Dairy',
  'cheese': 'Dairy',
  'butter': 'Dairy',

  'uncategorized': 'Uncategorized',
};

const WeeklyOrderGuide = () => {
  const {
    isAdminMode: adminMode,
    toggleAdminMode,
    printDate,
    setPrintDate,
  } = useData();

  // Multi-tenant: Get user's location dynamically (no hardcoding)
  const { user, locationId, locationName, loading: locationLoading, error: locationError } = useUserAndLocation();
  
  // Only fetch order guide data if we have a valid location
  const { isLoading, error, itemsByCategory, refresh } = useOrderGuide({ 
    locationId: locationId || null 
  });
console.log('🔍 WeeklyOrderGuide data:', { itemsByCategory, isLoading, error });

  const printableRef = useRef();

  // Debug logging for multi-tenant setup
  useEffect(() => {
    console.log('🏢 Multi-tenant Order Guide:', {
      user: user?.email,
      locationId,
      locationName,
      locationLoading,
      locationError: locationError?.message
    });
  }, [user, locationId, locationName, locationLoading, locationError]);

  useEffect(() => {
    setPrintDate?.(new Date());
  }, [itemsByCategory, setPrintDate]);

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

  const uiGuideData = useMemo(() => {
    if (!itemsByCategory) return {};

    const normalized = {};
    Object.entries(itemsByCategory ?? {}).forEach(([key, value]) => {
      const cleanKey = key?.trim().toLowerCase() || '';

      // Find alias (e.g., 'dry goods' → 'Dry Goods')
      const alias = CATEGORY_ALIASES[cleanKey];

      // Fallback to Title Case if alias not found
      const titleCasedKey = key
        ? key
            .toLowerCase()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Uncategorized';

      const finalKey = alias || titleCasedKey;

      // Merge if already exists
      if (normalized[finalKey]) {
        normalized[finalKey] = [...normalized[finalKey], ...value];
      } else {
        normalized[finalKey] = value;
      }
    });

    console.log('✅ Final normalized categories in UI:', Object.keys(normalized));
    return normalized;
  }, [itemsByCategory]);

  const orderedEntries = useMemo(() => {
    return CATEGORY_ORDER
      .filter(cat => Array.isArray(uiGuideData[cat]) && uiGuideData[cat].length > 0)
      .map(cat => [cat, uiGuideData[cat]]);
  }, [uiGuideData]);

  // Enhanced error handling for multi-tenant issues
  const renderError = () => {
    if (locationError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-red-600 mb-2">
            <strong>Location Access Error:</strong> {String(locationError?.message ?? locationError)}
          </div>
          <div className="text-xs text-red-500">
            <strong>Multi-tenant Debug:</strong>
            <br />• User: {user?.email || 'Not logged in'}
            <br />• User ID: {user?.id || 'None'}
            <br />• Location ID: {locationId || 'Not found'}
            <br />• Location Name: {locationName || 'Not found'}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            💡 This user may need to be assigned to a location in the user_locations table.
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-red-600 mb-2">
            <strong>Order Guide Error:</strong> {String(error?.message ?? error)}
          </div>
          <div className="text-xs text-red-500">
            <strong>Debug Info:</strong>
            <br />• Location ID: {locationId}
            <br />• Location Name: {locationName}
            <br />• User: {user?.email}
          </div>
          <Button className="mt-2" size="sm" onClick={refresh}>Retry</Button>
        </div>
      );
    }

    return null;
  };

  // Show loading state while getting user location
  if (locationLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-sm text-slate-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Loading user location...
        </div>
      </div>
    );
  }

  // Show error if no location found
  if (!locationId && !locationLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800 mb-2">
            <strong>No Location Assigned</strong>
          </div>
          <div className="text-xs text-yellow-700">
            This user ({user?.email}) is not assigned to any location.
            <br />Please contact your administrator to assign a location.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <style>{`
        @media print {
          .print-break { page-break-before: always; break-before: page; }
          .print-break:first-of-type { page-break-before: auto; break-before: auto; }
        }
      `}</style>

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

      {/* Multi-tenant location info */}
      <div className="text-xs text-slate-500 mb-4 no-print">
        📍 Location: {locationName || 'Unknown'} ({locationId})
        <br />👤 User: {user?.email}
      </div>

      {isLoading && (
        <div className="text-sm text-slate-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Loading order guide for {locationName}...
        </div>
      )}

      {renderError()}

      {!isLoading && !error && !locationError && (
        <AnimatePresence>
          <motion.div
            key="order-guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {orderedEntries.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg mb-2">No order guide items found</p>
                <p className="text-sm">
                  This could mean:
                  <br />• No items are assigned to {locationName}
                  <br />• Database view needs to be fixed
                  <br />• RLS policies are blocking access
                </p>
                <Button className="mt-4" onClick={refresh}>Refresh</Button>
              </div>
            ) : (
              orderedEntries.map(([category, items], index) => (
                <div key={category} className={index !== 0 ? 'print-break' : ''}>
                  <h2 className="text-xl font-bold mb-2">{category}</h2>
                  <OrderGuideCategory
                    categoryTitle={category}
                    items={items}
                    getStatusClass={getStatusClass}
                    getStatusIcon={getStatusIcon}
                    parBasedCategories={parBasedCategories}
                    locationId={locationId}
                    onRefresh={refresh}
                  />
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}

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
