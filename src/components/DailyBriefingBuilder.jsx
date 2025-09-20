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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);

  const handleImageChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

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
      foodImage,
      beverageImage,
    };
    console.log("✅ Briefing Generated:", briefing);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-lg text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
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
        <div className="flex justify-start md:justify-end">
          <Button onClick={generateBriefing} className="w-full md:w-auto">
            ✅ Generate Briefing
          </Button>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="forecast-recap">
          <AccordionTrigger className="text-lg font-semibold">📊 Forecast & Recap</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">📊 Today’s Forecast</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="😊 Lunch (AM) — e.g. 150" className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner" />
                  <Input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="🌙 Dinner (PM) — e.g. 120" className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner" />
                  <Input value={forecastedSales} onChange={(e) => setForecastedSales(e.target.value)} placeholder="💰 Forecasted Sales ($)" className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner" />
                  <Textarea value={forecastNotes} onChange={(e) => setForecastNotes(e.target.value)} placeholder="📝 Notes about today’s volume forecast..." className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[100px]" />
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">📅 Yesterday’s Recap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={actualSales} onChange={(e) => setActualSales(e.target.value)} placeholder="Actual Sales ($)" className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner" />
                  <Textarea value={varianceNotes} onChange={(e) => setVarianceNotes(e.target.value)} placeholder="⚠️ What affected results? Team issues? Weather?" className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[100px]" />
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="team-updates">
          <AccordionTrigger className="text-lg font-semibold">👥 Team Updates</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[{ label: "🎉 Shout-Out", state: shoutout, setter: setShoutout, placeholder: "Recognize a team member or win..." }, { label: "📣 Team Reminders", state: reminders, setter: setReminders, placeholder: "Important notes or operational callouts..." }, { label: "🎯 Goals & Mindset", state: mindset, setter: setMindset, placeholder: "Today's message to the team..." }].map((item, idx) => (
                <Card key={idx} className="shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={item.state} onChange={(e) => item.setter(e.target.value)} placeholder={item.placeholder} className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[80px]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ops-items">
          <AccordionTrigger className="text-lg font-semibold">🍽️ Ops Items</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">🥦 Food Items</CardTitle>
                  <p className="text-sm text-muted-foreground">New or low-stock food items to track today.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea value={foodItems} onChange={(e) => setFoodItems(e.target.value)} placeholder="✏️ List new menu items or items running low..." className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[80px]" />
                  <Label className="text-sm">📷 Upload Food Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setFoodImage)} />
                  {foodImage && <img src={foodImage} alt="Food preview" className="mt-2 rounded-md h-24 object-cover" />}
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">🥤 Beverage Items</CardTitle>
                  <p className="text-sm text-muted-foreground">New additions or low stock to flag.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea value={beverageItems} onChange={(e) => setBeverageItems(e.target.value)} placeholder="✏️ Call out any new drinks or 86s..." className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[80px]" />
                  <Label className="text-sm">📷 Upload Beverage Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBeverageImage)} />
                  {beverageImage && <img src={beverageImage} alt="Beverage preview" className="mt-2 rounded-md h-24 object-cover" />}
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">📅 Events & Holidays</CardTitle>
                  <p className="text-sm text-muted-foreground">Anything coming up the team should know about.</p>
                </CardHeader>
                <CardContent>
                  <Textarea value={events} onChange={(e) => setEvents(e.target.value)} placeholder="✏️ Catering, local events, school breaks..." className="rounded-md border-gray-300 bg-white text-black placeholder:text-gray-400 shadow-inner min-h-[80px]" />
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default DailyBriefingBuilder;
