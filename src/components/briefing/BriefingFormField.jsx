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
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>

      {type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 placeholder-gray-400 text-sm resize-none"
          style={{ minHeight: minHeight || "100px" }}
        />
      ) : type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            className="w-full p-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm"
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
          className="w-full p-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 placeholder-gray-400 text-sm"
        />
      )}
    </div>
  );
};

export default BriefingFormField;
