import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDailyShiftPrepGuideLogic } from "@/hooks/useDailyShiftPrepGuideLogic.jsx";
import { triggerPrint } from "./prep/PrintUtils.jsx";
import PrintableDailyShiftPrepGuide from "./prep/PrintableDailyShiftPrepGuide.jsx";
import { useToast } from "./ui/use-toast.jsx";
import PrepGuideContent from "./prep/PrepGuideContent.jsx";
import PrintableSmartPrepGuide from "./prep/PrintableSmartPrepGuide.jsx";

const DailyShiftPrepGuide = () => {
  const {
    dailyShiftPrepData,
    adjustmentFactor,
  } = useDailyShiftPrepGuideLogic();

  const { toast } = useToast();
  const [expandedDays, setExpandedDays] = useState({});

  const handleInitiatePrint = async () => {
    const expandedDate = Object.keys(expandedDays).find((date) => expandedDays[date]);

    if (!expandedDate) {
      toast({ title: "Please expand a day before printing.", variant: "destructive" });
      return;
    }

    const selectedDay = dailyShiftPrepData.find((d) => d.date === expandedDate);
    if (!selectedDay) {
      toast({ title: "No prep data for selected day.", variant: "destructive" });
      return;
    }

    try {
      await triggerPrint(
        () => (
          <PrintableDailyShiftPrepGuide
            dailyShiftPrepData={[selectedDay]}
            printDate={new Date()}
          />
        ),
        {},
        `Daily Shift Prep Guide – ${expandedDate}`
      );
      toast({ title: "Print processed", variant: "success" });
    } catch (error) {
      toast({
        title: "Print failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <PrepGuideContent
        dailyShiftPrepData={dailyShiftPrepData}
        expandedDays={expandedDays}
        setExpandedDays={setExpandedDays}
      />

      <div className="text-right mt-4">
        <button
          onClick={handleInitiatePrint}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded"
        >
          Print / PDF
        </button>
      </div>
    </motion.div>
  );
};

export default DailyShiftPrepGuide;
