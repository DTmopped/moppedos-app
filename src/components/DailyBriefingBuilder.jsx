import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";
import { supabase } from "@/supabaseClient";
import DailyBriefingPrintButton from "@/components/briefing/DailyBriefingPrintButton";
import PrintableBriefingSheet from "@/components/PrintableBriefingSheet";
import { getWeatherForecast } from "@/lib/weather"; // ✅ Make sure this path is correct

const DailyBriefingBuilder = () => {
  const { userId, locationId, locationUuid } = useUserAndLocation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [copiedFromYesterday, setCopiedFromYesterday] = useState(false);

  // ✅ Today's Forecast
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [forecastedSales, setForecastedSales] = useState("");
  const [forecastNotes, setForecastNotes] = useState(""); // for AM/PM note
  const [weather, setWeather] = useState(null); // ✅ only once here

  // ✅ Yesterday's Recap
  const [actualSales, setActualSales] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");

  // ✅ Team & Leadership
  const [manager, setManager] = useState("");
  const [shoutout, setShoutout] = useState("");
  const [mindset, setMindset] = useState("");

  // ✅ Team Reminders
  const [reminders, setReminders] = useState("");

  // ✅ Food & Beverage Focus
  const [foodItems, setFoodItems] = useState("");
  const [beverageItems, setBeverageItems] = useState("");
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);

  // ✅ Events & Special Occasions
  const [events, setEvents] = useState("");

  // ✅ Maintenance & Repairs
  const [repairNotes, setRepairNotes] = useState("");

  // ✅ Inspirational Quote
  const [quote, setQuote] = useState("");

  const fetchBriefing = async () => {
    if (!locationId || !date) return;

    const locationUuidString = String(locationUuid || locationId);
    const locationIdString = String(locationId);

    setLoading(true);
    setAutoPopulated(false);

    try {
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
        setActualSales(existingBriefing.actual_sales || "");
        setForecastNotes(existingBriefing.forecast_notes || ""); // ✅ Add th
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
        await performSmartAutoPopulation(locationUuidString, locationIdString);
      }
    } catch (err) {
      console.error("Error fetching briefing:", err);
    } finally {
      setLoading(false);
    }
  };

