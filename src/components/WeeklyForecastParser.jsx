import React, { useState } from 'react';
import { parseWeeklyForecastEmail } from '@/lib/emailParser';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const WeeklyForecastParser = () => {
  const { setForecastData } = useData();
  const [emailText, setEmailText] = useState('');
  const [parsingStatus, setParsingStatus] = useState(null);

  const handleParse = () => {
    const result = parseWeeklyForecastEmail(emailText);
    if (result && result.length) {
      setForecastData(result);
      setParsingStatus('success');
    } else {
      setParsingStatus('error');
    }
  };

  return (
    <Card className="glassmorphic-card">
      <CardHeader>
        <CardTitle>📩 Weekly Forecast Email Parser</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          rows={8}
          className="w-full p-2 border rounded-md font-mono text-sm"
          placeholder="Paste the weekly airport traffic email here..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <Button onClick={handleParse}>Parse Forecast</Button>
        {parsingStatus === 'success' && <p className="text-green-600">Forecast parsed successfully ✅</p>}
        {parsingStatus === 'error' && <p className="text-red-600">Failed to parse forecast ❌</p>}
      </CardContent>
    </Card>
  );
};

export default WeeklyForecastParser;
