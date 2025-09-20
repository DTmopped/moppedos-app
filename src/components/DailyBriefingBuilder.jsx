import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";

const DailyBriefingBuilder = () => {
  const { locationId } = useUserAndLocation();
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
  const [foodImageUrl, setFoodImageUrl] = useState("");
  const [beverageItems, setBeverageItems] = useState("");
  const [beverageImageUrl, setBeverageImageUrl] = useState("");
  const [events, setEvents] = useState("");
  const [repairNotes, setRepairNotes] = useState("");

  // Fetch yesterday actuals on mount
  useEffect(() => {
    const fetchActuals = async () => {
      if (!locationId || !date) return;
      const { data, error } = await supabase.rpc("get_yesterday_actual_sales", {
        briefing_date: date,
        p_location_id: locationId,
      });
      if (data) setActualSales(data.toString());
    };
    fetchActuals();
  }, [locationId, date]);

  const saveBriefing = async () => {
    const { error } = await supabase.from("daily_briefings").upsert({
      location_id: locationId,
      date,
      manager,
      lunch: parseInt(lunch),
      dinner: parseInt(dinner),
      forecasted_sales: forecastedSales ? parseFloat(forecastedSales) : null,
      forecast_notes: forecastNotes,
      actual_sales: actualSales ? parseFloat(actualSales) : null,
      variance_notes: varianceNotes,
      shoutout,
      reminders,
      mindset,
      food_items: foodItems,
      food_image_url: foodImageUrl,
      beverage_items: beverageItems,
      beverage_image_url: beverageImageUrl,
      events,
      repair_notes: repairNotes,
    });
    if (!error) alert("✅ Briefing saved!");
    else alert("❌ Error saving: " + error.message);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-lg text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

      {/* Date & Manager */}
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
          <Button onClick={saveBriefing} className="w-full md:w-auto">
            ✅ Save Briefing
          </Button>
        </div>
      </div>

      {/* Forecast & Recap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>📊 Today’s Forecast</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="😊 Lunch (AM) — e.g. 150" />
            <Input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="🌙 Dinner (PM) — e.g. 120" />
            <Input value={forecastedSales} onChange={(e) => setForecastedSales(e.target.value)} placeholder="💰 Forecasted Sales ($)" />
            <Textarea value={forecastNotes} onChange={(e) => setForecastNotes(e.target.value)} placeholder="📝 Notes about today’s volume forecast..." />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>📅 Yesterday’s Recap</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={actualSales} onChange={(e) => setActualSales(e.target.value)} placeholder="Actual Sales ($)" />
            <Textarea value={varianceNotes} onChange={(e) => setVarianceNotes(e.target.value)} placeholder="⚠️ What affected results? Team issues? Weather?" />
          </CardContent>
        </Card>
      </div>

      {/* Shoutouts / Mindset / Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[{ label: "🎉 Shout-Out", value: shoutout, setter: setShoutout },
          { label: "📣 Team Reminders", value: reminders, setter: setReminders },
          { label: "🎯 Goals & Mindset", value: mindset, setter: setMindset },
        ].map((item, idx) => (
          <Card key={idx} className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle>{item.label}</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={item.value} onChange={(e) => item.setter(e.target.value)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Food / Bev / Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>🥦 Food Items</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={foodItems} onChange={(e) => setFoodItems(e.target.value)} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>🥤 Beverage Items</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={beverageItems} onChange={(e) => setBeverageItems(e.target.value)} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle>📅 Events</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={events} onChange={(e) => setEvents(e.target.value)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;

