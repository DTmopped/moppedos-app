import React from "react";
import { Textarea } from "components/ui/textarea.jsx";
import { Label } from "components/ui/label.jsx";
import { Button } from "components/ui/button.jsx";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const ForecastInputArea = ({ inputText, setInputText, generateForecast }) => {
  return (
    <>
      <div className="space-y-2 mb-6">
        <Label htmlFor="weeklyInput" className="text-sm font-medium text-slate-300">
          Weekly Passenger Data
        </Label>
        <Textarea
          id="weeklyInput"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Example:\nDate: YYYY-MM-DD (for Monday)\nMonday: 15000\nTuesday: 16000\n...`}
          className="min-h-[180px] text-sm font-mono bg-slate-800 border border-slate-600 text-slate-300 focus:border-pink-500 transition-all duration-300 placeholder-slate-500"
          aria-label="Weekly Passenger Data"
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
