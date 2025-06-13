import React from 'react';
import { motion } from 'framer-motion';
import DailyShiftPrepGuideHeader from './prep/DailyShiftPrepGuideHeader.jsx';
import PrepGuideContent from './prep/PrepGuideContent.jsx';
import PrintableDailyShiftPrepGuide from './prep/PrintableDailyShiftPrepGuide.jsx';
import { PREP_GUIDE_ICON_COLORS } from '../config/prepGuideConfig.jsx';
import { useDailyShiftPrepGuideLogic } from '../hooks/useDailyShiftPrepGuideLogic.jsx';
import { triggerPrint } from './prep/PrintUtils.jsx';
import { useToast } from './ui/use-toast.jsx';

const DailyShiftPrepGuide = () => {
  const {
    forecastData,
    menu,
    MenuEditorComponent,
    menuLoading,
    adjustmentFactor,
    dailyShiftPrepData,
    manageMenuOpen,
    setManageMenuOpen,
    printDate,
    setPrintDate,
    handlePrepTaskChange,
    handleSaveMenu,
  } = useDailyShiftPrepGuideLogic();

  const { toast } = useToast();

  const handleInitiatePrint = async () => {
    const currentPrintDate = new Date();
    setPrintDate(currentPrintDate);

    const printData = {
      dailyShiftPrepData,
      printDate: currentPrintDate,
    };

    try {
      await triggerPrint(PrintableDailyShiftPrepGuide, printData, "Daily Shift Prep Guide - Print");
      toast({
        title: "Print Processed",
        description: "The print dialog has been closed or the print job was sent.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Print Error",
        description: error.message || "Could not complete the print operation.",
        variant: "destructive",
      });
    }
  };

  const titleColor = PREP_GUIDE_ICON_COLORS.dailyShift;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <DailyShiftPrepGuideHeader
        adjustmentFactor={adjustmentFactor}
        onManageMenuOpen={() => setManageMenuOpen(true)}
        onPrint={handleInitiatePrint}
        MenuEditorComponent={MenuEditorComponent}
        manageMenuOpen={manageMenuOpen}
        setManageMenuOpen={setManageMenuOpen}
        onSaveMenu={handleSaveMenu}
      />

      <PrepGuideContent
        forecastData={forecastData}
        menuLoading={menuLoading}
        menu={menu}
        dailyShiftPrepData={dailyShiftPrepData}
        guideType="dailyShift"
        titleColor={titleColor}
        onPrepTaskChange={handlePrepTaskChange}
      />
    </motion.div>
  );
};

export default DailyShiftPrepGuide;
