import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "components/ui/card.jsx";
import { Calculator } from "lucide-react";

const ForecastHeader = () => {
  return (
    <Card className="shadow-xl border border-slate-700 bg-slate-800/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 shadow-lg">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
              Weekly Forecast Parser
            </CardTitle>
            <CardDescription className="text-slate-400">
              Paste weekly passenger data (include <code className="text-white font-mono">Date: YYYY-MM-DD</code> for Monday) to generate and save forecast.
              Uses <strong className="text-pink-300">8%</strong> capture rate and <strong className="text-pink-300">$15</strong> spend/guest.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* ForecastInputArea is rendered by parent */}
      </CardContent>
    </Card>
  );
};

export default ForecastHeader;
