import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserAndLocation } from "@/hooks/useUserAndLocation";

const DailyBriefingBuilder = () => {
  const { locationId } = useUserAndLocation();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manager, setManager] = useState("");
  const [briefing, setBriefing] = useState({});
  const [loading, setLoading] = useState(false);

  const fields = [
    ["lunch", "😊 Lunch (AM)", "e.g. 150"],
    ["dinner", "🌙 Dinner (PM)", "e.g. 120"],
    ["forecasted_sales", "💰 Forecasted Sales ($)", ""],
    ["forecast_notes", "📝 Notes about today’s volume forecast...", "textarea"],
    ["actual_sales", "Actual Sales ($)", ""],
    ["variance_notes", "⚠️ What affected results? Team issues? Weather?", "textarea"],
    ["shoutout", "🎉 Shout-Out", "Recognize a team member or win...", "textarea"],
    ["reminders", "📣 Team Reminders", "Operational notes...", "textarea"],
    ["mindset", "🎯 Goals & Mindset", "Motivate the team...", "textarea"],
    ["food_items", "🥦 Food Items", "Menu changes or low stock...", "textarea"],
    ["beverage_items", "🥤 Beverage Items", "New drinks or 86s...", "textarea"],
    ["events", "📅 Events & Holidays", "School breaks, catering, etc.", "textarea"],
    ["repair_notes", "🛠️ Repairs & Issues", "Broken equipment, service delays...", "textarea"],
  ];

  const handleChange = (field, value) => {
    setBriefing((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchBriefing = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("location_id", locationId)
        .eq("date", date)
        .maybeSingle();

      const { data: actual } = await supabase.rpc("get_yesterday_actual_sales", {
        briefing_date: date,
        p_location_id: locationId,
      });

      if (data) setBriefing({ ...data });
      if (actual) setBriefing((prev) => ({ ...prev, actual_sales: actual }));
      setLoading(false);
    };
    if (locationId && date) fetchBriefing();
  }, [locationId, date]);

  const handleSave = async () => {
    if (!locationId) return;
    const payload = { ...briefing, date, location_id: locationId, manager };
    const { error } = await supabase.from("daily_briefings").upsert(payload, {
      onConflict: ["location_id", "date"],
    });
    if (!error) alert("✅ Briefing Saved");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>MOD / Lead</Label>
          <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Manager Name" />
        </div>
        <Button onClick={handleSave}>✅ Save Briefing</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>📊 Today’s Forecast</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fields.slice(0, 4).map(([field, label, placeholder]) =>
              placeholder === "textarea" ? (
                <Textarea
                  key={field}
                  placeholder={label}
                  value={briefing[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              ) : (
                <Input
                  key={field}
                  placeholder={label}
                  value={briefing[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📅 Yesterday’s Recap</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fields.slice(4, 6).map(([field, label, placeholder]) =>
              placeholder === "textarea" ? (
                <Textarea
                  key={field}
                  placeholder={label}
                  value={briefing[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              ) : (
                <Input
                  key={field}
                  placeholder={label}
                  value={briefing[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.slice(6, 9).map(([field, label, placeholder]) => (
          <Card key={field}>
            <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder={placeholder}
                value={briefing[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.slice(9).map(([field, label, placeholder]) => (
          <Card key={field}>
            <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder={placeholder}
                value={briefing[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
