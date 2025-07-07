import React, { useState } from 'react';
import { parseWeeklyForecastEmail } from '@/lib/emailParser';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
          <>
            <p className="text-green-600">Forecast parsed successfully ✅</p>
            <div className="mt-4 space-y-2">
              {parsedResults.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-100 border border-gray-300 rounded p-2 text-sm font-mono"
                >
                  <strong>{item.day}</strong> ({item.date}) —{' '}
                  <span className="text-blue-700">{item.guests.toLocaleString()}</span> guests
                </div>
              ))}
            </div>
          </>
        )}

        {parsingStatus === 'error' && (
          <p className="text-red-600">Failed to parse forecast ❌</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyForecastParser;
