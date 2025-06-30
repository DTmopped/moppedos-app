import React, { useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { motion } from 'framer-motion';
import FullWeeklyPrepGuideHeader from '@/components/prep/FullWeeklyPrepGuideHeader.jsx';
import PrepGuideContent from '@/components/prep/PrepGuideContent.jsx';
import PrintableSmartPrepGuide from '@/components/prep/PrintableSmartPrepGuide.jsx';
import { PREP_GUIDE_ICON_COLORS } from '@/config/prepGuideConfig'; // <-- FIXED
import { useSmartPrepGuideLogic } from '@/hooks/useSmartPrepGuideLogic.jsx';

const SmartPrepGuide = () => {
  const {
    forecastData,
    menu,
    menuLoading,
    adjustmentFactor,
    prepTextBySection,
  } = useSmartPrepGuideLogic('fullPrepGuideMenu'); // <-- CLEANED

  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const [printDate, setPrintDate] = useState(new Date());

  const handlePrint = () => {
    setPrintDate(new Date());

    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableSmartPrepGuide 
        prepTextBySection={prepTextBySection} 
        printDate={printDate}
        menu={menu}
      />
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
          <title>Full Weekly Prep Guide - Print</title>
        </head>
        <body>
          ${printableComponentHtml}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();

    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  const titleColor = PREP_GUIDE_ICON_COLORS.fullWeekly;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <FullWeeklyPrepGuideHeader
        adjustmentFactor={adjustmentFactor}
        onManageMenuOpen={setManageMenuOpen}
        onPrint={handlePrint}
        manageMenuOpen={manageMenuOpen}
        setManageMenuOpen={setManageMenuOpen}
      />

      <PrepGuideContent
        forecastData={forecastData}
        menuLoading={menuLoading}
        menu={menu}
        prepTextBySection={prepTextBySection}
        guideType="fullWeekly"
        titleColor={titleColor}
      />
    </motion.div>
  );
};

export default SmartPrepGuide;
