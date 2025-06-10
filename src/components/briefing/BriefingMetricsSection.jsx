import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const MetricDisplay = ({ label, value, icon, iconColor = "text-primary" }) => {
  const IconComponent = icon;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
      <div className="flex items-center">
        {IconComponent && (
          <IconComponent size={18} className={`mr-2 ${iconColor}`} />
        )}
        <span className="text-sm text-muted-foreground">{label}:</span>
      </div>
      <strong className="text-sm font-semibold text-foreground">
        {value}
      </strong>
    </div>
  );
};

const BriefingMetricsSection = ({
  title,
  icon: TitleIcon,
  metrics,
  children,
}) => {
  return (
    <Card className="bg-card/80 dark:bg-card/70 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center">
          {TitleIcon && <TitleIcon size={24} className="mr-2 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {metrics?.map((metric) => (
          <MetricDisplay key={metric.label} {...metric} />
        ))}
        {children}
      </CardContent>
    </Card>
  );
};

export default BriefingMetricsSection;
