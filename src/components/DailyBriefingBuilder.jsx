import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      date,
      manager,
    };
    console.log("Generated Briefing:", briefing);
    // You can POST briefing to your backend or trigger download/print
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Daily Briefing Sheet</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        ☀️ Align the team. 📈 Track progress. 💬 Share wins.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🎉 Shout-Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={shoutout}
              onChange={(e) => setShoutout(e.target.value)}
              placeholder="Recognize a team member or win..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              📣 Team Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reminders}
              onChange={(e) => setReminders(e.target.value)}
              placeholder="Important notes or operational callouts..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🎯 Goals & Mindset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={mindset}
              onChange={(e) => setMindset(e.target.value)}
              placeholder="Today's message to the team..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Manager Name" />
        </div>
      </div>

      <Button onClick={generateBriefing} className="w-full md:w-auto">
        ✅ Generate Briefing
      </Button>
    </div>
  );
};

export default DailyBriefingBuilder;
