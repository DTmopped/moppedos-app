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
    <Card className="bg-white border border-border/30 shadow-sm rounded-lg">
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
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Pencil size={14} className="text-muted-foreground" />
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <Textarea
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="bg-white text-sm placeholder:text-muted-foreground border border-border/40 shadow-sm rounded-md focus:ring-1 focus:ring-primary focus:outline-none"
                style={{ minHeight: field.minHeight || "80px" }}
              />
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={
                  field.isStatic ? undefined : (e) => field.onChange(e.target.value)
                }
                readOnly={field.readOnly}
                className="bg-white text-sm placeholder:text-muted-foreground border border-border/40 shadow-sm rounded-md focus:ring-1 focus:ring-primary focus:outline-none"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BriefingInputSection;
