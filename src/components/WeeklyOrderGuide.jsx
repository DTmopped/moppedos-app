import React, { useState, useEffect, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useData } from '@/contexts/DataContext';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Printer, ShoppingBasket, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintableOrderGuide from './orderguide/PrintableOrderGuide.jsx';
import OrderGuideCategoryComponent from './orderguide/OrderGuideCategory.jsx'; // Renamed to avoid conflict

const WeeklyOrderGuide = () => {
  const { forecastData, posData } = useData();
  const [guideData, setGuideData] = useState(null);
  const [printDate, setPrintDate] = useState(new Date());

  const ozPerLb = 16;
  const spendPerGuest = 15;

  const calculateWeeklyGuests = useCallback(() => {
    if (!forecastData || forecastData.length === 0) return 0;
    return forecastData.reduce((sum, day) => sum + ((day.forecastSales || 0) / spendPerGuest), 0);
  }, [forecastData]);

  const generateOrderGuide = useCallback(() => {
    const guests = calculateWeeklyGuests();
    const bbqGuests = guests * 0.5; // Assuming 50% of guests order BBQ items needing pickles/cups
    const pickleJars = Math.ceil((bbqGuests * 3) / 50); // 3 pickles per guest, 50 pickles per jar
    const toGoCups = Math.ceil(bbqGuests * 3); // Assuming 3 cups for relevant items

    const totalSandwiches =
      (posData["Pulled Pork Sandwich"] || 0) +
      (posData["Chopped Brisket Sandwich"] || 0) +
      (posData["Chopped Chicken Sandwich"] || 0);

    const guide = {
      Meats: [
        { name: "Brisket", forecast: +((guests * 6 + (posData["Chopped Brisket Sandwich"] || 0) * 4) / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Brisket"] },
        { name: "Pulled Pork", forecast: +((guests * 6 + (posData["Pulled Pork Sandwich"] || 0) * 4) / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Pulled Pork"] },
        { name: "Beef Short Rib", forecast: +(guests * 8 / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Beef Short Rib"] },
        { name: "Half Chicken", forecast: Math.ceil(guests * 0.5), unit: "each", posDataValue: posData["Half Chicken"] },
        { name: "St. Louis Ribs (1/2 rack)", forecast: Math.ceil(guests * 0.5), unit: "each", posDataValue: posData["St. Louis Ribs (1/2 rack)"] }
      ],
      Bread: [
        { name: "Buns (Forecasted)", forecast: Math.ceil(guests * 0.75), unit: "each" },
        { name: "Buns (Actual)", forecast: totalSandwiches, unit: "each", posDataValue: posData["Buns"] },
        { name: "Corn Muffins", forecast: Math.ceil(guests * 0.6), unit: "each", posDataValue: posData["Corn Muffins"] },
        { name: "Texas Toast", forecast: Math.ceil(bbqGuests), unit: "slices", posDataValue: posData["Texas Toast"] }
      ],
      Sides: [
        { name: "Mac & Cheese", forecast: +(guests * 4 / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Mac & Cheese"] },
        { name: "Baked Beans", forecast: +(guests * 4 / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Baked Beans"] },
        { name: "Collard Greens", forecast: +(guests * 4 / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Collard Greens"] },
        { name: "Coleslaw (combined)", forecast: +((guests * 4 + totalSandwiches * 2.5) / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Coleslaw"] },
        { name: "Corn Casserole", forecast: +(guests * 4 / ozPerLb).toFixed(1), unit: "lbs", posDataValue: posData["Corn Casserole"] }
      ],
      Sweets: [
        { name: "Banana Pudding", forecast: Math.ceil(guests * 0.4), unit: "each", posDataValue: posData["Banana Pudding"] },
        { name: "Hummingbird Cake", forecast: Math.ceil(guests * 0.2), unit: "each", posDataValue: posData["Hummingbird Cake"] },
        { name: "Key Lime Pie", forecast: Math.ceil(guests * 0.3), unit: "each", posDataValue: posData["Key Lime Pie"] }
      ],
      Condiments: [
        { name: "Mopped Sauce", forecast: "Prep for ~1 oz per guest", unit: "", posDataValue: posData["Mopped Sauce"] },
        { name: "BBQ Sauce 1", forecast: "Prep ~1 oz per guest", unit: "", posDataValue: posData["BBQ Sauce 1"] },
        { name: "BBQ Sauce 2", forecast: "Prep ~1 oz per guest", unit: "", posDataValue: posData["BBQ Sauce 2"] },
        { name: "BBQ Sauce 3", forecast: "Prep ~1 oz per guest", unit: "", posDataValue: posData["BBQ Sauce 3"] },
        { name: "Slaw Dressing", forecast: "Prep ~2 oz per guest", unit: "", posDataValue: posData["Slaw Dressing"] },
        { name: "House Pickles (32 oz jars)", forecast: pickleJars, unit: "jars", posDataValue: posData["House Pickles (32 oz jars)"] }
      ],
      PaperGoods: [
        { name: "Tray Liners", forecast: Math.ceil(guests), unit: "each", posDataValue: posData["Tray Liners"] },
        { name: "Foil Wrap Sheets", forecast: Math.ceil(guests * 0.75), unit: "each", posDataValue: posData["Foil Wrap Sheets"] },
        { name: "To-Go Cups/Lids", forecast: toGoCups, unit: "sets", posDataValue: posData["To-Go Cups/Lids"] },
        { name: "Cutlery Packs", forecast: Math.ceil(guests), unit: "each", posDataValue: posData["Cutlery Packs"] }
      ]
    };

    // Calculate actuals and variance for each item
    Object.keys(guide).forEach(category => {
      guide[category].forEach(item => {
        item.actual = item.posDataValue !== undefined ? item.posDataValue : (typeof item.forecast === 'number' ? 0 : "-");
        if (typeof item.forecast === 'number' && typeof item.actual === 'number') {
          item.variance = (item.actual - item.forecast).toFixed(1);
        } else {
          item.variance = "-";
        }
      });
    });
    
    return guide;
  }, [calculateWeeklyGuests, posData]);

  useEffect(() => {
    setGuideData(generateOrderGuide());
    setPrintDate(new Date());
  }, [generateOrderGuide]);

  const handlePrint = () => {
    const currentPrintDate = new Date();
    setPrintDate(currentPrintDate);

    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableOrderGuide guideData={guideData} printDate={currentPrintDate} />
    );

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px'; 
    iframe.style.top = '-9999px';

    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Weekly Order Guide - Print</title>
          <link rel="stylesheet" href="/src/styles/print.css" type="text/css" media="print" />
        </head>
        <body>
          ${printableComponentHtml}
        </body>
      </html>
    `);
    doc.close();
    
    // Wait for styles to load
    iframe.onload = () => {
        iframe.contentWindow.focus();
        setTimeout(() => {
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
        }, 500); // Delay ensures print dialog appears after content rendering
    };
     // Fallback if onload doesn't fire (e.g. for about:blank)
    if (iframe.contentWindow.document.readyState === "complete") {
        iframe.onload();
    }

  };

  if (!guideData) {
    return <div className="text-center p-8">Loading order guide data...</div>;
  }
  
  const categoryIcons = {
    Meats: ShoppingBasket,
    Bread: Package, // Using Package for variety
    Sides: ShoppingBasket,
    Sweets: Package,
    Condiments: ShoppingBasket,
    PaperGoods: Package,
  };

  const getStatusClass = (forecast, actual) => {
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return 'bg-opacity-10 dark:bg-opacity-20'; // Default/neutral if no valid numbers
    const variance = ((actual - forecast) / forecast) * 100;
    if (Math.abs(variance) <= 10) return 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'; // Good
    if (variance > 10 && variance <= 30) return 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'; // Warning
    return 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'; // Danger
  };

  const getStatusIcon = (forecast, actual) => {
    if (typeof forecast !== 'number' || typeof actual !== 'number' || forecast === 0) return <HelpCircle className="h-4 w-4 text-slate-500" />;
    const variance = ((actual - forecast) / forecast) * 100;
    if (Math.abs(variance) <= 10) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (variance > 10 && variance <= 30) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (variance > 30) return <TrendingUp className="h-4 w-4 text-red-500" />; // Over actual
    return <TrendingDown className="h-4 w-4 text-red-500" />; // Under actual
  };


  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 dark:from-sky-300 dark:via-blue-400 dark:to-indigo-500 mb-4 sm:mb-0"
        >
          Weekly Order Guide
        </motion.h1>
        <div className="print-header-date text-sm text-slate-400 dark:text-slate-500 hidden">
          Printed on: {printDate.toLocaleDateString()}
        </div>
        <Button onClick={handlePrint} variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white no-print shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
          <Printer size={20} className="mr-2" /> Print Order Guide
        </Button>
      </div>
      
      <AnimatePresence>
        <div className="space-y-6">
          {Object.entries(guideData).map(([category, items]) => (
            <OrderGuideCategoryComponent
              key={category} 
              categoryTitle={category} 
              items={items.map(item => [
                item.name,
                item.forecast,
                item.unit,
                item.actual,
                item.variance
              ])} 
              getStatusClass={getStatusClass}
              getStatusIcon={getStatusIcon} 
              icon={categoryIcons[category] || ShoppingBasket}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default WeeklyOrderGuide;
