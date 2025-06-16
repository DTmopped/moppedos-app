import React from "react";
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

const handleInitiatePrint = async () => {
  try {
   await triggerPrint(
  () => (
    <PrintableSmartPrepGuide
      prepTextBySection={{
        BBQ: "Brisket: 40 lbs\nRibs: 30 lbs",
        Sandwiches: "Pulled Pork: 50 lbs\nBuns: 100 each"
      }}
      printDate={new Date()}
      menu={{ BBQ: true, Sandwiches: true }}
    />
  ),
  {},
  "Test Smart Prep Print"
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
      <PrepGuideContent dailyShiftPrepData={dailyShiftPrepData} />

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
