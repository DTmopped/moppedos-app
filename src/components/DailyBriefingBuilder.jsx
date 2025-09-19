import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DailyBriefingBuilder = () => {
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
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
    // Optionally: POST to backend or trigger PDF/download
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        ☀️ Align the team. 📈 Track progress. 💬 Share wins.
      </p>

      {/* Forecasted Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              📊 Forecasted Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              placeholder="🌞 Lunch (AM) — e.g. 150"
            />
            <Input
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              placeholder="🌙 Dinner (PM) — e.g. 120"
            />
          </CardContent>
        </Card>

        {/* Forecast vs Actual */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              💵 Yesterday's Forecast vs Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={forecastedSales}
              onChange={(e) => setForecastedSales(e.target.value)}
              placeholder="Forecasted Sales ($)"
            />
            <Input
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="Actual Sales ($)"
            />
            <Textarea
              value={varianceNotes}
              onChange={(e) => setVarianceNotes(e.target.value)}
              placeholder="✏️ Variance Notes (e.g. team issues, early start…)"
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
            />
          </CardContent>
        </Card>
      </div>

      {/* Shoutout, Reminders, Mindset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-800">
              🎉 Shout-Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={shoutout}
              onChange={(e) => setShoutout(e.target.value)}
              placeholder="Recognize a team member or win..."
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
            />
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-800">
              📣 Team Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reminders}
              onChange={(e) => setReminders(e.target.value)}
              placeholder="Important notes or operational callouts..."
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
            />
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-800">
              🎯 Goals & Mindset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={mindset}
              onChange={(e) => setMindset(e.target.value)}
              placeholder="Today's message to the team..."
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
            />
          </CardContent>
        </Card>
      </div>

      {/* New Sections: Food, Beverage, Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2 text-gray-800">
              🥗 Food Items
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              New or low-stock food items to track today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={foodItems}
              onChange={(e) => setFoodItems(e.target.value)}
              placeholder="📝 List new menu items or items running low..."
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2 text-gray-800">
              🍺 Beverage Items
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              New additions or low stock to flag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={beverageItems}
              onChange={(e) => setBeverageItems(e.target.value)}
              placeholder="📝 Call out any new drinks or 86s..."
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2 text-gray-800">
              📆 Events & Holidays
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Anything coming up the team should know about.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={eventsHolidays}
              onChange={(e) => setEventsHolidays(e.target.value)}
              placeholder="📝 Catering, local events, school breaks..."
              className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-sm text-gray-800"
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer: Date + MOD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-gray-800"
          />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="Manager Name"
            className="bg-gray-100 border border-gray-200 rounded-md shadow-inner text-gray-800"
          />
        </div>
      </div>

      <Button onClick={generateBriefing} className="w-full md:w-auto">
        ✅ Generate Briefing
      </Button>
    </div>
  );
};

export default DailyBriefingBuilder;
