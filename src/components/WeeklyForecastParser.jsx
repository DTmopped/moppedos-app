import React, { useState } from 'react';
import { parseWeeklyForecastEmail } from '@/lib/emailParser';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';

const WeeklyForecastParser = () => {
  const { setForecastData } = useData();
  const [emailText, setEmailText] = useState('');
  const [parsingStatus, setParsingStatus] = useState(null);
  const [parsedResults, setParsedResults] = useState([]);

  const handleParse = () => {
    const result = parseWeeklyForecastEmail(emailText);
    if (result && result.length) {
      setForecastData(result);
      setParsedResults(result);
      setParsingStatus('success');
    } else {
      setParsingStatus('error');
      setParsedResults([]);
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

        {parsingStatus === 'success' && (
          <div className="mt-4">
            <p className="text-green-600 font-medium">Forecast parsed successfully ✅</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {parsedResults.map((item, index) => (
                <li key={index}>
                  {item.day} {item.date} — {item.guests.toLocaleString()} guests
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsingStatus === 'error' && (
          <p className="text-red-600 mt-4">❌ Failed to parse forecast. Check formatting.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyForecastParser;
