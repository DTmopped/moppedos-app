import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDailyShiftPrepGuideLogic } from "@/hooks/useDailyShiftPrepGuideLogic.jsx";
import { triggerPrint } from "./prep/PrintUtils.jsx";
import PrintableDailyShiftPrepGuide from "./prep/PrintableDailyShiftPrepGuide.jsx";
import { useToast } from "./ui/use-toast.jsx";
import PrepGuideContent from "./prep/PrepGuideContent.jsx";
import { useMenuManager } from "@/hooks/useMenuManager.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Edit3 } from "lucide-react";

const DailyShiftPrepGuide = () => {
  const {
    dailyShiftPrepData,
    adjustmentFactor,
  } = useDailyShiftPrepGuideLogic();

  const [expandedDays, setExpandedDays] = useState({});
  const { toast } = useToast();
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const { menu, MenuEditorComponent } = useMenuManager("dailyPrepMenu");

  const selectedDay = dailyShiftPrepData.find((d) => expandedDays[d.date]);

  const handleInitiatePrint = async () => {
    try {
      await triggerPrint(
        () => (
          <PrintableDailyShiftPrepGuide
            dailyShiftPrepData={dailyShiftPrepData}
            printDate={new Date()}
          />
        ),
        {},
        "Daily Shift Prep Guide – Print"
      );
      toast({ title: "Print processed", variant: "success" });
    } catch (error) {
      toast({
        title: "Print failed",
        description: error.message,
        variant: "destructive",
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-200">
          Daily Shift Prep Guide
        </h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-indigo-400 border-indigo-600 hover:bg-indigo-700/30"
            onClick={() => setManageMenuOpen(!manageMenuOpen)}
          >
            <Edit3 size={16} className="mr-2" />
            {manageMenuOpen ? "Close Menu Editor" : "Manage Menu"}
          </Button>

          <Button
            onClick={handleInitiatePrint}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {manageMenuOpen && (
        <div className="border border-slate-700 rounded-lg shadow-lg p-4 bg-slate-800/60">
          <MenuEditorComponent sectionTitleColor="from-green-400 to-lime-500" />
        </div>
      )}

      <PrepGuideContent
        dailyShiftPrepData={dailyShiftPrepData}
        expandedDays={expandedDays}
        setExpandedDays={setExpandedDays}
      />
    </motion.div>
  );
};

export default DailyShiftPrepGuide;
