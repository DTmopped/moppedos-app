import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";
import DailyBriefingPrintButton from "@/components/briefing/DailyBriefingPrintButton";
import PrintableBriefingSheet from "@/components/PrintableBriefingSheet";

const FinalDailyBriefing = () => {
  const { userId, locationId, locationUuid } = useUserAndLocation();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manager, setManager] = useState("");
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [forecastedSales, setForecastedSales] = useState("");
  const [forecastNotes, setForecastNotes] = useState("");
  const [actualSales, setActualSales] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");
  const [shoutout, setShoutout] = useState("");
  const [reminders, setReminders] = useState("");
  const [mindset, setMindset] = useState("");
  const [foodItems, setFoodItems] = useState("");
  const [beverageItems, setBeverageItems] = useState("");
  const [events, setEvents] = useState("");
  const [repairNotes, setRepairNotes] = useState("");
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [copiedFromYesterday, setCopiedFromYesterday] = useState(false);

  // Fetch forecast data from fva_daily_history
  const fetchForecastData = async (targetDate) => {
    if (!locationUuid) return null;
    try {
      const { data, error } = await supabase
        .from("fva_daily_history")
        .select("am_guests, pm_guests, forecast_sales")
        .eq("location_uuid", locationUuid)
        .eq("date", targetDate)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) { console.error("Error fetching forecast data:", err); return null; }
  };

  // Fetch actual sales from fva_daily_history for a specific date
  const fetchActualsForDate = async (targetDate) => {
    if (!locationUuid) return null;
    try {
      const { data, error } = await supabase
        .from("fva_daily_history")
        .select("actual_sales")
        .eq("location_uuid", locationUuid)
        .eq("date", targetDate)
        .maybeSingle();
      if (error) throw error;
      return data?.actual_sales || null;
    } catch (err) { console.error("Error fetching actuals:", err); return null; }
  };

  // Fetch previous day's briefing for repetitive notes
  const fetchPreviousDayBriefing = async (targetDate) => {
    if (!locationId) return null;
    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateString = prevDate.toISOString().split("T")[0];
    try {
      const { data, error } = await supabase
        .from("daily_briefings")
        .select("reminders, food_items, beverage_items, events")
        .eq("location_id", locationId)
        .eq("date", prevDateString)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) { console.error("Error fetching previous day briefing:", err); return null; }
  };

  useEffect(() => {
    if (!locationId || !locationUuid || !date) return;

    const fetchBriefingWithAutoPopulation = async () => {
      setLoading(true);
      setAutoPopulated(false);
      setCopiedFromYesterday(false);

      try {
        const { data: existingBriefing, error: briefingError } = await supabase
          .from("daily_briefings")
          .select("*")
          .eq("location_id", locationId)
          .eq("date", date)
          .maybeSingle();

        if (briefingError) throw briefingError;

        if (existingBriefing) {
          // Load existing data
          setManager(existingBriefing.manager || "");
          setLunch(existingBriefing.lunch || "");
          setDinner(existingBriefing.dinner || "");
          setForecastedSales(existingBriefing.forecasted_sales || "");
          setForecastNotes(existingBriefing.forecast_notes || "");
          setActualSales(existingBriefing.actual_sales || "");
          setVarianceNotes(existingBriefing.variance_notes || "");
          setShoutout(existingBriefing.shoutout || "");
          setReminders(existingBriefing.reminders || "");
          setMindset(existingBriefing.mindset || "");
          setFoodItems(existingBriefing.food_items || "");
          setBeverageItems(existingBriefing.beverage_items || "");
          setEvents(existingBriefing.events || "");
          setRepairNotes(existingBriefing.repair_notes || "");
        } else {
          // Create new briefing with smart auto-population
          const forecastData = await fetchForecastData(date);
          const yesterdayActuals = await fetchActualsForDate(new Date(new Date(date).setDate(new Date(date).getDate() - 1)).toISOString().split("T")[0]);
          const prevDayBriefing = await fetchPreviousDayBriefing(date);

          // Auto-populate from forecast
          if (forecastData) {
            setLunch(forecastData.am_guests?.toString() || "");
            setDinner(forecastData.pm_guests?.toString() || "");
            setForecastedSales(forecastData.forecast_sales?.toString() || "");
            setForecastNotes("Auto-populated from forecast data.");
            setAutoPopulated(true);
          } else {
            setForecastNotes("No forecast data available for this date.");
          }

          // Auto-populate yesterday's actuals
          setActualSales(yesterdayActuals?.toString() || "");

          // Auto-populate from previous day's briefing
          if (prevDayBriefing) {
            setReminders(prevDayBriefing.reminders || "");
            setFoodItems(prevDayBriefing.food_items || "");
            setBeverageItems(prevDayBriefing.beverage_items || "");
            setEvents(prevDayBriefing.events || "");
            setCopiedFromYesterday(true);
          }

          // Clear fields that shouldn't be copied
          setManager("");
          setVarianceNotes("");
          setShoutout("");
          setMindset("");
          setRepairNotes("");
        }
      } catch (err) {
        console.error("Error in fetchBriefingWithAutoPopulation:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefingWithAutoPopulation();
  }, [date, locationId, locationUuid]);

  // DO NOT TOUCH - Inspirational Quote Feature
  useEffect(() => {
    const getQuote = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-daily-quote");
        if (error) throw error;
        if (data) setQuote(`"${data.text}" — ${data.author}`);
      } catch (err) {
        console.error("Failed to fetch daily quote:", err);
        setQuote('"The best way to predict the future is to create it." — Peter Drucker');
      }
    };
    getQuote();
  }, []);

  const saveBriefing = async () => {
    // ... (save logic remains the same)
  };

  const handleImageChange = (e, setter) => {
    // ... (image change logic remains the same)
  };

  const renderInput = (value, setter, placeholder, isAuto = false, isCopied = false) => (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className={`bg-gray-100 text-black rounded-md shadow-inner w-full ${
          isAuto ? 'border-blue-300 bg-blue-50' : ''
        } ${
          isCopied ? 'border-purple-300 bg-purple-50' : ''
        }`}
        disabled={loading}
      />
      {isAuto && <div className="absolute -top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">Auto-filled</div>}
      {isCopied && <div className="absolute -top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">From Yesterday</div>}
    </div>
  );

  const renderTextarea = (value, setter, placeholder, isCopied = false) => (
    <div className="relative">
        <Textarea
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={placeholder}
            className={`bg-gray-100 text-black rounded-md shadow-inner w-full min-h-[80px] ${
              isCopied ? 'border-purple-300 bg-purple-50' : ''
            }`}
            disabled={loading}
        />
        {isCopied && <div className="absolute -top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">From Yesterday</div>}
    </div>
  );

  // ... (rest of the component JSX remains the same, but uses the new renderInput/renderTextarea)

  return (
    <div className="p-6">
        {/* ... Header ... */}
        {autoPopulated && <div className="bg-blue-50 border-blue-200 p-4 mb-6 rounded-lg"><p className="text-blue-800">✨ Today's forecast data has been auto-populated.</p></div>}
        {copiedFromYesterday && <div className="bg-purple-50 border-purple-200 p-4 mb-6 rounded-lg"><p className="text-purple-800">📝 Repetitive notes from yesterday's briefing have been copied over.</p></div>}
        {/* ... Top Actions ... */}
        {/* ... Hidden Printable Component ... */}
        {/* ... Live Form Cards ... */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader><CardTitle>📊 Today’s Forecast</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {renderInput(lunch, setLunch, "😊 Lunch (AM)", autoPopulated && !!lunch)}
            {renderInput(dinner, setDinner, "🌙 Dinner (PM)", autoPopulated && !!dinner)}
            {renderInput(forecastedSales, setForecastedSales, "💰 Forecasted Sales ($)", autoPopulated && !!forecastedSales)}
            {renderTextarea(forecastNotes, setForecastNotes, "📝 Notes...")}
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md">
          <CardHeader><CardTitle>📅 Yesterday’s Recap</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {renderInput(actualSales, setActualSales, "Actual Sales ($)", autoPopulated && !!actualSales)}
            {renderTextarea(varianceNotes, setVarianceNotes, "⚠️ What affected results?")}
            {quote && <div className="bg-gray-100 p-4 rounded-lg shadow"><p className="text-blue-700 italic font-medium text-center">✨ {quote}</p></div>}
          </CardContent>
        </Card>
        {/* ... Mid Section ... */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader><CardTitle>📣 Team Reminders</CardTitle></CardHeader>
          <CardContent>{renderTextarea(reminders, setReminders, "✏️ Important notes...", copiedFromYesterday && !!reminders)}</CardContent>
        </Card>
        {/* ... etc. for other copied fields ... */}
    </div>
  );
};

export default FinalDailyBriefing;
