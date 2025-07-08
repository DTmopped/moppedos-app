import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";

const formatLabel = (key) => {
  switch (key) {
    case "captureRate":
      return "Capture Rate (%)";
    case "spendPerGuest":
      return "Spend per Guest ($)";
    case "amSplit":
      return "AM Split (%)";
    case "foodCostGoal":
      return "Food Cost Goal (%)";
    case "bevCostGoal":
      return "Bev Cost Goal (%)";
    case "laborCostGoal":
      return "Labor Cost Goal (%)";
    default:
      return key;
  }
};

const AdminPanel = () => {
  const { isAdminMode, adminSettings, updateAdminSetting } = useData();

  return (
    <Card className="border border-slate-700 bg-slate-900 text-slate-100 mb-6">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(adminSettings).map(([key, value]) => {
          const isAlwaysVisible = ["captureRate", "spendPerGuest", "amSplit"].includes(key);
          const showInput = isAdminMode || isAlwaysVisible;

          return (
            <div key={key} className="space-y-1">
              <Label htmlFor={key} className="capitalize">
                {formatLabel(key)}
              </Label>
              {showInput ? (
                <Input
                  id={key}
                  type="number"
                  value={value}
                  step="any"
                  onChange={(e) => updateAdminSetting(key, parseFloat(e.target.value))}
                  className={`bg-slate-800 border-slate-600 text-slate-100 ${
                    isAdminMode ? "" : "opacity-50 pointer-events-none"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
