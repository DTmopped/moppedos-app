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
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);

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

    fetchBriefing();
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

  const handleImageChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

  const renderTextarea = (value, setter, placeholder) => (
    <Textarea
      value={value}
      onChange={(e) => setter(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-100 text-black rounded-md shadow-inner w-full min-h-[80px]"
    />
  );

  const renderInput = (value, setter, placeholder) => (
    <Input
      value={value}
      onChange={(e) => setter(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-100 text-black rounded-md shadow-inner w-full"
    />
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-1">Daily Briefing Sheet</h1>
      <p className="text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          {renderInput(manager, setManager, "Manager Name")}
        </div>
        <div className="flex justify-start md:justify-end">
          <Button onClick={saveBriefing} className="w-full md:w-auto">✅ Save Briefing</Button>
        </div>
      </div>

      {/* Forecast & Recap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">📊 Today’s Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInput(lunch, setLunch, "😊 Lunch (AM) — e.g. 150")}
            {renderInput(dinner, setDinner, "🌙 Dinner (PM) — e.g. 120")}
            {renderInput(forecastedSales, setForecastedSales, "💰 Forecasted Sales ($)")}
            {renderTextarea(forecastNotes, setForecastNotes, "📝 Notes about today’s volume forecast...")}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">📅 Yesterday’s Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInput(actualSales, setActualSales, "Actual Sales ($)")}
            {renderTextarea(varianceNotes, setVarianceNotes, "⚠️ What affected results? Team issues? Weather?")}
          </CardContent>
        </Card>
      </div>

      {/* Team Updates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>🎉 Shout-Out</CardTitle>
          </CardHeader>
          <CardContent>{renderTextarea(shoutout, setShoutout, "✏️ Recognize a team member or win...")}</CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📣 Team Reminders</CardTitle>
          </CardHeader>
          <CardContent>{renderTextarea(reminders, setReminders, "✏️ Important notes or operational callouts...")}</CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>🎯 Goals & Mindset</CardTitle>
          </CardHeader>
          <CardContent>{renderTextarea(mindset, setMindset, "✏️ Today's message to the team...")}</CardContent>
        </Card>
      </div>

      {/* Ops Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>🥦 Food Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {renderTextarea(foodItems, setFoodItems, "✏️ New menu items or items running low...")}
            <Label className="text-sm">📷 Upload Food Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setFoodImage)} />
            {foodImage && <img src={foodImage} alt="Food preview" className="mt-2 rounded-md h-24 object-cover" />}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>🥤 Beverage Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {renderTextarea(beverageItems, setBeverageItems, "✏️ Call out new drinks or 86s...")}
            <Label className="text-sm">📷 Upload Beverage Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBeverageImage)} />
            {beverageImage && <img src={beverageImage} alt="Beverage preview" className="mt-2 rounded-md h-24 object-cover" />}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>📅 Events & Holidays</CardTitle>
          </CardHeader>
          <CardContent>{renderTextarea(events, setEvents, "✏️ Catering, local events, school breaks...")}</CardContent>
        </Card>
      </div>

      {/* Repair Notes */}
      <Card className="rounded-2xl shadow-md mb-6">
        <CardHeader>
          <CardTitle>🛠️ Repair & Maintenance</CardTitle>
          <p className="text-sm text-muted-foreground">Track any equipment or facility issues.</p>
        </CardHeader>
        <CardContent>
          {renderTextarea(repairNotes, setRepairNotes, "✏️ Note any pending repairs or maintenance needs...")}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyBriefingBuilder;

