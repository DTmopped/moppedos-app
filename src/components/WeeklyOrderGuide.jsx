import React, { useState, useEffect, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button.jsx';
import {
  Printer, ShoppingBasket, Package,
  TrendingUp, AlertTriangle, CheckCircle2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategory from "@/components/orderguide/OrderGuideCategory";

const WeeklyOrderGuide = () => {
  const {
    forecastData, actualData, guideData, setGuideData,
    setPrintDate, adminMode, setAdminMode,
    manualAdditions, setManualAdditions
  } = useData();

  const safeGuideData = typeof guideData === 'object' && guideData !== null ? guideData : {};

  const generateOrderGuide = useCallback(() => {
    if (!forecastData || forecastData.length === 0) return;

    const ozPerLb = 16;
    const portionToLbs = (oz, guests) => ((guests * oz) / ozPerLb);

    const latestActual = actualData?.[actualData.length - 1];
    const forecastGuests = forecastData.reduce((sum, day) => sum + (day.guests || 0), 0);
    const actualGuests = latestActual?.guests || 0;
    const adjustmentFactor = (forecastGuests && actualGuests) ? (actualGuests / forecastGuests) : 1;

    const adjustedGuests = Math.round(forecastGuests * adjustmentFactor);
    const sandwichGuests = Math.round(adjustedGuests * 0.5);
    const plateGuests = adjustedGuests - sandwichGuests;
    const totalSidePortions = plateGuests * 3;

    const sideItemsLbs = ['Coleslaw', 'Collard Greens', 'Mac N Cheese', 'Baked Beans', 'Corn Casserole'];
    const sidePortionLbs = portionToLbs(4, totalSidePortions / sideItemsLbs.length);

    const guide = {
  "Meats": [
    { name: 'Brisket', forecast: Math.ceil(portionToLbs(4, plateGuests) + portionToLbs(6, sandwichGuests / 3)), unit: 'lbs' },
    { name: 'Pulled Pork', forecast: Math.ceil(portionToLbs(4, plateGuests) + portionToLbs(6, sandwichGuests / 3)), unit: 'lbs' },
    { name: 'Chicken', forecast: Math.ceil(portionToLbs(4, plateGuests) + portionToLbs(6, sandwichGuests / 3)), unit: 'lbs' },
    { name: 'St. Louis Ribs', forecast: Math.ceil(portionToLbs(16, plateGuests)), unit: 'lbs' },
    { name: 'Bone-in Short Rib', forecast: Math.ceil(portionToLbs(16, plateGuests)), unit: 'lbs' }
  ],
  "Bread": [
    { name: 'Buns', forecast: sandwichGuests, unit: 'each' },
    { name: 'Texas Toast', forecast: plateGuests, unit: 'each' }
  ],
  "Sides": [
    ...sideItemsLbs.map(item => ({
      name: item,
      forecast: Math.ceil(sidePortionLbs),
      unit: 'lbs'
    })),
    { name: 'Corn Muffin', forecast: plateGuests, unit: 'each' },
    { name: 'Honey Butter', forecast: plateGuests, unit: 'each' }
  ],
  "Sweets": [
    { name: 'Banana Pudding', forecast: plateGuests, unit: 'each' },
    { name: 'Key Lime Pie', forecast: plateGuests, unit: 'each' },
    { name: 'Hummingbird Cake', forecast: plateGuests, unit: 'each' }
  ],
  "Condiments": [
    { name: 'House Pickles (32oz)', forecast: Math.ceil((plateGuests * 3) / 50), unit: 'jars' },
    { name: 'Mop Glaze', forecast: 0, unit: 'oz' },
    { name: 'BBQ 1', forecast: 0, unit: 'oz' },
    { name: 'BBQ 2', forecast: 0, unit: 'oz' },
    { name: 'BBQ 3', forecast: 0, unit: 'oz' },
    { name: 'Hot Sauce 1', forecast: 0, unit: 'oz' },
    { name: 'Hot Sauce 2', forecast: 0, unit: 'oz' },
    { name: 'Hot Sauce 3', forecast: 0, unit: 'oz' }
  ],
  "PaperGoods": [
    { name: 'To-Go Cups', forecast: adjustedGuests * 3, unit: 'each' },
    { name: '1 oz Soufflé Cup', forecast: 0, unit: 'each' },
    { name: 'Cutlery Kit', forecast: adjustedGuests, unit: 'each' },
    { name: 'To-Go Bag Small', forecast: 0, unit: 'each' },
    { name: 'To-Go Bag Large', forecast: 0, unit: 'each' },
    { name: 'Moist Towelettes', forecast: adjustedGuests, unit: 'each' }
  ],
  "CleaningSupplies": [
    { name: 'Trash Bags', forecast: 0, unit: 'case' },
    { name: 'Gloves - S', forecast: 0, unit: 'case' },
    { name: 'Gloves - M', forecast: 0, unit: 'case' },
    { name: 'Gloves - L', forecast: 0, unit: 'case' },
    { name: 'Gloves - XL', forecast: 0, unit: 'case' },
    { name: 'Dish Soap', forecast: 0, unit: 'gal' },
    { name: 'Dish Sanitizer', forecast: 0, unit: 'gal' },
    { name: 'C-Folds', forecast: 0, unit: 'case' },
    { name: 'Sanitizing Wipes', forecast: 0, unit: 'case' },
    { name: 'Green Scrubbies', forecast: 0, unit: 'pack' },
    { name: 'Metal Scrubbies', forecast: 0, unit: 'pack' },
    { name: 'Broom', forecast: 0, unit: 'each' }
  ]
};
    console.log("Generated Order Guide:", guide);

    if (manualAdditions && typeof manualAdditions === 'object') {
      Object.entries(manualAdditions).forEach(([category, items]) => {
        if (!guide[category]) guide[category] = [];
        guide[category].push(...items);
      });
    }

    Object.keys(guide).forEach(category => {
      guide[category].forEach(item => {
        item.actual = 0;
        item.variance = (typeof item.forecast === 'number') ? (-item.forecast).toFixed(1) : '-';
      });
    });

    setGuideData(guide);
    setPrintDate(new Date());
  }, [forecastData, actualData, manualAdditions]);

  useEffect(() => {
    generateOrderGuide();
  }, [generateOrderGuide]);

  const handlePrint = () => {
    const printable = ReactDOMServer.renderToStaticMarkup(
      <PrintableOrderGuide data={guideData} />
    );
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printable);
    printWindow.document.close();
    printWindow.print();
  };

  const handleAddItem = (category) => {
    const name = prompt(`Add item to "${category}"\nEnter item name:`)?.trim();
    if (!name) return;
    const forecast = parseFloat(prompt(`Enter forecasted amount for "${name}":`));
    if (isNaN(forecast)) return;
    const unit = prompt(`What unit for "${name}"? (e.g. lbs, each)`);
    if (!unit) return;
    const newItem = { name, forecast, unit, actual: 0, variance: (-forecast).toFixed(1), isManual: true };
    setManualAdditions(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newItem]
    }));
  };

  const getStatusClass = (item) => {
    const { forecast, actual } = item;
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return 'bg-opacity-10 dark:bg-opacity-20';
    const variance = ((actual - forecast) / forecast) * 100;
    if (Math.abs(variance) <= 10) return 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400';
    if (variance <= 30) return 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400';
  };

  const getStatusIcon = (item) => {
    const { forecast, actual } = item;
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0)
      return <HelpCircle className="h-4 w-4 text-slate-500" />;
    const variance = ((actual - forecast) / forecast) * 100;
    if (Math.abs(variance) <= 10)
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (variance <= 30)
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <TrendingUp className="h-4 w-4 text-red-500" />;
  };

  if (!guideData || typeof guideData !== 'object' || Object.keys(guideData).length === 0) {
    return <div className="text-center p-8">Generating order guide...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"
        >
          Weekly Order Guide
        </motion.h1>
        <div className="flex gap-3 items-center">
          <Button onClick={handlePrint} className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white no-print">
            <Printer size={20} className="mr-2" /> Print
          </Button>
          <Button onClick={() => setAdminMode(!adminMode)} variant="outline" className="no-print text-sm">
            {adminMode ? '🛠️ Admin Mode: ON' : 'Admin Mode: OFF'}
          </Button>
        </div>
      </div>

    <AnimatePresence>
  <motion.div
    key="order-guide-wrapper"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="space-y-6"
  >
    {
      Object.entries(safeGuideData).map(([category, items]) => {
        console.log("📝 Rendering category:", category);
        console.log("➡️ Items value:", items);
        console.log("➡️ Type of items:", typeof items);
        console.log("➡️ items instanceof Array:", items instanceof Array);
        console.log("➡️ getStatusClass:", typeof getStatusClass);
        console.log("➡️ getStatusIcon:", typeof getStatusIcon);

        return (
          <div key={category}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{category}</h2>
              {adminMode && (
                <button
                  onClick={() => handleAddItem(category)}
                  className="text-sm text-blue-600 hover:underline no-print"
                >
                  + Add Item
                </button>
              )}
            </div>
            <OrderGuideCategory
              categoryTitle={category}
              items={items}
              getStatusClass={getStatusClass}
              getStatusIcon={getStatusIcon}
            />
          </div>
        );
      })
    }
  </motion.div>
</AnimatePresence>
    </div>
  );
};

export default WeeklyOrderGuide;
