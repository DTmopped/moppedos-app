import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";

const DailyBriefingBuilder = () => {
  const { userId, locationId } = useUserAndLocation();

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

  const [quote, setQuote] = useState(null);

  useEffect(() => {
    const fetchBriefing = async () => {
      const { data } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("location_id", locationId)
        .eq("date", date)
        .single();

      if (data) {
        setLunch(data.lunch || "");
        setDinner(data.dinner || "");
        setForecastedSales(data.forecasted_sales || "");
        setForecastNotes(data.forecast_notes || "");
        setActualSales(data.actual_sales || "");
        setVarianceNotes(data.variance_notes || "");
        setShoutout(data.shoutout || "");
        setReminders(data.reminders || "");
        setMindset(data.mindset || "");
        setFoodItems(data.food_items || "");
        setBeverageItems(data.beverage_items || "");
        setEvents(data.events || "");
        setRepairNotes(data.repair_notes || "");
        setManager(data.manager || "");
      }
    };

    const fetchQuote = async () => {
      try {
        const res = await fetch("https://zenquotes.io/api/random");
        const json = await res.json();
        if (Array.isArray(json)) {
          setQuote(`${json[0].q} — ${json[0].a}`);
        }
      } catch (error) {
        console.error("Failed to fetch quote", error);
      }
    };

    fetchBriefing();
    fetchQuote();
  }, [date, locationId]);

  const saveBriefing = async () => {
    await supabase.from("daily_briefings").upsert({
      location_id: locationId,
      date,
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
      manager,
      created_by: userId,
    });
    alert("✅ Briefing Saved");
  };

  const renderInputBlock = (label, value, setValue, placeholder, isText = false) => (
    <div className="relative">
      {isText ? (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-100 text-black rounded-md shadow-inner w-full min-h-[80px]"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-100 text-black rounded-md shadow-inner w-full"
        />
      )}
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-1">Daily Briefing Sheet</h1>
      <p className="text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

      {/* Date + MOD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Manager Name" />
        </div>
        <div className="flex justify-start md:justify-end">
          <Button onClick={saveBriefing} className="w-full md:w-auto">✅ Save Briefing</Button>
        </div>
      </div>

      {/* Forecast + Recap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">📊 Today’s Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInputBlock("Lunch", lunch, setLunch, "😊 Lunch (AM) — e.g. 150")}
            {renderInputBlock("Dinner", dinner, setDinner, "🌙 Dinner (PM) — e.g. 120")}
            {renderInputBlock("Forecasted Sales", forecastedSales, setForecastedSales, "💰 Forecasted Sales ($)")}
            {renderInputBlock("Notes", forecastNotes, setForecastNotes, "📝 Notes about today’s volume forecast...", true)}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">📅 Yesterday’s Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInputBlock("Actual Sales", actualSales, setActualSales, "Actual Sales ($)")}
            {renderInputBlock("Variance", varianceNotes, setVarianceNotes, "⚠️ What affected results? Team issues? Weather?", true)}

            {/* Inspirational Quote */}
            {quote && (
              <div className="mt-6 p-4 text-center italic text-muted-foreground text-sm rounded-xl shadow-sm bg-white border border-gray-200">
                “{quote}”
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shoutout / Reminders / Mindset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {renderInputBlock("Shoutout", shoutout, setShoutout, "🎉 Recognize a team member or win...", true)}
        {renderInputBlock("Reminders", reminders, setReminders, "📣 Important notes or operational callouts...", true)}
        {renderInputBlock("Mindset", mindset, setMindset, "🎯 Today’s message to the team...", true)}
      </div>

      {/* Food / Bev / Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {renderInputBlock("Food Items", foodItems, setFoodItems, "🥦 New menu items or items running low...", true)}
        {renderInputBlock("Beverage Items", beverageItems, setBeverageItems, "🥤 Call out new drinks or 86s...", true)}
        {renderInputBlock("Events", events, setEvents, "📅 Catering, local events, school breaks...", true)}
      </div>

      {/* Repairs */}
      <div className="mb-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">🛠️ Repair & Maintenance</CardTitle>
            <p className="text-sm text-muted-foreground">Track any equipment or facility issues.</p>
          </CardHeader>
          <CardContent>
            {renderInputBlock("Repair Notes", repairNotes, setRepairNotes, "🔧 Note any pending repairs or maintenance needs...", true)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;

