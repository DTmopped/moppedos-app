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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Briefing Sheet</h1>
          <p className="text-lg text-muted-foreground">
            🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
          </p>
        </div>
        <Button onClick={generateBriefing} className="h-10">✅ Generate Briefing</Button>
      </div>

      {/* Top Row: Date + MOD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner"
          />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="Manager Name"
            className="rounded-md border border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner"
          />
        </div>
      </div>

      {/* Forecast & Recap Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">📊 Today’s Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              placeholder="😊 Lunch (AM) — e.g. 150"
              className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner"
            />
            <Input
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              placeholder="🌙 Dinner (PM) — e.g. 120"
              className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner"
            />
            <Input
              value={forecastedSales}
              onChange={(e) => setForecastedSales(e.target.value)}
              placeholder="💰 Forecasted Sales ($)"
              className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner"
            />
            <Textarea
              value={forecastNotes}
              onChange={(e) => setForecastNotes(e.target.value)}
              placeholder="📝 Notes about today’s volume forecast..."
              className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">📅 Yesterday’s Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="Actual Sales ($)"
              className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner"
            />
            <Textarea
              value={varianceNotes}
              onChange={(e) => setVarianceNotes(e.target.value)}
              placeholder="⚠️ What affected results? Team issues? Weather?"
              className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Team Updates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "🎉 Shout-Out", state: shoutout, setter: setShoutout, placeholder: "Recognize a team member or win..." },
          { label: "📣 Team Reminders", state: reminders, setter: setReminders, placeholder: "Important notes or operational callouts..." },
          { label: "🎯 Goals & Mindset", state: mindset, setter: setMindset, placeholder: "Today's message to the team..." },
        ].map((item, idx) => (
          <Card key={idx} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={item.state}
                onChange={(e) => item.setter(e.target.value)}
                placeholder={item.placeholder}
                className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[80px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ops Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "🥦 Food Items",
            desc: "New or low-stock food items to track today.",
            state: foodItems,
            setter: setFoodItems,
            placeholder: "✏️ List new menu items or items running low...",
          },
          {
            label: "🥤 Beverage Items",
            desc: "New additions or low stock to flag.",
            state: beverageItems,
            setter: setBeverageItems,
            placeholder: "✏️ Call out any new drinks or 86s...",
          },
          {
            label: "📅 Events & Holidays",
            desc: "Anything coming up the team should know about.",
            state: events,
            setter: setEvents,
            placeholder: "✏️ Catering, local events, school breaks...",
          },
        ].map((item, idx) => (
          <Card key={idx} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{item.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={item.state}
                onChange={(e) => item.setter(e.target.value)}
                placeholder={item.placeholder}
                className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[80px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
