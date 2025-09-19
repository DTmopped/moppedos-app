import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import { triggerPrint } from '@/components/prep/PrintUtils';
import PrintableBriefingSheet from './PrintableBriefingSheet';
import { supabase } from '@/supabaseClient';

const DailyBriefingBuilder = () => {
  const [amGuests, setAmGuests] = useState('');
  const [pmGuests, setPmGuests] = useState('');
  const [forecasted, setForecasted] = useState('');
  const [actual, setActual] = useState('');
  const [varianceNotes, setVarianceNotes] = useState('');
  const [shoutOut, setShoutOut] = useState('');
  const [callOut, setCallOut] = useState('');
  const [teamNote, setTeamNote] = useState('');
  const [mod, setMod] = useState('');
  const [date] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }));

  useEffect(() => {
    const fetchForecast = async () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('forecasts')
        .select('date, lunch_guests, dinner_guests, forecasted_sales')
        .eq('date', todayKey)
        .single();

      if (!error && data) {
        setAmGuests(data.lunch_guests?.toString() || '');
        setPmGuests(data.dinner_guests?.toString() || '');
        setForecasted(data.forecasted_sales?.toString() || '');
      }
    };
    fetchForecast();
  }, []);

  const calculateVariance = (f, a) => {
    const forecast = parseFloat(f);
    const actualVal = parseFloat(a);
    if (isNaN(forecast) || isNaN(actualVal) || forecast === 0) return 'N/A';
    return `${(((actualVal - forecast) / forecast) * 100).toFixed(1)}%`;
  };

  const handleGenerate = () => {
    const printData = {
      lunch: amGuests,
      dinner: pmGuests,
      forecast: forecasted,
      actual,
      variance: calculateVariance(forecasted, actual),
      varianceNotes,
      manager: mod,
      notes: teamNote,
      shoutouts: shoutOut,
      callouts: callOut,
      date,
    };

    triggerPrint(
      (props) => <PrintableBriefingSheet {...props} />, 
      printData, 
      'Daily Briefing Sheet'
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Daily Briefing Sheet</h1>
        <Button onClick={handleGenerate} className="btn-gradient">
          <Printer className="mr-2 h-4 w-4" /> Generate Briefing
        </Button>
      </div>

      {/* Section 1: Forecast and Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/80 border border-border/50 shadow-sm">
          <CardHeader><CardTitle>📊 Forecasted Volume</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={amGuests} onChange={(e) => setAmGuests(e.target.value)} placeholder="🌞 Lunch (AM)" type="number" />
            <Input value={pmGuests} onChange={(e) => setPmGuests(e.target.value)} placeholder="🌙 Dinner (PM)" type="number" />
          </CardContent>
        </Card>

        <Card className="bg-card/80 border border-border/50 shadow-sm">
          <CardHeader><CardTitle>💰 Yesterday’s Forecast vs Actual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={forecasted} onChange={(e) => setForecasted(e.target.value)} placeholder="Forecasted Sales ($)" type="number" />
            <Input value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Actual Sales ($)" type="number" />
            <Textarea value={varianceNotes} onChange={(e) => setVarianceNotes(e.target.value)} placeholder="Variance Notes (e.g. team issues, early start...)" />
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Team Messaging */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/80 border border-border/50 shadow-sm">
          <CardHeader><CardTitle>🎉 Shout-Out</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={shoutOut} onChange={(e) => setShoutOut(e.target.value)} placeholder="Recognize a team member or win..." />
          </CardContent>
        </Card>

        <Card className="bg-card/80 border border-border/50 shadow-sm">
          <CardHeader><CardTitle>📣 Team Reminders</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={callOut} onChange={(e) => setCallOut(e.target.value)} placeholder="Important notes or operational callouts..." />
          </CardContent>
        </Card>

        <Card className="bg-card/80 border border-border/50 shadow-sm">
          <CardHeader><CardTitle>📝 Goals & Mindset</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={teamNote} onChange={(e) => setTeamNote(e.target.value)} placeholder="Today's message to the team..." />
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Input value={date} readOnly placeholder="Date" />
        <Input value={mod} onChange={(e) => setMod(e.target.value)} placeholder="🧑 MOD / Lead" />
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
