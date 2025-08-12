import React, { useState } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { Loader2, Wifi, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from '@/supabaseClient';

const SupabaseConnectionTest = () => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', null

  const handleTestClick = async () => {
    setLoading(true);
    setResult("Testing direct Supabase connection...");
    setStatus(null);

    let log = `Testing direct Supabase connection using Supabase JS client\n`;
    try {
      const { data, error, status: respStatus, statusText } = await supabase
        .from("schedules")
        .select("*")
        .limit(1);

      log += `Response Status: ${respStatus} ${statusText || ""}\n`;

      if (error) {
        log += `Error: ${error.message}\nDetails: ${error.details || "N/A"}\nHint: ${error.hint || "N/A"}\n`;
        setStatus("error");
      } else {
        log += `Data received:\n${JSON.stringify(data, null, 2)}\n`;
        setStatus("success");
      }
    } catch (err) {
      log += `Unexpected error: ${err.message}\n`;
      setStatus("error");
    } finally {
      setResult(log);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="bg-slate-800/70 border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-100 flex items-center">
            <Wifi size={28} className="mr-3 text-cyan-400" />
            Supabase Connection Test
          </CardTitle>
          <p className="text-sm text-slate-400">
            Tests fetching data directly from Supabase using your configured Supabase client. 
            No proxy is used.
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
              <Wifi size={20} className="mr-2" />
            )}
            Test Direct Supabase Connection
          </Button>

          {result && (
            <div
              className={`mt-5 p-4 border rounded-lg ${
                status === "success"
                  ? "border-green-500 bg-green-900/30"
                  : status === "error"
                  ? "border-red-500 bg-red-900/30"
                  : "border-slate-600 bg-slate-900/50"
              }`}
            >
              <div className="flex items-center mb-2">
                {status === "success" && (
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />
                )}
                {status === "error" && (
                  <XCircle className="h-5 w-5 mr-2 text-red-400" />
                )}
                <h3
                  className={`text-lg font-semibold ${
                    status === "success"
                      ? "text-green-300"
                      : status === "error"
                      ? "text-red-300"
                      : "text-slate-200"
                  }`}
                >
                  Test Log:
                </h3>
              </div>
              <ScrollArea className="h-72 w-full rounded-md border border-slate-700 bg-slate-950 p-3">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">
                  {result}
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConnectionTest;
