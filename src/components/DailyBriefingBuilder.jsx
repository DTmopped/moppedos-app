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

const DailyBriefingBuilder = () => {
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
  const [weeklySpecials, setWeeklySpecials] = useState("");
  const [repairNotes, setRepairNotes] = useState("");
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [copiedFromYesterday, setCopiedFromYesterday] = useState(false);

  // Enhanced fetch briefing with smart auto-population
  const fetchBriefing = async () => {
    if (!locationId || !date) return;
    
    setLoading(true);
    setAutoPopulated(false);
    setCopiedFromYesterday(false);

    tr      // 4. Fetch existing briefing for this date
      const { data: existingBriefing, error: existingError } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("location_id", locationIdString)
        .eq("date", date)
        .maybeSingle(); // Returns null if no record

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingBriefing) {
        // Load existing briefing data
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
        setWeeklySpecials(existingBriefing.weekly_specials || "");
        setRepairNotes(existingBriefing.repair_notes || "");
      } else {
        // Create new briefing with smart auto-population
        await performSmartAutoPopulation();
      }
    } catch (err) {
      console.error("Error fetching briefing:", err);
    } finally {
      setLoading(false);
    }
  };

  // Smart auto-populat  const fetchBriefing = async () => {
    if (!locationId || !date) return;

    // Ensure we use the same UUID for both tables (convert to string to avoid bigint issues)
    const locationUuidString = String(locationUuid || locationId);
    const locationIdString = String(locationId);

    let hasAutoPopulated = false;
    let hasCopiedFromYesterday = false;

    try {
      // 1. Fetch forecast data for today from fva_daily_history
      if (locationUuidString) {
        const { data: forecastData, error: forecastError } = await supabase
          .from("fva_daily_history")
          .select("am_guests, pm_guests, forecast_sales, forecast_guests, forecast_pax")
          .eq("location_uuid", locationUuidString)
          .eq("date", date)
          .maybeSingle();orecastError && forecastData) {
          // Use calculated AM/PM guest splits from your app logic
          if (forecastData.am_guests) {
            setLunch(forecastData.am_guests.toString());
            hasAutoPopulated = true;
          }
          
          if (forecastData.pm_guests) {
            setDinner(forecastData.pm_guests.toString());
            hasAutoPopulated = true;
          }
          
          // Fallback: if AM/PM splits aren't calculated yet, use total guests
          if (!forecastData.am_guests && !forecastData.pm_guests && forecastData.forecast_guests) {
            setLunch(forecastData.forecast_guests.toString());
            setDinner(""); // Leave dinner empty if no split available
            hasAutoPopulated = true;
          }
          
          if (forecastData.forecast_sales) {
            setForecastedSales(forecastData.forecast_sales.toString());
            hasAutoPopulated = true;
          }
          
          if (hasAutoPopulated) {
            const amPmNote = (forecastData.am_guests && forecastData.pm_guests) 
              ? "Auto-populated with calculated AM/PM guest splits."
              : "Auto-populated from forecast data (AM/PM calculation pending).";
            setForecastNotes(amPmNote);
          }
        } else {
          setForecastNotes("No forecast data available for this date.");
              // 2. Fetch yesterday's actual sales for variance analysis
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from("fva_daily_history")
          .select("actual_sales")
          .eq("location_uuid", locationUuidString)
          .eq("date", yesterdayStr)
          .maybeSingle();

        if (!yesterdayError && yesterdayData?.actual_sales) {
          setActualSales(yesterdayData.actual_sales.toString());
        }

        // 3. Fetch yesterday's briefing for auto-population
        const { data: yesterdayBriefing, error: yesterdayBriefingError } = await supabase
          .from("daily_briefings")
          .select("reminders, food_items, beverage_items, events, manager, repair_notes, weekly_specials")
          .eq("location_id", locationIdString)
          .eq("date", yesterdayStr)
          .maybeSingle(); await supabase
          .from("daily_briefings")
          .select("reminders, food_items, beverage_items, events, weekly_specials, manager, repair_notes")
          .eq("location_id", locationId)
          .eq("date", yesterdayString)
          .maybeSingle();

        if (!briefingError && yesterdayBriefing) {
          // Copy repetitive operational notes
          if (yesterdayBriefing.reminders && yesterdayBriefing.reminders.trim()) {
            setReminders(yesterdayBriefing.reminders);
            hasCopiedFromYesterday = true;
          }
          
          if (yesterdayBriefing.food_items && yesterdayBriefing.food_items.trim()) {
            setFoodItems(yesterdayBriefing.food_items);
            hasCopiedFromYesterday = true;
          }
          
          if (yesterdayBriefing.beverage_items && yesterdayBriefing.beverage_items.trim()) {
            setBeverageItems(yesterdayBriefing.beverage_items);
            hasCopiedFromYesterday = true;
          }
          
          if (yesterdayBriefing.events && yesterdayBriefing.events.trim()) {
            setEvents(yesterdayBriefing.events);
            hasCopiedFromYesterday = true;
          }
          
          if (yesterdayBriefing.weekly_specials && yesterdayBriefing.weekly_specials.trim()) {
            setWeeklySpecials(yesterdayBriefing.weekly_specials);
            hasCopiedFromYesterday = true;
          }
          
          if (yesterdayBriefing.manager && yesterdayBriefing.manager.trim()) {
            setManager(yesterdayBriefing.manager);
            hasCopiedFromYesterday = true;
          }
          
          if (yesterdayBriefing.repair_notes && yesterdayBriefing.repair_notes.trim()) {
            setRepairNotes(yesterdayBriefing.repair_notes);
            hasCopiedFromYesterday = true;
          }
        }
      }

      // Clear fields that should always be fresh
      setShoutout("");
      setMindset("");
      setVarianceNotes("");

      setAutoPopulated(hasAutoPopulated);
      setCopiedFromYesterday(hasCopiedFromYesterday);

    } catch (error) {
      console.error("Error in smart auto-population:", error);
      setForecastNotes("Error occurred during auto-population. Please enter data manually.");
    }
  };

  useEffect(() => {
    fetchBriefing();
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
    if (!locationId || !userId) {
      console.error("Missing locationId or userId");
      return;
    }

    try {
      const briefingData = {
        location_id: String(locationId),
        created_by: userId,
        date,
        manager,
        lunch,
        dinner,
        forecasted_sales: forecastedSales,
        forecast_notes: forecastNotes,
        actual_sales: actualSales,
        variance_notes: varianceNotes,
        shoutout,
        reminders,
        mindset,
        food_items: foodItems,
        beverage_items: beverageItems,
        events,
        weekly_specials: weeklySpecials,
        repair_notes: repairNotes,
        food_image_url: foodImage,
        beverage_image_url: beverageImage,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("daily_briefings")
        .upsert(briefingData, { 
          onConflict: 'location_id,date',
          returning: 'minimal'
        });

      if (error) throw error;
      
      console.log("Briefing saved successfully");
    } catch (err) {
      console.error("Error saving briefing:", err);
      alert("Failed to save briefing. Please try again.");
    }
  };

  const handleImageChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target.result);
      };
      reader.readAsDataURL(file);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading briefing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Daily Briefing Builder</h1>
          <p className="text-gray-600">Create and manage your daily operational briefing</p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Status indicators */}
      {autoPopulated && (
        <div className="bg-blue-50 border-blue-200 p-4 mb-6 rounded-lg">
          <p className="text-blue-800">✨ Today's forecast data has been auto-populated from your FVA system.</p>
        </div>
      )}
      
      {copiedFromYesterday && (
        <div className="bg-purple-50 border-purple-200 p-4 mb-6 rounded-lg">
          <p className="text-purple-800">📝 Repetitive operational notes have been copied from yesterday's briefing.</p>
        </div>
      )}

      {/* Top Actions */}
      <div className="flex space-x-3 mb-6">
        <Button onClick={saveBriefing} className="bg-blue-600 hover:bg-blue-700 text-white">
          💾 Save Briefing
        </Button>
        <DailyBriefingPrintButton />
      </div>

      {/* Hidden Printable Component */}
      <div style={{ display: "none" }}>
        <PrintableBriefingSheet
          date={date}
          manager={manager}
          lunch={lunch}
          dinner={dinner}
          forecastedSales={forecastedSales}
          forecastNotes={forecastNotes}
          actualSales={actualSales}
          varianceNotes={varianceNotes}
          shoutout={shoutout}
          reminders={reminders}
          mindset={mindset}
          foodItems={foodItems}
          beverageItems={beverageItems}
          events={events}
          weeklySpecials={weeklySpecials}
          repairNotes={repairNotes}
          foodImage={foodImage}
          beverageImage={beverageImage}
          quote={quote}
        />
      </div>

      {/* Live Form Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Forecast */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📊 Today's Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInput(lunch, setLunch, "😊 Lunch (AM)", autoPopulated && !!lunch)}
            {renderInput(dinner, setDinner, "🌙 Dinner (PM)", autoPopulated && !!dinner)}
            {renderInput(forecastedSales, setForecastedSales, "💰 Forecasted Sales ($)", autoPopulated && !!forecastedSales)}
            {renderTextarea(forecastNotes, setForecastNotes, "📝 Notes...")}
          </CardContent>
        </Card>

        {/* Yesterday's Recap */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📅 Yesterday's Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInput(actualSales, setActualSales, "Actual Sales ($)", autoPopulated && !!actualSales)}
            {renderTextarea(varianceNotes, setVarianceNotes, "⚠️ What affected results?")}
            
            {/* Inspirational Quote */}
            {quote && (
              <div className="bg-gray-100 p-4 rounded-lg shadow">
                <p className="text-blue-700 italic font-medium text-center">✨ {quote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team & Leadership */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>👥 Team & Leadership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInput(manager, setManager, "👨‍💼 Manager on Duty", false, copiedFromYesterday && !!manager)}
            {renderTextarea(shoutout, setShoutout, "🎉 Team Shoutouts")}
            {renderTextarea(mindset, setMindset, "🧠 Today's Mindset")}
          </CardContent>
        </Card>

        {/* Team Reminders */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📣 Team Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTextarea(reminders, setReminders, "✏️ Important notes...", copiedFromYesterday && !!reminders)}
          </CardContent>
        </Card>

        {/* Food & Beverage */}
        <Card className="rounded-2xl shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>🍽️ Food & Beverage Focus</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">🍕 Food Items</Label>
              {renderTextarea(foodItems, setFoodItems, "Today's food specials and features...", copiedFromYesterday && !!foodItems)}
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">📸 Food Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setFoodImage)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={loading}
                />
                {foodImage && (
                  <div className="mt-2">
                    <img src={foodImage} alt="Food preview" className="w-full h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">🍹 Beverage Items</Label>
              {renderTextarea(beverageItems, setBeverageItems, "Today's beverage specials and features...", copiedFromYesterday && !!beverageItems)}
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">📸 Beverage Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setBeverageImage)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  disabled={loading}
                />
                {beverageImage && (
                  <div className="mt-2">
                    <img src={beverageImage} alt="Beverage preview" className="w-full h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events & Special Occasions */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>🎉 Events & Special Occasions</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTextarea(events, setEvents, "🎊 Special events, holidays, promotions...", copiedFromYesterday && !!events)}
          </CardContent>
        </Card>

        {/* Weekly Specials */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>⭐ Weekly Specials</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTextarea(weeklySpecials, setWeeklySpecials, "🌟 This week's special offers and promotions...", copiedFromYesterday && !!weeklySpecials)}
          </CardContent>
        </Card>

        {/* Maintenance & Repairs */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>🔧 Maintenance & Repairs</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTextarea(repairNotes, setRepairNotes, "🛠️ Equipment issues, repairs needed...", copiedFromYesterday && !!repairNotes)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
