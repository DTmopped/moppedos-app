import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

const DailyBriefingBuilder = () => {
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
  const [foodImage, setFoodImage] = useState(null);
  const [bevImage, setBevImage] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manager, setManager] = useState("");

  const handleImageChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const generateBriefing = () => {
    const briefing = {
      lunch,
      dinner,
      forecastedSales,
      forecastNotes,
      actualSales,
      varianceNotes,
      shoutout,
      reminders,
      mindset,
      foodItems,
      beverageItems,
      events,
      foodImage,
      bevImage,
      date,
      manager,
    };
    console.log("✅ Briefing Generated:", briefing);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-lg text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

      {/* Top Row: Date + MOD + Generate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            placeholder="Manager Name"
          />
        </div>
        <div className="flex justify-start md:justify-end">
          <Button onClick={generateBriefing} className="w-full md:w-auto">
            ✅ Generate Briefing
          </Button>
        </div>
      </div>

      {/* Forecast + Recap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Today’s Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="😊 Lunch (AM) — e.g. 150" />
            <Input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="🌙 Dinner (PM) — e.g. 120" />
            <Input value={forecastedSales} onChange={(e) => setForecastedSales(e.target.value)} placeholder="💰 Forecasted Sales ($)" />
            <Textarea
              value={forecastNotes}
              onChange={(e) => setForecastNotes(e.target.value)}
              placeholder="📝 Notes about today’s volume forecast..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📅 Yesterday’s Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={actualSales} onChange={(e) => setActualSales(e.target.value)} placeholder="Actual Sales ($)" />
            <Textarea
              value={varianceNotes}
              onChange={(e) => setVarianceNotes(e.target.value)}
              placeholder="⚠️ What affected results? Team issues? Weather?"
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Team Update Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[{ label: "🎉 Shout-Out", value: shoutout, setter: setShoutout, ph: "Recognize a team member or win..." },
          { label: "📣 Team Reminders", value: reminders, setter: setReminders, ph: "Important notes or operational callouts..." },
          { label: "🎯 Goals & Mindset", value: mindset, setter: setMindset, ph: "Today's message to the team..." },
        ].map((item, i) => (
          <Card key={i}>
            <CardHeader><CardTitle>{item.label}</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={item.value}
                onChange={(e) => item.setter(e.target.value)}
                placeholder={item.ph}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ops Section + Image Upload */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Food Items */}
        <Card>
          <CardHeader>
            <CardTitle>🥦 Food Items</CardTitle>
            <p className="text-sm text-muted-foreground">New or low-stock food items to track today.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={foodItems}
              onChange={(e) => setFoodItems(e.target.value)}
              placeholder="✏️ List new menu items or items running low..."
              className="min-h-[80px]"
            />
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setFoodImage)} />
            {foodImage && <img src={foodImage} alt="Food Upload" className="rounded-lg w-full" />}
          </CardContent>
        </Card>

        {/* Beverage Items */}
        <Card>
          <CardHeader>
            <CardTitle>🥤 Beverage Items</CardTitle>
            <p className="text-sm text-muted-foreground">New additions or low stock to flag.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={beverageItems}
              onChange={(e) => setBeverageItems(e.target.value)}
              placeholder="✏️ Call out any new drinks or 86s..."
              className="min-h-[80px]"
            />
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBevImage)} />
            {bevImage && <img src={bevImage} alt="Beverage Upload" className="rounded-lg w-full" />}
          </CardContent>
        </Card>

        {/* Events & Holidays */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Events & Holidays</CardTitle>
            <p className="text-sm text-muted-foreground">Anything coming up the team should know about.</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={events}
              onChange={(e) => setEvents(e.target.value)}
              placeholder="✏️ Catering, local events, school breaks..."
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
