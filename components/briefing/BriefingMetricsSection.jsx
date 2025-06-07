import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card.jsx";
import { DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react";

const MetricDisplay = ({ label, value, icon, iconColor = "text-primary" }) => {
  const IconComponent = icon;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
      <div className="flex items-center">
        {IconComponent && <IconComponent size={18} className={`mr-2 ${iconColor}`} />}
        <span className="text-sm text-muted-foreground">{label}:</span>
      </div>
      <strong className="text-sm font-semibold text-foreground">{value}</strong>
    </div>
  );
};

const BriefingMetricsSection = ({ title, icon: TitleIcon, metrics, children }) => {
  const titleColor = "from-blue-500 to-cyan-500";
  return (
    <Card className="bg-card/80 dark:bg-card/70 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <h2 className={`text-xl font-semibold gradient-text ${titleColor} flex items-center`}>
          {TitleIcon && <TitleIcon size={24} className="mr-2" />}
          {title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {metrics && metrics.map(metric => <MetricDisplay key={metric.label} {...metric} />)}
        {children}
      </CardContent>
    </Card>
  );
};

export default BriefingMetricsSection;
