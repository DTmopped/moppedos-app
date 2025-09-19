import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DailyBriefingBuilder = () => {
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
  const [eventsHolidays, setEventsHolidays] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manager, setManager] = useState("");

  const generateBriefing = () => {
    const briefing = {
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
      eventsHolidays,
      date,
      manager,
    };
    console.log("Generated Briefing:", briefing);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
<div className="text-md text-gray-600 font-medium flex flex-wrap gap-x-4 gap-y-1 mb-6">
  <span className="flex items-center gap-1">☀️ <span>Align the team</span></span>
  <span className="flex items-center gap-1">📊 <span>Track progress</span></span>
  <span className="flex items-center gap-1">💬 <span>Share wins</span></span>
</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Manager Name" />
        </div>
        <div className="flex justify-end mt-2 md:mt-6">
          <Button onClick={generateBriefing}>✅ Generate Briefing</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">📊 Forecasted Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="🌞 Lunch (AM) — e.g. 150" />
            <Input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="🌙 Dinner (PM) — e.g. 120" />
            <Textarea
              value={forecastNotes}
              onChange={(e) => setForecastNotes(e.target.value)}
              placeholder="📝 Notes about today’s volume forecast..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">💵 Yesterday's Forecast vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={forecastedSales} onChange={(e) => setForecastedSales(e.target.value)} placeholder="Forecasted Sales ($)" />
            <Input value={actualSales} onChange={(e) => setActualSales(e.target.value)} placeholder="Actual Sales ($)" />
            <Textarea
              value={varianceNotes}
              onChange={(e) => setVarianceNotes(e.target.value)}
              placeholder="⚠️ Variance Notes (e.g. team issues, early start…)"
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🎉 Shout-Out</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={shoutout}
              onChange={(e) => setShoutout(e.target.value)}
              placeholder="Recognize a team member or win..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">📣 Team Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reminders}
              onChange={(e) => setReminders(e.target.value)}
              placeholder="Important notes or operational callouts..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🎯 Goals & Mindset</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={mindset}
              onChange={(e) => setMindset(e.target.value)}
              placeholder="Today's message to the team..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🥗 Food Items</CardTitle>
            <p className="text-sm text-muted-foreground">New or low-stock food items to track today.</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={foodItems}
              onChange={(e) => setFoodItems(e.target.value)}
              placeholder="✏️ List new menu items or items running low..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🍹 Beverage Items</CardTitle>
            <p className="text-sm text-muted-foreground">New additions or low stock to flag.</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={beverageItems}
              onChange={(e) => setBeverageItems(e.target.value)}
              placeholder="✏️ Call out any new drinks or 86s..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">📅 Events & Holidays</CardTitle>
            <p className="text-sm text-muted-foreground">Anything coming up the team should know about.</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={eventsHolidays}
              onChange={(e) => setEventsHolidays(e.target.value)}
              placeholder="✏️ Catering, local events, school breaks..."
              className="bg-white text-gray-800 border border-gray-300 shadow-inner"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
