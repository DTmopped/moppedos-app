import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Calendar,
  ClipboardList as ClipboardIcon,
  AlertTriangle,
  PartyPopper,
  Award,
  Info,
  Pencil,
} from "lucide-react";

const iconMap = {
  User,
  Calendar,
  ClipboardList: ClipboardIcon,
  AlertTriangle,
  PartyPopper,
  Award,
};

const BriefingInputSection = ({
  id,
  title,
  icon,
  description,
  fields,
  iconColor,
}) => {
  const IconComponent = iconMap[icon] || Info;

  return (
    <Card className="bg-white dark:bg-background border border-border/30 shadow-sm">
      <CardHeader>
        <CardTitle
          className={`text-lg text-foreground flex items-center gap-2 ${iconColor || "text-primary"}`}
        >
          <IconComponent size={20} className="mr-1" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) =>
          field.type === "textarea" ? (
            <div key={field.id} className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                ✏️ {field.label}
              </label>
              <Textarea
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="bg-transparent shadow-sm border border-border/40 rounded-md placeholder:text-muted-foreground text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                style={{ minHeight: field.minHeight || "80px" }}
              />
            </div>
          ) : (
            <div key={field.id} className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                ✏️ {field.label}
              </label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={
                  field.isStatic ? undefined : (e) => field.onChange(e.target.value)
                }
                readOnly={field.readOnly}
                className={`bg-transparent shadow-sm border border-border/40 rounded-md placeholder:text-muted-foreground text-sm focus:ring-1 focus:ring-primary focus:outline-none ${
                  field.isStatic ? "text-muted-foreground" : ""
                }`}
              />
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default BriefingInputSection;
