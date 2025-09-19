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
    <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle
          className={`text-lg flex items-center gap-2 ${iconColor || "text-blue-600"}`}
        >
          <IconComponent size={20} />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm text-gray-500">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {fields.map((field) =>
          field.type === "textarea" ? (
            <Textarea
              key={field.id}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 placeholder-gray-400 text-sm resize-none"
              style={{ minHeight: field.minHeight || "100px" }}
            />
          ) : (
            <Input
              key={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={
                field.isStatic ? undefined : (e) => field.onChange(e.target.value)
              }
              readOnly={field.readOnly}
              className={`w-full p-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 placeholder-gray-400 text-sm ${
                field.isStatic ? "text-gray-400" : ""
              }`}
            />
          )
        )}
      </CardContent>
    </Card>
  );
};

export default BriefingInputSection;
