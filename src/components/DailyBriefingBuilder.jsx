// Hybrid Responsive Daily Briefing Layout (Accordion only on Mobile)
// FILE: DailyBriefingBuilder.jsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manager, setManager] = useState("");
  const [foodImage, setFoodImage] = useState(null);
  const [beverageImage, setBeverageImage] = useState(null);

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
      date,
      manager,
      foodImage,
      beverageImage,
    };
    console.log("✅ Briefing Generated:", briefing);
  };

  const SectionWrapper = ({ children }) => (
    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">{children}</div>
  );

  const MobileAccordion = ({ title, children }) => (
    <div className="md:hidden mb-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>{title}</AccordionTrigger>
          <AccordionContent>{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-lg text-muted-foreground mb-6">
        🌟 <strong>Align the team.</strong> 📈 <strong>Track progress.</strong> 💬 <strong>Share wins.</strong>
      </p>

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
          <Button onClick={generateBriefing} className="w-full md:w-auto">
            ✅ Generate Briefing
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <SectionWrapper>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>📊 Today’s Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="😊 Lunch (AM)" />
            <Input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="🌙 Dinner (PM)" />
            <Input value={forecastedSales} onChange={(e) => setForecastedSales(e.target.value)} placeholder="💰 Forecasted Sales ($)" />
            <Textarea value={forecastNotes} onChange={(e) => setForecastNotes(e.target.value)} placeholder="📝 Notes about today’s volume forecast..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📅 Yesterday’s Recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={actualSales} onChange={(e) => setActualSales(e.target.value)} placeholder="Actual Sales ($)" />
            <Textarea value={varianceNotes} onChange={(e) => setVarianceNotes(e.target.value)} placeholder="⚠️ What affected results?" />
          </CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper>
        <Card>
          <CardHeader><CardTitle>🎉 Shout-Out</CardTitle></CardHeader>
          <CardContent><Textarea value={shoutout} onChange={(e) => setShoutout(e.target.value)} placeholder="Recognize a team member or win..." /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>📣 Team Reminders</CardTitle></CardHeader>
          <CardContent><Textarea value={reminders} onChange={(e) => setReminders(e.target.value)} placeholder="Important notes..." /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>🎯 Goals & Mindset</CardTitle></CardHeader>
          <CardContent><Textarea value={mindset} onChange={(e) => setMindset(e.target.value)} placeholder="Today's message to the team..." /></CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper>
        <Card>
          <CardHeader><CardTitle>🥦 Food Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Textarea value={foodItems} onChange={(e) => setFoodItems(e.target.value)} placeholder="✏️ New menu items..." />
            <Label>📷 Upload Food Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setFoodImage)} />
            {foodImage && <img src={foodImage} alt="Food preview" className="h-24 rounded-md" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>🥤 Beverage Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Textarea value={beverageItems} onChange={(e) => setBeverageItems(e.target.value)} placeholder="✏️ New drinks or 86s..." />
            <Label>📷 Upload Beverage Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBeverageImage)} />
            {beverageImage && <img src={beverageImage} alt="Beverage preview" className="h-24 rounded-md" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>📅 Events & Holidays</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={events} onChange={(e) => setEvents(e.target.value)} placeholder="✏️ Catering, events, breaks..." />
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Mobile Accordion Versions */}
      <MobileAccordion title="📊 Forecast & Recap">
        {/* Insert same content as Forecast + Recap Cards */}
      </MobileAccordion>
      <MobileAccordion title="👥 Team Updates">
        {/* Insert same content as Team Update Cards */}
      </MobileAccordion>
      <MobileAccordion title="🍽️ Ops Items">
        {/* Insert same content as Ops Cards */}
      </MobileAccordion>
    </div>
  );
};

export default DailyBriefingBuilder;
