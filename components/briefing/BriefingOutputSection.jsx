import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card.jsx";

const BriefingOutputSection = ({ titleColor, briefingOutput }) => {
  return (
    <Card className="glassmorphic-card card-hover-glow">
      <CardHeader>
        <CardTitle className={`text-xl gradient-text ${titleColor}`}>📋 Daily Manager Briefing Output</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-background/70 dark:bg-background/50 rounded-lg text-sm text-foreground whitespace-pre-wrap overflow-x-auto min-h-[200px] border border-border/50 shadow-inner">
          {briefingOutput}
        </pre>
      </CardContent>
    </Card>
  );
};

export default BriefingOutputSection;
