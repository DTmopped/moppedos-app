import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

const BriefingFormField = ({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  options = [],
  minHeight,
}) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90 flex items-center gap-1">
        ✏️ {label}
      </Label>

      {type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent shadow-sm border border-border/40 rounded-md placeholder:text-muted-foreground text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          style={{ minHeight: minHeight || "80px" }}
        />
      ) : type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            className="w-full bg-transparent shadow-sm border border-border/40 rounded-md text-sm focus:ring-1 focus:ring-primary"
          >
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent shadow-sm border border-border/40 rounded-md placeholder:text-muted-foreground text-sm focus:ring-1 focus:ring-primary focus:outline-none"
        />
      )}
    </div>
  );
};

export default BriefingFormField;
