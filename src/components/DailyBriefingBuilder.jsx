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
  const [events, setEvents] = useState("");
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
      events,
      date,
      manager,
    };
    console.log("✅ Briefing Generated:", briefing);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-base text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

      {/* Top Row: Date + MOD + Generate Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="shadow-sm border-muted rounded-md"
          />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="Manager Name"
            className="shadow-sm border-muted rounded-md"
          />
        </div>
        <div className="flex justify-start md:justify-end">
          <Button onClick={generateBriefing} className="w-full md:w-auto">
            ✅ Generate Briefing
          </Button>
        </div>
      </div>

      {/* Forecast vs Actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">📊 Forecasted Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              placeholder="😊 Lunch (AM) — e.g. 150"
              className="shadow-sm border-muted"
            />
            <Input
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              placeholder="🌙 Dinner (PM) — e.g. 120"
              className="shadow-sm border-muted"
            />
            <Textarea
              value={forecastNotes}
              onChange={(e) => setForecastNotes(e.target.value)}
              placeholder="📝 Notes about today’s volume forecast..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">📈 Yesterday's Forecast vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={forecastedSales}
              onChange={(e) => setForecastedSales(e.target.value)}
              placeholder="Forecasted Sales ($)"
              className="shadow-sm border-muted"
            />
            <Input
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="Actual Sales ($)"
              className="shadow-sm border-muted"
            />
            <Textarea
              value={varianceNotes}
              onChange={(e) => setVarianceNotes(e.target.value)}
              placeholder="⚠️ Variance Notes (e.g. team issues, early start…)"
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>
      </div>

      {/* Team Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🎉 Shout-Out</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={shoutout}
              onChange={(e) => setShoutout(e.target.value)}
              placeholder="Recognize a team member or win..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">📣 Team Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reminders}
              onChange={(e) => setReminders(e.target.value)}
              placeholder="Important notes or operational callouts..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🎯 Goals & Mindset</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={mindset}
              onChange={(e) => setMindset(e.target.value)}
              placeholder="Today's message to the team..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>
      </div>

      {/* Ops Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🥦 Food Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              New or low-stock food items to track today.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={foodItems}
              onChange={(e) => setFoodItems(e.target.value)}
              placeholder="✏️ List new menu items or items running low..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">🥤 Beverage Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              New additions or low stock to flag.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={beverageItems}
              onChange={(e) => setBeverageItems(e.target.value)}
              placeholder="✏️ Call out any new drinks or 86s..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">📅 Events & Holidays</CardTitle>
            <p className="text-sm text-muted-foreground">
              Anything coming up the team should know about.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={events}
              onChange={(e) => setEvents(e.target.value)}
              placeholder="✏️ Catering, local events, school breaks..."
              className="shadow-inner border-muted"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
