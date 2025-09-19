import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DailyBriefingBuilder = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manager, setManager] = useState("");
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [forecastNotes, setForecastNotes] = useState("");
  const [forecastedSales, setForecastedSales] = useState("");
  const [actualSales, setActualSales] = useState("");
  const [varianceNotes, setVarianceNotes] = useState("");
  const [shoutout, setShoutout] = useState("");
  const [reminders, setReminders] = useState("");
  const [mindset, setMindset] = useState("");
  const [foodItems, setFoodItems] = useState("");
  const [beverageItems, setBeverageItems] = useState("");
  const [events, setEvents] = useState("");

  const generateBriefing = () => {
    const briefing = {
      date,
      manager,
      lunch,
      dinner,
      forecastNotes,
      forecastedSales,
      actualSales,
      varianceNotes,
      shoutout,
      reminders,
      mindset,
      foodItems,
      beverageItems,
      events,
    };
    console.log("Generated Briefing:", briefing);
    // Add export/print logic here if needed
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        ☀️ Align the team. 📈 Track progress. 💬 Share wins.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-sm">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">MOD / Lead</Label>
          <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Manager Name" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">📊 Forecasted Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="🌞 Lunch (AM) — e.g. 150" />
            <Input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="🌙 Dinner (PM) — e.g. 120" />
            <Textarea value={forecastNotes} onChange={(e) => setForecastNotes(e.target.value)} placeholder="📝 Notes about today’s volume forecast..." />
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">💵 Yesterday's Forecast vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={forecastedSales} onChange={(e) => setForecastedSales(e.target.value)} placeholder="Forecasted Sales ($)" />
            <Input value={actualSales} onChange={(e) => setActualSales(e.target.value)} placeholder="Actual Sales ($)" />
            <Textarea value={varianceNotes} onChange={(e) => setVarianceNotes(e.target.value)} placeholder="✏️ Variance Notes (e.g. team issues, early start…)" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🎉 Shout-Out</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={shoutout} onChange={(e) => setShoutout(e.target.value)} placeholder="Recognize a team member or win..." />
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">📣 Team Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={reminders} onChange={(e) => setReminders(e.target.value)} placeholder="Important notes or operational callouts..." />
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🎯 Goals & Mindset</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={mindset} onChange={(e) => setMindset(e.target.value)} placeholder="Today's message to the team..." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🥗 Food Items</CardTitle>
            <p className="text-sm text-muted-foreground">New or low-stock food items to track today.</p>
          </CardHeader>
          <CardContent>
            <Textarea value={foodItems} onChange={(e) => setFoodItems(e.target.value)} placeholder="📝 List new menu items or items running low..." />
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🍹 Beverage Items</CardTitle>
            <p className="text-sm text-muted-foreground">New additions or low stock to flag.</p>
          </CardHeader>
          <CardContent>
            <Textarea value={beverageItems} onChange={(e) => setBeverageItems(e.target.value)} placeholder="📝 Call out any new drinks or 86s..." />
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">📅 Events & Holidays</CardTitle>
            <p className="text-sm text-muted-foreground">Anything coming up the team should know about.</p>
          </CardHeader>
          <CardContent>
            <Textarea value={events} onChange={(e) => setEvents(e.target.value)} placeholder="📝 Catering, local events, school breaks..." />
          </CardContent>
        </Card>
      </div>

      <Button onClick={generateBriefing} className="w-full md:w-auto">
        ✅ Generate Briefing
      </Button>
    </div>
  );
};

export default DailyBriefingBuilder;
