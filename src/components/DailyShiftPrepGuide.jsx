import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useData } from "../../contexts/DataContext.jsx"; // ✅ fixed relative path
import DailyShiftPrepGuideHeader from "./prep/DailyShiftPrepGuideHeader.jsx";
import DayPrepCard from "./prep/DayPrepCard.jsx";
import { triggerPrint } from "./prep/PrintUtils.jsx";
import PrintableDailyShiftPrepGuide from "./prep/PrintableDailyShiftPrepGuide.jsx";
import { useDailyShiftPrepGuideLogic } from "../hooks/useDailyShiftPrepGuideLogic.jsx";
import { useToast } from "./ui/use-toast.jsx";
import { PREP_GUIDE_ICON_COLORS } from "../../config/prepGuideConfig.jsx";

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
  const titleColor = PREP_GUIDE_ICON_COLORS.dailyShift;

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

  const renderedCards = useMemo(() => {
    if (!dailyShiftPrepData || dailyShiftPrepData.length === 0) {
      return (
        <div className="text-muted-foreground text-sm px-4">
          No data available. Ensure forecast has been generated for this day.
        </div>
      );
    }

    return dailyShiftPrepData.map((section, index) => (
      <DayPrepCard
        key={section.title + index}
        section={section}
        onPrepTaskChange={handlePrepTaskChange}
        menuLoading={menuLoading}
        titleColor={titleColor}
      />
    ));
  }, [dailyShiftPrepData, handlePrepTaskChange, menuLoading, titleColor]);

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
      <div className="space-y-6">{renderedCards}</div>
    </motion.div>
  );
};

export default DailyShiftPrepGuide;
