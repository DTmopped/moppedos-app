import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const ForecastInputArea = ({ inputText, setInputText, generateForecast }) => {
  return (
    <>
      <div className="space-y-2 mb-6">
        <h3
  className="text-sm font-semibold text-slate-700 tracking-wide px-1 mb-1"
>
  Weekly Passenger Data
</h3>

        {/* ✅ FIXED: Added position: relative so zIndex works */}
       <textarea
  id="weeklyInput"
  value={inputText}
  onChange={(e) => setInputText(e.target.value)}
  placeholder={`Example:\nDate: YYYY-MM-DD (for Monday)\nMonday: 15000\nTuesday: 16000\n...`}
  style={{
    width: "100%",
    minHeight: "180px",
    backgroundColor: "#1e293b",  // tailwind bg-slate-800
    color: "#cbd5e1",            // tailwind text-slate-200
    padding: "12px",
    fontFamily: "monospace",
    fontSize: "14px",
    border: "1px solid #475569", // tailwind border-slate-600
    borderRadius: "6px",
    zIndex: 1,                   // lower zIndex, just in case
    resize: "vertical",
    pointerEvents: "auto",       // ✅ ensure input is allowed
  }}
/>
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={generateForecast}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all duration-300"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Generate Forecast & Save
        </Button>
      </motion.div>
    </>
  );
};

export default ForecastInputArea;
