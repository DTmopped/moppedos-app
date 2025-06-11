import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Printer } from 'lucide-react';

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

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Briefing Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            h1, h2 { margin-bottom: 1rem; }
            hr { margin: 1.5rem 0; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;">📋 Daily Briefing Sheet</h1>
          <p><strong>Date:</strong> ${printData.date}</p>
          <p><strong>Manager on Duty:</strong> ${printData.manager || '—'}</p>
          <hr />
          <h2>📊 Forecasted Volume</h2>
          <p><strong>🌞 Lunch (AM):</strong> ${printData.lunch || '—'} guests</p>
          <p><strong>🌙 Dinner (PM):</strong> ${printData.dinner || '—'} guests</p>
          <hr />
          <h2>💰 Forecast vs Actual</h2>
          <p><strong>Forecasted Sales:</strong> $${printData.forecast || '—'}</p>
          <p><strong>Actual Sales:</strong> $${printData.actual || '—'}</p>
          <p><strong>Variance:</strong> ${printData.variance}</p>
          <p><strong>Variance Notes:</strong> ${printData.varianceNotes || '—'}</p>
          <hr />
          <h2>🎉 Team Shout-Out</h2>
          <p>${printData.shoutouts || '—'}</p>
          <h2>📣 Team Call-Out</h2>
          <p>${printData.callouts || '—'}</p>
          <h2>📝 Notes to Team</h2>
          <p>${printData.notes || '—'}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gradient">Daily Briefing Sheet</h1>
        <Button onClick={handleGenerate} className="btn-gradient">
          <Printer className="mr-2 h-4 w-4" /> Generate Briefing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Today's Forecasted Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">🌞 Lunch (AM):</label>
              <Input type="number" value={amGuests} onChange={(e) => setAmGuests(e.target.value)} placeholder="e.g. 150" />
            </div>
            <div>
              <label className="text-sm font-medium">🌙 Dinner (PM):</label>
              <Input type="number" value={pmGuests} onChange={(e) => setPmGuests(e.target.value)} placeholder="e.g. 120" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 Yesterday's Forecast vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Forecasted Sales:</label>
              <Input type="number" value={forecasted} onChange={(e) => setForecasted(e.target.value)} placeholder="$" />
            </div>
            <div>
              <label className="text-sm font-medium">Actual Sales:</label>
              <Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="$" />
            </div>
            <div>
              <label className="text-sm font-medium">Variance Notes:</label>
              <Textarea value={varianceNotes} onChange={(e) => setVarianceNotes(e.target.value)} placeholder="e.g. team issues, slow start..." />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎉 Manager Shout-Out</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={shoutOut} onChange={(e) => setShoutOut(e.target.value)} placeholder="Recognize a team member or win..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📣 Team Call-Out</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={callOut} onChange={(e) => setCallOut(e.target.value)} placeholder="Important reminders or changes..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 Notes to Team</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={teamNote} onChange={(e) => setTeamNote(e.target.value)} placeholder="Goals, mindset, feedback..." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div>
          <label className="text-sm font-medium">📅 Date</label>
          <Input value={date} readOnly />
        </div>
        <div>
          <label className="text-sm font-medium">🧑‍🍳 MOD / Lead</label>
          <Input value={mod} onChange={(e) => setMod(e.target.value)} placeholder="Manager Name" />
        </div>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
