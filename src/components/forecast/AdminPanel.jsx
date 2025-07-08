import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";

const AdminPanel = () => {
  const { isAdminMode, adminSettings, updateAdminSetting } = useData();

  if (!isAdminMode) return null;

  const percentKeys = [
    "captureRate",
    "amSplit",
    "foodCostGoal",
    "bevCostGoal",
    "laborCostGoal"
  ];

  const dollarKeys = ["spendPerGuest"];

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace("Per Guest", "per Guest");

  return (
    <Card className="border border-slate-700 bg-slate-900 text-slate-100 mb-6">
      <CardHeader>
        <CardTitle>Admin Mode Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(adminSettings).map(([key, rawValue]) => {
          const isPercent = percentKeys.includes(key);
          const isDollar = dollarKeys.includes(key);
          const displayValue = isPercent ? Math.round(rawValue * 100) : Math.round(rawValue);

          const handleChange = (e) => {
            const input = e.target.value;
            const parsed = parseFloat(input);
            if (isNaN(parsed)) return;
            const value = isPercent ? parsed / 100 : parsed;
            updateAdminSetting(key, value);
          };

          return (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{formatLabel(key)}</Label>
              <Input
                id={key}
                type="number"
                value={displayValue}
                step={1}
                min={0}
                max={isPercent ? 100 : undefined}
                onChange={handleChange}
                className="bg-slate-800 border-slate-600 text-slate-100"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
