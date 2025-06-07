import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card.jsx";
import { Input } from "components/ui/input.jsx";
import { Textarea } from "components/ui/textarea.jsx";
import { User, Calendar, ClipboardList as ClipboardIcon, AlertTriangle, PartyPopper, Award, Info } from "lucide-react";

const iconMap = {
  User,
  Calendar,
  ClipboardList: ClipboardIcon,
  AlertTriangle,
  PartyPopper,
  Award
};

const BriefingInputSection = ({ id, title, icon, description, fields, iconColor }) => {
  const IconComponent = iconMap[icon] || Info;

  return (
    <Card className="bg-card/80 dark:bg-card/70 border-border/50">
      <CardHeader>
        <CardTitle className={`text-lg text-foreground flex items-center ${iconColor || 'text-primary'}`}>
          <IconComponent size={20} className="mr-2" />
          {title}
        </CardTitle>
        {description && <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(field => (
          field.type === "textarea" ? (
            <Textarea
              key={field.id}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className={`text-sm font-mono bg-background/70 dark:bg-background/50 focus:border-primary transition-all duration-300 placeholder-muted-foreground`}
              style={{ minHeight: field.minHeight || 'auto' }}
            />
          ) : (
            <Input
              key={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.isStatic ? undefined : (e) => field.onChange(e.target.value)}
              readOnly={field.readOnly}
              className={`bg-background/70 dark:bg-background/50 ${field.isStatic ? 'text-muted-foreground' : ''}`}
            />
          )
        ))}
      </CardContent>
    </Card>
  );
};

export default BriefingInputSection;