const performSmartAutoPopulation = async (locationUuidString, locationIdString) => {
  let hasAutoPopulated = false;

  try {
    if (locationUuidString) {
      // Forecast data
      const { data: forecastData, error: forecastError } = await supabase
        .from("fva_daily_history")
        .select("am_guests, pm_guests, forecast_sales, forecast_guests")
        .eq("location_uuid", locationUuidString)
        .eq("date", date)
        .maybeSingle();

      if (!forecastError && forecastData) {
        if (forecastData.am_guests !== null && forecastData.am_guests !== undefined) {
          setLunch(forecastData.am_guests.toString());
          hasAutoPopulated = true;
        }
        if (forecastData.pm_guests !== null && forecastData.pm_guests !== undefined) {
          setDinner(forecastData.pm_guests.toString());
          hasAutoPopulated = true;
        }
        if (!forecastData.am_guests && !forecastData.pm_guests && forecastData.forecast_guests) {
          setLunch(forecastData.forecast_guests.toString());
          setDinner("");
          hasAutoPopulated = true;
        }
        if (forecastData.forecast_sales) {
          const formattedSales = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
          }).format(forecastData.forecast_sales);
          setForecastedSales(formattedSales);
          hasAutoPopulated = true;
        }
      }

      // Yesterday’s actual sales
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
        const formattedActualSales = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(yesterdayData.actual_sales);
        setActualSales(formattedActualSales);
      }

      // ✅ Carry over notes + images from yesterday’s daily briefing
      const { data: yesterdayBriefing, error: yesterdayBriefingError } = await supabase
        .from("daily_briefings")
        .select("manager, shoutout, mindset, reminders, food_items, beverage_items, events, repair_notes, food_image_url, beverage_image_url")
        .eq("location_id", locationIdString)
        .eq("date", yesterdayStr)
        .maybeSingle();

      if (!yesterdayBriefingError && yesterdayBriefing) {
        setManager(yesterdayBriefing.manager || "");
        setShoutout(yesterdayBriefing.shoutout || "");
        setMindset(yesterdayBriefing.mindset || "");
        setReminders(yesterdayBriefing.reminders || "");
        setFoodItems(yesterdayBriefing.food_items || "");
        setBeverageItems(yesterdayBriefing.beverage_items || "");
        setEvents(yesterdayBriefing.events || "");
        setRepairNotes(yesterdayBriefing.repair_notes || "");
        setFoodImage(yesterdayBriefing.food_image_url || null);
        setBeverageImage(yesterdayBriefing.beverage_image_url || null);
        setCopiedFromYesterday(true);
      }
    }

    setAutoPopulated(hasAutoPopulated);
  } catch (err) {
    console.error("Error during auto-population:", err);
  }
};
  useEffect(() => {
    fetchBriefing();
  }, [locationId, date]);

  // Inspirational Quote
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

  // Fetch Weather
  useEffect(() => {
  if (!locationUuid || !date) return;

  const fetchWeather = async () => {
    const data = await getWeatherForecast(locationUuid, date);
    if (data) {
      setWeather(data);
    }
  };

  fetchWeather();
}, [locationUuid, date]);
  const saveBriefing = async () => {
  if (!locationId || !date) return;

const parseDollarString = (str) => {
  if (!str) return null;
  return parseFloat(str.replace(/[^0-9.-]+/g, ""));
};

const saveBriefing = async () => {
  if (!locationId || !date) return;

  const cleanedForecastSales = parseDollarString(forecastedSales);
  const cleanedActualSales = parseDollarString(actualSales);

  const { error } = await supabase.from("daily_briefings").upsert({
    location_id: locationId,
    date: date,
    lunch: lunch || null,
    dinner: dinner || null,
    forecasted_sales: cleanedForecastSales,
    forecast_notes: forecastNotes || null,
    actual_sales: cleanedActualSales,
    variance_notes: varianceNotes || null,
    manager: manager || null,
    shoutout: shoutout || null,
    mindset: mindset || null,
    reminders: reminders || null,
    food_items: foodItems || null,
    beverage_items: beverageItems || null,
    events: events || null,
    repair_notes: repairNotes || null,
    food_image_url: foodImage || null,
    beverage_image_url: beverageImage || null,
    // ✅ Weather fields
    weather_icon: weather?.icon || null,
    weather_conditions: weather?.conditions || null,
    weather_temp_high: weather?.temperature_high || null,
    weather_temp_low: weather?.temperature_low || null,
  });

  if (error) {
    console.error("❌ Failed to save briefing:", error);
    alert("❌ Save failed");
  } else {
    alert("✅ Briefing saved!");
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

  const renderTextarea = (value, setValue, placeholder, showFromYesterday = false) => (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  const renderInput = (value, setValue, placeholder, showAutoFilled = false) => (
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

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto px-4 py-2 h-10 border border-gray-300 rounded-md align-middle self-end"
            />
          </div>

          <div className="flex items-center gap-2 -mt-3">
            <Button onClick={saveBriefing} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 h-10 flex items-center">
              💾 Save Briefing
            </Button>
            <DailyBriefingPrintButton className="bg-gray-600 hover:bg-gray-700 px-4 py-2 h-10 flex items-center">
              🖨️ Generate PDF
            </DailyBriefingPrintButton>
          </div>
        </div>
      </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Today's Forecast */}
<Card className="rounded-2xl shadow-md">
  <CardHeader>
    <CardTitle>📊 Today's Forecast</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Lunch and Dinner side by side */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="lunch">🍽️ Lunch (AM)</Label>
        {renderInput(lunch, setLunch, "", autoPopulated && !!lunch)}
      </div>
      <div>
        <Label htmlFor="dinner">🌙 Dinner (PM)</Label>
        {renderInput(dinner, setDinner, "", autoPopulated && !!dinner)}
      </div>
    </div>

    {/* Forecasted Sales */}
    <div>
      <Label htmlFor="forecasted-sales">💰 Forecasted Sales ($)</Label>
      {renderInput(forecastedSales, setForecastedSales, "", autoPopulated && !!forecastedSales)}
    </div>

    {/* Weather Summary Block */}
    {weather && (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-900 mt-2">
        <div className="flex items-center gap-4">
          {weather.icon && (
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt="Weather icon"
              className="w-12 h-12"
            />
          )}
          <div>
            <div className="text-sm text-muted-foreground capitalize">
              {weather.conditions}
            </div>
            <div className="text-sm font-medium">
              High: {weather.temperature_high}°F &nbsp;&nbsp;|&nbsp;&nbsp; Low: {weather.temperature_low}°F
            </div>
          </div>
        </div>
      </div>
    )}
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
