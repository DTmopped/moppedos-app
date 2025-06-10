
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Loader2, CheckCircle2, XCircle, Database } from 'lucide-react';
import { supabase } from 'supabaseClient.js';
import { cn } from '@/lib/utils.js';

const ConnectionTest = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [testResults, setTestResults] = useState(null);

  const testConnection = async () => {
    setStatus('loading');
    setTestResults({
      message: 'Testing connection to Supabase...',
      details: null,
      data: null
    });

    try {
      // Try to get data from the schedules table
      const { data, error } = await supabase
        .from('schedules')
        .select('*, shifts(*)')
        .limit(5);
      
      if (error) {
        setStatus('error');
        setTestResults({
          message: error.message,
          details: error.details || 'No additional details',
          hint: error.hint || 'No hint provided',
          data: null
        });
      } else {
        setStatus('success');
        setTestResults({
          message: 'Connection successful!',
          details: `Found ${data.length} records in the schedules table.`,
          data: data
        });
      }
    } catch (error) {
      setStatus('error');
      setTestResults({
        message: `Connection failed: ${error.message}`,
        details: 'This could be due to network issues or invalid credentials.',
        data: null
      });
    }
  };

  return (
    <Card className="bg-slate-800/70 border-slate-700 shadow-lg">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-400" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <Button
          onClick={testConnection}
          disabled={status === 'loading'}
          className={cn(
            "w-full bg-gradient-to-r",
            status === 'loading' ? "from-slate-600 to-slate-700" :
            status === 'success' ? "from-green-600 to-emerald-600" :
            status === 'error' ? "from-red-600 to-rose-600" :
            "from-purple-600 to-indigo-600",
            "hover:from-purple-500 hover:to-indigo-500"
          )}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              {status === 'success' ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : status === 'error' ? (
                <XCircle className="mr-2 h-4 w-4" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </>
          )}
        </Button>

        {testResults && (
          <div className="space-y-4">
            <Alert
              variant={status === 'success' ? 'success' : status === 'error' ? 'destructive' : 'default'}
              className={cn(
                "border",
                status === 'success' ? "border-green-500/30 bg-green-500/10" :
                status === 'error' ? "border-red-500/30 bg-red-500/10" :
                "border-slate-600 bg-slate-700/50"
              )}
            >
              <AlertTitle className={cn(
                status === 'success' ? "text-green-400" :
                status === 'error' ? "text-red-400" :
                "text-slate-300"
              )}>
                {status === 'success' ? 'Connection Successful' :
                 status === 'error' ? 'Connection Failed' :
                 'Testing Connection'}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className={cn(
                  status === 'success' ? "text-green-300" :
                  status === 'error' ? "text-red-300" :
                  "text-slate-400"
                )}>
                  {testResults.message}
                </p>
                {testResults.details && (
                  <p className="text-slate-400 text-sm">
                    {testResults.details}
                  </p>
                )}
                {testResults.hint && (
                  <p className="text-slate-400 text-sm italic">
                    Hint: {testResults.hint}
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {testResults.data && (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Retrieved Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full rounded-md border border-slate-700 bg-slate-900/30">
                    <pre className="p-4 text-xs text-slate-300">
                      {JSON.stringify(testResults.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionTest;
