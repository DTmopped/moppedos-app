import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Loader2, Wifi, Server, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const CustomProxyTest = () => {
  const [proxyUrlInput, setProxyUrlInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', 'warning', null
  const [showInstructions, setShowInstructions] = useState(true);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleTestClick = async () => {
    if (!proxyUrlInput.trim()) {
      setResult('Please enter your PHP proxy URL.');
      setStatus('warning');
      return;
    }

    setLoading(true);
    setResult('Testing connection via custom PHP proxy...');
    setStatus(null);
    setShowInstructions(false);

    // The PHP script expects the Supabase endpoint as a query parameter `?endpoint=`
    // Example endpoint: `rest/v1/schedules?select=*&limit=1`
    const supabaseEndpoint = 'rest/v1/schedules?select=*&limit=1';
    const fullProxyRequestUrl = `${proxyUrlInput.trim()}?endpoint=${encodeURIComponent(supabaseEndpoint)}`;

    let fullLog = `Attempting to fetch via custom proxy: ${fullProxyRequestUrl}\n`;
    fullLog += `Supabase Target Endpoint: ${supabaseEndpoint}\n`;
    fullLog += `Using API Key (sent by PHP proxy): ${supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + '...' : 'N/A'}\n\n`;

    try {
      // The PHP proxy script handles adding Supabase headers (apikey, Authorization)
      // So we don't need to add them in the client-side fetch call here.
      const response = await fetch(fullProxyRequestUrl, {
        method: 'GET', // Your PHP script handles methods based on $_SERVER['REQUEST_METHOD']
      });

      fullLog += `Fetch response status: ${response.status} ${response.statusText}\n`;
      fullLog += `Response headers (from PHP proxy):\n`;
      response.headers.forEach((value, key) => {
        fullLog += `  ${key}: ${value}\n`;
      });
      fullLog += `\n`;

      const responseText = await response.text();
      fullLog += `Raw response text: ${responseText}\n\n`;
      
      if (!response.ok) {
        setStatus('error');
        let errorMsg = `HTTP error from proxy! status: ${response.status}. `;
        try {
          // Attempt to parse as JSON, as Supabase errors are usually JSON
          const errorJson = JSON.parse(responseText);
          errorMsg += `Message: ${errorJson.message || 'No specific message.'} Details: ${errorJson.details || ''} Hint: ${errorJson.hint || ''}`;
        } catch (e) {
          // If not JSON, it might be an error from the PHP script itself or a non-JSON Supabase error
          errorMsg += `Could not parse error response as JSON. Raw response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`;
        }
        fullLog += `Error: ${errorMsg}\n`;
        setResult(fullLog);
        // No need to throw error here, just set the result
      } else {
        // Attempt to parse successful response as JSON
        try {
          const data = JSON.parse(responseText);
          fullLog += `Data received (parsed JSON):\n${JSON.stringify(data, null, 2)}\n`;
          setStatus('success');
        } catch (e) {
          // If successful response is not JSON, it might be an issue or unexpected format
          fullLog += `Successfully fetched, but response was not valid JSON.\nRaw response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}\n`;
          setStatus('warning');
        }
        setResult(fullLog);
      }

    } catch (error) {
      setStatus('error');
      fullLog += `Fetch Error (Network issue or invalid proxy URL?): ${error.message}\n`;
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
            <Server size={28} className="mr-3 text-purple-400"/>
            Custom PHP Proxy Test
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Test your deployed PHP Supabase proxy script. Enter the URL of your <code className="text-xs bg-slate-700 p-1 rounded">supabase-proxy.php</code> script.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="proxyUrl" className="text-slate-300">Your PHP Proxy Script URL</Label>
            <Input
              id="proxyUrl"
              type="url"
              placeholder="e.g., https://yourdomain.com/supabase-proxy.php"
              value={proxyUrlInput}
              onChange={(e) => setProxyUrlInput(e.target.value)}
              className="bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <Button
            onClick={handleTestClick}
            disabled={loading || !proxyUrlInput.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wifi size={20} className="mr-2"/>
            )}
            Test Custom PHP Proxy
          </Button>
          
          {showInstructions && !result && (
            <div className="mt-5 p-4 border border-sky-500 bg-sky-900/30 rounded-lg text-slate-300 text-sm">
              <h4 className="font-semibold text-sky-300 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Deploy the PHP script you provided to a server (e.g., your Hostinger plan).</li>
                <li>Enter the publicly accessible URL of that PHP script in the input field above.</li>
                <li>Click the "Test Custom PHP Proxy" button.</li>
                <li>The test will attempt to fetch data from your <code className="text-xs bg-slate-700 p-0.5 rounded">schedules</code> table via your PHP proxy.</li>
              </ol>
            </div>
          )}

          {result && (
            <div className={`mt-5 p-4 border rounded-lg ${
              status === 'success' ? 'border-green-500 bg-green-900/30' : 
              status === 'error' ? 'border-red-500 bg-red-900/30' : 
              status === 'warning' ? 'border-yellow-500 bg-yellow-900/30' :
              'border-slate-600 bg-slate-900/50'
            }`}>
              <div className="flex items-center mb-2">
                {status === 'success' && <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />}
                {status === 'error' && <XCircle className="h-5 w-5 mr-2 text-red-400" />}
                {status === 'warning' && <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />}
                <h3 className={`text-lg font-semibold ${
                  status === 'success' ? 'text-green-300' : 
                  status === 'error' ? 'text-red-300' : 
                  status === 'warning' ? 'text-yellow-300' :
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

export default CustomProxyTest;
