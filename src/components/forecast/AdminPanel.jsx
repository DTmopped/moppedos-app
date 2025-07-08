import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";

const AdminPanel = () => {
  const { isAdminMode, adminSettings, updateAdminSetting } = useData();

  if (!isAdminMode) return null;

  const getStep = (key) =>
    ["captureRate", "amSplit"].includes(key) ? 0.01 : 0.1;

  const getMin = (key) =>
    ["captureRate", "amSplit", "foodCostGoal", "bevCostGoal", "laborCostGoal"].includes(key)
      ? 0
      : undefined;

  const getMax = (key) =>
    ["captureRate", "amSplit"].includes(key) ? 1 : undefined;

  return (
    <Card className="border border-slate-700 bg-slate-900 text-slate-100 mb-6">
      <CardHeader>
        <CardTitle>Admin Mode Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(adminSettings).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key} className="capitalize">
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
            </Label>
            <Input
              id={key}
              type="number"
              value={value}
              step={getStep(key)}
              min={getMin(key)}
              max={getMax(key)}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value || "0");
                updateAdminSetting(key, isNaN(parsed) ? 0 : parsed);
              }}
              className="bg-slate-800 border-slate-600 text-slate-100"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
