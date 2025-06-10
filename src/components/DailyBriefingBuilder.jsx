import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { useToast } from './ui/use-toast.jsx';
import { FileText, Users, DollarSign, Clock, Sparkles, MessageSquare, ListChecks, StickyNote, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { useData } from "../contexts/DataContext.jsx";
import BriefingMetricsSection from "./briefing/BriefingMetricsSection";
import BriefingFormField from "./briefing/BriefingFormField";
import BriefingOutputSection from "./briefing/BriefingOutputSection";
import { PRE_SHIFT_ENERGIZERS, SPEND_PER_GUEST, generateBriefingText } from "@/lib/briefingUtils.jsx";

const DailyBriefingBuilder = () => {
  const { forecastData, actualData } = useData();
  const { toast } = useToast();

  const getInitialDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const [briefingDate, setBriefingDate] = useState(getInitialDate());
  const [modLead, setModLead] = useState("");
  const [focusPriority, setFocusPriority] = useState("");
  const [lineUpTime, setLineUpTime] = useState("");
  const [preShiftEnergizer, setPreShiftEnergizer] = useState("");
  const [eightySixItems, setEightySixItems] = useState("");
  const [staffingNotes, setStaffingNotes] = useState("");
  const [guestFeedback, setGuestFeedback] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");
  const [otherNotes, setOtherNotes] = useState("");

  const [briefingOutput, setBriefingOutput] = useState("Your generated briefing will appear here once you fill in the fields.");
  const [metrics, setMetrics] = useState({
    amGuests: "N/A",
    pmGuests: "N/A",
    yestForecastSales: "N/A",
    yestActualSales: "N/A",
    yestVariance: "N/A",
  });

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) {
      setMetrics(prev => ({ ...prev, amGuests: "No forecast data", pmGuests: "No forecast data" }));
    } else {
      const todayForecastEntry = forecastData[forecastData.length - 1];
      const guestsToday = todayForecastEntry.forecastSales / SPEND_PER_GUEST;
      setMetrics(prev => ({
        ...prev,
        amGuests: Math.round(guestsToday * 0.6).toString(),
        pmGuests: Math.round(guestsToday * 0.4).toString(),
      }));
    }

    if (forecastData && forecastData.length > 1 && actualData) {
      const yesterdayForecastEntry = forecastData[forecastData.length - 2];
      const yesterdayActualEntry = actualData.find(a => a.date === yesterdayForecastEntry.date);

      if (yesterdayForecastEntry && yesterdayActualEntry) {
        const variance = yesterdayForecastEntry.forecastSales !== 0 
          ? ((yesterdayActualEntry.actualSales - yesterdayForecastEntry.forecastSales) / yesterdayForecastEntry.forecastSales) * 100
          : 0;
        const roundedVar = variance.toFixed(1);
        const varianceLabel = variance >= 0 ? `+${roundedVar}` : roundedVar;
        
        setMetrics(prev => ({
          ...prev,
          yestForecastSales: yesterdayForecastEntry.forecastSales.toFixed(2),
          yestActualSales: yesterdayActualEntry.actualSales.toFixed(2),
          yestVariance: varianceLabel,
        }));
      } else {
         setMetrics(prev => ({ ...prev, yestForecastSales: "N/A", yestActualSales: "N/A", yestVariance: "N/A" }));
      }
    } else {
      setMetrics(prev => ({ ...prev, yestForecastSales: "N/A", yestActualSales: "N/A", yestVariance: "N/A" }));
    }
  }, [forecastData, actualData]);

  const handleGenerateBriefing = useCallback(() => {
    const energizer = PRE_SHIFT_ENERGIZERS.find(e => e.value === preShiftEnergizer);
    const briefingData = {
      briefingDate, modLead, focusPriority, lineUpTime,
      preShiftEnergizerLabel: energizer ? energizer.label : "N/A",
      eightySixItems, staffingNotes, guestFeedback, varianceNotes, otherNotes,
      ...metrics
    };
    const text = generateBriefingText(briefingData);
    setBriefingOutput(text);
    toast({
      title: "Briefing Generated!",
      description: "The briefing text is ready in the output section.",
      className: "bg-green-500 text-white",
    });
  }, [briefingDate, modLead, focusPriority, lineUpTime, preShiftEnergizer, eightySixItems, staffingNotes, guestFeedback, varianceNotes, otherNotes, metrics, toast]);
  
  const fields = [
    { id: "briefingDate", label: "Date", placeholder: "e.g. Monday, May 20, 2025", value: briefingDate, onChange: setBriefingDate, icon: CalendarDays },
    { id: "modLead", label: "MOD / Lead", placeholder: "Manager Name", value: modLead, onChange: setModLead, icon: Users },
    { id: "focusPriority", label: "Focus / Priority", placeholder: "Today's goal or priority", value: focusPriority, onChange: setFocusPriority, icon: Sparkles },
    { id: "lineUpTime", label: "Line-Up Time", placeholder: "HH:MM AM/PM", value: lineUpTime, onChange: setLineUpTime, icon: Clock },
    { id: "preShiftEnergizer", label: "Pre-Shift Energizer", type: "select", value: preShiftEnergizer, onChange: setPreShiftEnergizer, options: PRE_SHIFT_ENERGIZERS, placeholder: "Select Energizer", icon: MessageSquare },
    { id: "eightySixItems", label: "86’d Items or Menu Shifts", type: "textarea", placeholder: "Items to communicate", value: eightySixItems, onChange: setEightySixItems, icon: ListChecks },
    { id: "staffingNotes", label: "Staffing Notes", type: "textarea", placeholder: "Callouts, roles, adjustments", value: staffingNotes, onChange: setStaffingNotes, icon: Users },
    { id: "guestFeedback", label: "Guest Feedback or Follow-Ups", type: "textarea", placeholder: "From surveys, manager logs, team notes", value: guestFeedback, onChange: setGuestFeedback, icon: MessageSquare },
    { id: "otherNotes", label: "Other Notes / Reminders", type: "textarea", value: otherNotes, onChange: setOtherNotes, icon: StickyNote },
  ];

  const titleColor = "from-indigo-500 to-purple-600";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="glassmorphic-card card-hover-glow">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className={`p-3 rounded-full bg-gradient-to-tr ${titleColor} shadow-lg`}>
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className={`text-2xl font-bold gradient-text ${titleColor}`}>Daily Briefing Sheet</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Complete the fields below to generate your daily pre-shift briefing.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleGenerateBriefing} variant="gradient" size="lg" className={`bg-gradient-to-r ${titleColor} hover:brightness-110 self-start sm:self-center`}>
              <Sparkles size={18} className="mr-2"/> Generate Briefing
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <BriefingMetricsSection title="Today's Forecasted Volume" icon={Users} metrics={[
              { label: "Lunch (AM)", value: `${metrics.amGuests} guests`, icon: Users, iconColor: "text-blue-400" },
              { label: "Dinner (PM)", value: `${metrics.pmGuests} guests`, icon: Users, iconColor: "text-purple-400" },
            ]} />
            <BriefingMetricsSection title="Yesterday's Forecast vs Actual" icon={DollarSign}>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-sm text-muted-foreground flex items-center"><TrendingUp size={16} className="mr-1 text-green-400"/>Forecasted:</span>
                    <strong className="text-sm font-semibold text-foreground">{metrics.yestForecastSales}</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-sm text-muted-foreground flex items-center"><DollarSign size={16} className="mr-1 text-blue-400"/>Actual:</span>
                    <strong className="text-sm font-semibold text-foreground">{metrics.yestActualSales}</strong>
                </div>
                <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground flex items-center">
                        {parseFloat(metrics.yestVariance) >= 0 ? <TrendingUp size={16} className="mr-1 text-green-400"/> : <TrendingDown size={16} className="mr-1 text-red-400"/>}
                        Variance:
                    </span>
                    <strong className={`text-sm font-semibold ${parseFloat(metrics.yestVariance) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{metrics.yestVariance}%</strong>
                </div>
                <BriefingFormField id="varianceNotes" label="Notes on variance:" type="textarea" placeholder="e.g. Weather, delay, team issues..." value={varianceNotes} onChange={setVarianceNotes} minHeight="60px" />
              </div>
            </BriefingMetricsSection>
          </div>
          
          <div className="space-y-4">
            {fields.map(field => (
              <Card key={field.id} className="bg-card/80 dark:bg-card/70 border-border/50 shadow-sm p-4">
                 <BriefingFormField {...field} />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <BriefingOutputSection titleColor={titleColor} briefingOutput={briefingOutput} />
    </motion.div>
  );
};

export default DailyBriefingBuilder;
