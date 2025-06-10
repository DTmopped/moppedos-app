import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const BriefingOutputSection = ({ titleColor = "text-primary", briefingOutput }) => {
  return (
    <Card className="bg-card/80 dark:bg-card/70 border border-border/50 shadow-md">
      <CardHeader>
        <CardTitle className={`text-xl flex items-center gap-2 ${titleColor}`}>
          📋 Daily Manager Briefing Output
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="p-4 rounded-lg text-sm text-foreground whitespace-pre-wrap overflow-x-auto min-h-[200px] bg-background/70 dark:bg-background/50 border border-border/50 shadow-inner">
          {briefingOutput}
        </pre>
      </CardContent>
    </Card>
  );
};

export default BriefingOutputSection;
