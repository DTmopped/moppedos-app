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
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
      </Label>

      {type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background/70 dark:bg-background/60 placeholder:text-muted-foreground/80 focus:border-primary text-sm"
          style={{ minHeight: minHeight || "80px" }}
        />
      ) : type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            className="w-full bg-background/70 dark:bg-background/60 focus:border-primary text-sm"
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
          className="bg-background/70 dark:bg-background/60 placeholder:text-muted-foreground/80 focus:border-primary text-sm"
        />
      )}
    </div>
  );
};

export default BriefingFormField;
