import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Calendar, User } from 'lucide-react';

const DailyBriefingBuilder = () => {
  const [modName, setModName] = useState('');
  const [notes, setNotes] = useState('');
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
          📋 Daily Briefing – Pre-Shift Overview
        </h1>
        <Button variant="gradient" className="flex items-center">
          ✨ Generate Briefing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700">
              👥 Today’s Forecasted Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">☀️ Lunch (AM):</span>
              <span className="font-semibold">232 <span className="text-xs text-slate-500">guests</span></span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">🌙 Dinner (PM):</span>
              <span className="font-semibold">155 <span className="text-xs text-slate-500">guests</span></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700">
              💰 Yesterday’s Forecast vs Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Forecasted:</span>
              <span className="text-slate-500">&#8212;</span>
            </div>
            <div className="flex justify-between">
              <span>Actual:</span>
              <span className="text-slate-500">&#8212;</span>
            </div>
            <div className="flex justify-between">
              <span>Variance:</span>
              <span className="text-red-500 font-semibold">N/A%</span>
            </div>
            <div className="pt-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Notes on variance:</label>
              <Textarea
                placeholder="e.g. Weather, delay, team issues..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium flex items-center mb-1 text-slate-600">
            <Calendar size={16} className="mr-2" /> Date
          </label>
          <Input value={today} readOnly className="bg-slate-100" />
        </div>
        <div>
          <label className="text-sm font-medium flex items-center mb-1 text-slate-600">
            <User size={16} className="mr-2" /> MOD / Lead
          </label>
          <Input
            placeholder="Manager Name"
            value={modName}
            onChange={(e) => setModName(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyBriefingBuilder;
