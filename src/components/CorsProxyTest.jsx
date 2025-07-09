
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx;
import { ScrollArea } from '@/components/ui/scroll-area.jsx;
import { Loader2, Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react'; // Added CheckCircle2 and XCircle
import { supabase } from 'supabaseClient.js'; // We'll use this to get credentials

const CorsProxyTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const handleTestClick = async () => {
    setLoading(true);
    setResult('Testing connection via CORS proxy...');
    setStatus(null);

    const targetSupabaseUrl = `${supabaseUrl}/rest/v1/schedules?select=*&limit=1`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetSupabaseUrl)}`;

    let fullLog = `Attempting to fetch: ${proxyUrl}\n`;
    fullLog += `Target Supabase URL: ${targetSupabaseUrl}\n`;
    fullLog += `Using API Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + '...' : 'N/A'}\n\n`;


    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });

      fullLog += `Fetch response status: ${response.status} ${response.statusText}\n`;
      fullLog += `Response headers:\n`;
      response.headers.forEach((value, key) => {
        fullLog += `  ${key}: ${value}\n`;
      });
      fullLog += `\n`;


      const responseText = await response.text();
      fullLog += `Raw response text: ${responseText}\n\n`;
      
      if (!response.ok) {
        setStatus('error');
        let errorMsg = `HTTP error! status: ${response.status}. `;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg += `Message: ${errorJson.message || 'No specific message.'} Details: ${errorJson.details || ''} Hint: ${errorJson.hint || ''}`;
        } catch (e) {
          errorMsg += `Could not parse error response as JSON. Raw response: ${responseText}`;
        }
        fullLog += `Error: ${errorMsg}\n`;
        setResult(fullLog);
        throw new Error(errorMsg);
      }
      
      const data = JSON.parse(responseText);
      fullLog += `Data received (parsed JSON):\n${JSON.stringify(data, null, 2)}\n`;
      setResult(fullLog);
      setStatus('success');

    } catch (error) {
      setStatus('error');
      fullLog += `Fetch Error: ${error.message}\n`;
      if (error.cause) {
        fullLog += `Cause: ${JSON.stringify(error.cause, null, 2)}\n`;
      }
      setResult(fullLog);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="bg-slate-800/70 border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-100 flex items-center">
            <Wifi size={28} className="mr-3 text-cyan-400"/>
            CORS Proxy Test
          </CardTitle>
          <p className="text-sm text-slate-400">
            Tests fetching Supabase data via <code className="text-xs bg-slate-700 p-1 rounded">https://corsproxy.io/</code>. This helps diagnose direct REST API access issues that might be CORS-related if not using the Supabase JS client.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleTestClick}
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wifi size={20} className="mr-2"/>
            )}
            Test Connection via CORS Proxy
          </Button>
          
          {result && (
            <div className={`mt-5 p-4 border rounded-lg ${
              status === 'success' ? 'border-green-500 bg-green-900/30' : 
              status === 'error' ? 'border-red-500 bg-red-900/30' : 
              'border-slate-600 bg-slate-900/50'
            }`}>
              <div className="flex items-center mb-2">
                {status === 'success' && <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />}
                {status === 'error' && <XCircle className="h-5 w-5 mr-2 text-red-400" />}
                <h3 className={`text-lg font-semibold ${
                  status === 'success' ? 'text-green-300' : 
                  status === 'error' ? 'text-red-300' : 
                  'text-slate-200'
                }`}>
                  Test Log:
                </h3>
              </div>
              <ScrollArea className="h-72 w-full rounded-md border border-slate-700 bg-slate-950 p-3">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">{result}</pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorsProxyTest;
