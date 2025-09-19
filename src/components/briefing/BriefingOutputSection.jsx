import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const BriefingOutputSection = ({ titleColor = "text-blue-600", briefingOutput }) => {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className={`text-xl flex items-center gap-2 ${titleColor}`}>
          📋 Daily Manager Briefing Output
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="p-4 rounded-md text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto min-h-[200px] bg-gray-100 border border-gray-200 shadow-inner">
          {briefingOutput}
        </pre>
      </CardContent>
    </Card>
  );
};

export default BriefingOutputSection;
