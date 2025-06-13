import React from 'react';
import { motion } from 'framer-motion';
import DailyShiftPrepGuideHeader from './prep/DailyShiftPrepGuideHeader.jsx';
import PrepGuideContent from './prep/PrepGuideContent.jsx';
import PrintableDailyShiftPrepGuide from './prep/PrintableDailyShiftPrepGuide.jsx';
import { PREP_GUIDE_ICON_COLORS } from '@/config/prepGuideConfig.jsx';
import { useDailyShiftPrepGuideLogic } from '@/hooks/useDailyShiftPrepGuideLogic.jsx';
import { triggerPrint } from "./prep/PrintUtils.jsx";
import { useToast } from './ui/use-toast.jsx';

const DailyShiftPrepGuide = () => {
  const {
    dailyShiftPrepData,
    adjustmentFactor
  } = useDailyShiftPrepGuideLogic();

  const { toast } = useToast();

  const handleInitiatePrint = async () => {
    try {
      await triggerPrint(
        PrintableDailyShiftPrepGuide,
        { dailyShiftPrepData, adjustmentFactor },
        "Daily Shift Prep Guide - Print"
      );
      toast({ title: "Print processed", variant: "success" });
    } catch (error) {
      toast({ title: "Print failed", description: error.message, variant: "destructive" });
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
        onPrint={handleInitiatePrint}
        // optional: menu management below if needed later
        onManageMenuOpen={() => {}}
        MenuEditorComponent={null}
        manageMenuOpen={false}
        setManageMenuOpen={() => {}}
        onSaveMenu={() => {}}
      />

      <PrepGuideContent
        forecastData={dailyShiftPrepData}
        menuLoading={false}
        menu={{}} // remove if unused
        dailyShiftPrepData={dailyShiftPrepData}
        guideType="dailyShift"
        titleColor={titleColor}
        onPrepTaskChange={() => {}} // optional if checkbox needed
      />
    </motion.div>
  );
};

export default DailyShiftPrepGuide;
