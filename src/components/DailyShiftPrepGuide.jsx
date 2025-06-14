import React from "react";
import { motion } from "framer-motion";
import { useDailyShiftPrepGuideLogic } from "@/hooks/useDailyShiftPrepGuideLogic.jsx";
import { triggerPrint } from "./prep/PrintUtils.jsx";
import PrintableDailyShiftPrepGuide from "./prep/PrintableDailyShiftPrepGuide.jsx";
import { useToast } from "./ui/use-toast.jsx";

const DailyShiftPrepGuide = () => {
  const {
    dailyShiftPrepData,
    adjustmentFactor,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {dailyShiftPrepData.map((entry) => (
        <div key={entry.date} className="rounded-lg border border-slate-700 bg-white shadow-md p-4">
          <h2 className="text-lg font-bold text-green-700 mb-1">
            {new Date(entry.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            <span className="text-sm text-green-500">
              (AM: {entry.amGuests} / PM: {entry.pmGuests})
            </span>
          </h2>

          {/* AM and PM Shifts */}
          {["am", "pm"].map((shiftKey) => {
            const shift = entry.shifts[shiftKey];
            if (!shift) return null;

            return (
              <div key={shiftKey} className="mt-4">
                <h3 className={`text-md font-semibold mb-2 ${shift.color}`}>
                  {shift.icon} {shift.name.toUpperCase()} Prep
                </h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-2 border-b">Item</th>
                      <th className="p-2 border-b text-right">Qty</th>
                      <th className="p-2 border-b text-left">Unit</th>
                      <th className="p-2 border-b text-left">Assigned To</th>
                      <th className="p-2 border-b text-center">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shift.prepItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2">{item.unit}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Assign"
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input type="checkbox" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}

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
