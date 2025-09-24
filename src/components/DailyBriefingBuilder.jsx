import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";
import { supabase } from "@/supabaseClient";
import DailyBriefingPrintButton from "@/components/briefing/DailyBriefingPrintButton";
import PrintableBriefingSheet from "@/components/PrintableBriefingSheet";

const DailyBriefingBuilder = () => {
  const { userId, locationId, locationUuid } = useUserAndLocation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [copiedFromYesterday, setCopiedFromYesterday] = useState(false);

  // Today's Forecast
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [forecastedSales, setForecastedSales] = useState("");
  const [forecastNotes, setForecastNotes] = useState("");

  // Yesterday's Recap
  const [actualSales, setActualSales] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");

  // Team & Leadership
  const [manager, setManager] = useState("");
  const [shoutout, setShoutout] = useState("");
  const [mindset, setMindset] = useState("");

  // Team Reminders
  const [reminders, setReminders] = useState("");

  // Food & Beverage Focus
  const [foodItems, setFoodItems] = useState("");
  const [beverageItems, setBeverageItems] = useState("");
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);

  // Events & Special Occasions
  const [events, setEvents] = useState("");



  // Maintenance & Repairs
  const [repairNotes, setRepairNotes] = useState("");

  // Inspirational Quote
  const [quote, setQuote] = useState("");

  const fetchBriefing = async () => {
    if (!locationId || !date) return;

    // Ensure we use the same UUID for both tables (convert to string to avoid bigint issues)
    const locationUuidString = String(locationUuid || locationId);
    const locationIdString = String(locationId);

    setLoading(true);
    setAutoPopulated(false);
    setCopiedFromYesterday(false);

    try {
      // 1. Fetch existing briefing for this date
      const { data: existingBriefing, error: existingError } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("location_id", locationIdString)
        .eq("date", date)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
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
        setRepairNotes(existingBriefing.repair_notes || "");
        setFoodImage(existingBriefing.food_image_url || null);
        setBeverageImage(existingBriefing.beverage_image_url || null);
      } else {
        // No existing briefing, perform smart auto-population
        await performSmartAutoPopulation(locationUuidString, locationIdString);
      }
    } catch (err) {
      console.error("Error fetching briefing:", err);
    } finally {
      setLoading(false);
    }
  };

  // Smart auto-population function
  const performSmartAutoPopulation = async (locationUuidString, locationIdString) => {
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
          .maybeSingle();

        if (!forecastError && forecastData) {
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
            // Format as currency: $9,000.00
            const formattedSales = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(forecastData.forecast_sales);
            setForecastedSales(formattedSales);
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
        }

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
          // Format as currency: $X,XXX.XX
          const formattedActualSales = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
          }).format(yesterdayData.actual_sales);
          setActualSales(formattedActualSales);
        }

        // 3. Fetch yesterday's briefing for auto-population
        const { data: yesterdayBriefing, error: yesterdayBriefingError } = await supabase
          .from("daily_briefings")
          .select("reminders, food_items, beverage_items, events, manager, repair_notes")
          .eq("location_id", locationIdString)
          .eq("date", yesterdayStr)
          .maybeSingle();

        if (!yesterdayBriefingError && yesterdayBriefing) {
          // Copy repetitive content from yesterday
          if (yesterdayBriefing.reminders) {
            setReminders(yesterdayBriefing.reminders);
            hasCopiedFromYesterday = true;
          }
          if (yesterdayBriefing.food_items) {
            setFoodItems(yesterdayBriefing.food_items);
            hasCopiedFromYesterday = true;
          }
          if (yesterdayBriefing.beverage_items) {
            setBeverageItems(yesterdayBriefing.beverage_items);
            hasCopiedFromYesterday = true;
          }
          if (yesterdayBriefing.events) {
            setEvents(yesterdayBriefing.events);
            hasCopiedFromYesterday = true;
          }
          if (yesterdayBriefing.manager) {
            setManager(yesterdayBriefing.manager);
            hasCopiedFromYesterday = true;
          }
          if (yesterdayBriefing.repair_notes) {
            setRepairNotes(yesterdayBriefing.repair_notes);
            hasCopiedFromYesterday = true;
          }
        }
      }

      setAutoPopulated(hasAutoPopulated);
      setCopiedFromYesterday(hasCopiedFromYesterday);
    } catch (err) {
      console.error("Error during auto-population:", err);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [locationId, date]);

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

  const handleImageUpload = (file, type) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'food') {
          setFoodImage(e.target.result);
        } else {
          setBeverageImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTextarea = (value, setValue, placeholder, showFromYesterday = false) => {
    return (
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {showFromYesterday && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              From Yesterday
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderInput = (value, setValue, placeholder, showAutoFilled = false) => {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full"
        />
        {showAutoFilled && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Auto-filled
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading briefing...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            📋 Daily Briefing Builder
          </h1>
          <p className="text-gray-600 mt-1">Create and manage your daily operational briefing</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={saveBriefing} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 h-10 flex items-center">
              💾 Save Briefing
            </Button>
            <DailyBriefingPrintButton className="bg-gray-600 hover:bg-gray-700 px-4 py-2 h-10 flex items-center">
              🖨️ Generate PDF
            </DailyBriefingPrintButton>
          </div>
        </div>
      </div>



      {copiedFromYesterday && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-purple-600">📋</span>
            <span className="text-purple-800 font-medium">Copied repetitive content from yesterday's briefing</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Forecast */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📊 Today's Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lunch">🍽️ Lunch (AM)</Label>
              {renderInput(lunch, setLunch, "", autoPopulated && !!lunch)}
            </div>
            <div>
              <Label htmlFor="dinner">🌙 Dinner (PM)</Label>
              {renderInput(dinner, setDinner, "", autoPopulated && !!dinner)}
            </div>
            <div>
              <Label htmlFor="forecasted-sales">💰 Forecasted Sales ($)</Label>
              {renderInput(forecastedSales, setForecastedSales, "", autoPopulated && !!forecastedSales)}
            </div>
            <div>
              <Label htmlFor="forecast-notes">📝 Notes...</Label>
              <textarea
                id="forecast-notes"
                value={forecastNotes}
                onChange={(e) => setForecastNotes(e.target.value)}
                placeholder="📝 Notes..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Yesterday's Recap */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📅 Yesterday's Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="actual-sales">Actual Sales ($)</Label>
              <Input
                id="actual-sales"
                value={actualSales}
                onChange={(e) => setActualSales(e.target.value)}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="variance-notes">⚠️ What affected results?</Label>
              <textarea
                id="variance-notes"
                value={varianceNotes}
                onChange={(e) => setVarianceNotes(e.target.value)}
                placeholder=""
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800 italic">
                ⭐ {quote}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team & Leadership */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>👥 Team & Leadership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manager">👤 Manager on Duty</Label>
              {renderInput(manager, setManager, "", copiedFromYesterday && !!manager)}
            </div>
            <div>
              <Label htmlFor="shoutout">🎉 Team Shoutouts</Label>
              <textarea
                id="shoutout"
                value={shoutout}
                onChange={(e) => setShoutout(e.target.value)}
                placeholder=""
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <Label htmlFor="mindset">❤️ Today's Mindset</Label>
              <textarea
                id="mindset"
                value={mindset}
                onChange={(e) => setMindset(e.target.value)}
                placeholder=""
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Reminders */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📝 Team Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTextarea(reminders, setReminders, "📝 Important notes...", copiedFromYesterday && !!reminders)}
          </CardContent>
        </Card>
      </div>

      {/* Food & Beverage Focus */}
      <Card className="rounded-2xl shadow-md lg:col-span-2">
        <CardHeader>
          <CardTitle>🍽️ Food & Beverage Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🍕 Food Items</h3>
              {renderTextarea(foodItems, setFoodItems, "Today's food specials and features...", copiedFromYesterday && !!foodItems)}
              <div>
                <Label htmlFor="food-image">📷 Food Image</Label>
                <input
                  id="food-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'food')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {foodImage && (
                  <div className="mt-2">
                    <img src={foodImage} alt="Food" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🍹 Beverage Items</h3>
              {renderTextarea(beverageItems, setBeverageItems, "Today's beverage specials and features...", copiedFromYesterday && !!beverageItems)}
              <div>
                <Label htmlFor="beverage-image">📷 Beverage Image</Label>
                <input
                  id="beverage-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'beverage')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {beverageImage && (
                  <div className="mt-2">
                    <img src={beverageImage} alt="Beverage" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
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



      {/* Maintenance & Repairs */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>🔧 Maintenance & Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTextarea(repairNotes, setRepairNotes, "🔨 Equipment issues, repairs needed...", copiedFromYesterday && !!repairNotes)}
        </CardContent>
      </Card>

      {/* Hidden Printable Component */}
      <div style={{ display: 'none' }}>
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
          repairNotes={repairNotes}
          foodImage={foodImage}
          beverageImage={beverageImage}
          quote={quote}
        />
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
