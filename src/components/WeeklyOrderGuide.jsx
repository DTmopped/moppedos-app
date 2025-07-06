
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button.jsx';
import { Printer, ShoppingBasket, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategoryComponent from './orderguide/OrderGuideCategory.jsx';

const WeeklyOrderGuide = () => {
  const { forecastData, posData } = useData();
  const [guideData, setGuideData] = useState(null);
  const [manualAdditions, setManualAdditions] = useState({});
  const [adminMode, setAdminMode] = useState(false);
  const [printDate, setPrintDate] = useState(new Date());

  const ozPerLb = 16;
  const spendPerGuest = 15;

  const calculateWeeklyGuests = useCallback(() => {
    if (!forecastData || forecastData.length === 0) return 0;
    return forecastData.reduce((sum, day) => sum + ((day.forecastSales || 0) / spendPerGuest), 0);
  }, [forecastData]);

  const generateOrderGuide = useCallback(() => {
    const guests = calculateWeeklyGuests();
    const bbqGuests = guests * 0.5;
    const pickleJars = Math.ceil((bbqGuests * 3) / 50);
    const toGoCups = Math.ceil(bbqGuests * 3);
    const totalSandwiches =
      (posData["Pulled Pork Sandwich"] || 0) +
      (posData["Chopped Brisket Sandwich"] || 0) +
      (posData["Chopped Chicken Sandwich"] || 0);

    const guide = {
      Meats: [], Bread: [], Sides: [], Sweets: [], Condiments: [], PaperGoods: []
      // Omitted for brevity, insert your items as needed
    };

    Object.entries(manualAdditions).forEach(([category, items]) => {
      if (!guide[category]) guide[category] = [];
      guide[category] = [...guide[category], ...items];
    });

    Object.keys(guide).forEach(category => {
      guide[category].forEach(item => {
        item.actual = item.posDataValue !== undefined
          ? item.posDataValue
          : typeof item.forecast === 'number' ? 0 : "-";
        item.variance =
          typeof item.forecast === 'number' && typeof item.actual === 'number'
            ? (item.actual - item.forecast).toFixed(1)
            : "-";
      });
    });

    return guide;
  }, [calculateWeeklyGuests, posData, manualAdditions]);

  useEffect(() => {
    setGuideData(generateOrderGuide());
    setPrintDate(new Date());
  }, [generateOrderGuide]);

  const handleAddItem = (category) => {
    const name = prompt(`Add item to "${category}"\nEnter item name:`)?.trim();
    if (!name) return;

    const forecastInput = prompt(`Enter forecasted amount for "${name}":`);
    const forecast = parseFloat(forecastInput);
    if (isNaN(forecast)) return alert("Must enter a number.");

    const unit = prompt(`What unit is used for "${name}"? (e.g. lbs, each)`)?.trim();
    if (!unit) return;

    const newItem = {
      name,
      forecast,
      unit,
      actual: 0,
      variance: (-forecast).toFixed(1),
      isManual: true
    };

    setManualAdditions(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newItem]
    }));
  };

  const handleDeleteItem = (category, name) => {
    setManualAdditions(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.name !== name)
    }));
  };

  const categoryIcons = { Meats: ShoppingBasket, Bread: Package, Sides: ShoppingBasket, Sweets: Package, Condiments: ShoppingBasket, PaperGoods: Package };

  const getStatusClass = (forecast, actual) => {
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return 'bg-opacity-10 dark:bg-opacity-20';
    const variance = ((actual - forecast) / forecast) * 100;
    if (Math.abs(variance) <= 10) return 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400';
    if (variance > 10 && variance <= 30) return 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400';
  };

  const getStatusIcon = (forecast, actual) => {
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return <HelpCircle className="h-4 w-4 text-slate-500" />;
    const variance = ((actual - forecast) / forecast) * 100;
    if (Math.abs(variance) <= 10) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (variance > 10 && variance <= 30) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (variance > 30) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (!guideData) return <div className="text-center p-8">Loading order guide data...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600">
          Weekly Order Guide
        </motion.h1>
        <div className="flex gap-3 items-center">
          <Button onClick={handlePrint} className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white no-print">
            <Printer size={20} className="mr-2" /> Print
          </Button>
          <Button onClick={() => setAdminMode(!adminMode)} variant="outline" className="no-print text-sm">
            {adminMode ? "🛠️ Admin Mode: ON" : "Admin Mode: OFF"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        <div className="space-y-6">
          {Object.entries(guideData).map(([category, items]) => (
            <div key={category}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{category}</h2>
                {adminMode && (
                  <button onClick={() => handleAddItem(category)} className="text-sm text-blue-600 hover:underline no-print">
                    + Add Item
                  </button>
                )}
              </div>
              <OrderGuideCategoryComponent
                categoryTitle={category}
                items={items.map(item => [
                  item.name,
                  item.forecast,
                  item.unit,
                  item.actual,
                  item.variance,
                  item.isManual || false
                ])}
                getStatusClass={getStatusClass}
                getStatusIcon={getStatusIcon}
                icon={categoryIcons[category] || ShoppingBasket}
                onDeleteItem={handleDeleteItem}
                adminMode={adminMode}
              />
            </div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default WeeklyOrderGuide;
