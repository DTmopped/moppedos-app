
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';

const SimpleSupabaseTest = () => {
  const [result, setResult] = useState('');

  const handleTestClick = () => {
    setResult('Button clicked! If you see this, JavaScript is working.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-200">
            Simple Supabase Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleTestClick}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          >
            Test Connection
          </Button>
          
          {result && (
            <div className="mt-5 p-4 border border-slate-600 rounded-lg bg-slate-900/50">
              <p className="text-slate-200">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleSupabaseTest;
