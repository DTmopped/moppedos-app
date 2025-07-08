import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminModeToggle from "./AdminModeToggle";

const AdminPanel = () => {
  const [adminMode, setAdminMode] = useState(false);
  const [settings, setSettings] = useState({
    captureRate: 0.08,
    spendPerGuest: 40,
    amSplit: 0.6,
    foodCostGoal: 0.3,
    bevCostGoal: 0.2,
    laborCostGoal: 0.14,
  });

  useEffect(() => {
    const storedMode = localStorage.getItem("adminMode") === "true";
    const storedSettings = {
      captureRate: parseFloat(localStorage.getItem("captureRate")) || 0.08,
      spendPerGuest: parseFloat(localStorage.getItem("spendPerGuest")) || 40,
      amSplit: parseFloat(localStorage.getItem("amSplit")) || 0.6,
      foodCostGoal: parseFloat(localStorage.getItem("foodCostGoal")) || 0.3,
      bevCostGoal: parseFloat(localStorage.getItem("bevCostGoal")) || 0.2,
      laborCostGoal: parseFloat(localStorage.getItem("laborCostGoal")) || 0.14,
    };
    setAdminMode(storedMode);
    setSettings(storedSettings);
  }, []);

  const handleSettingChange = (key, value) => {
    const parsed = parseFloat(value);
    const updated = { ...settings, [key]: isNaN(parsed) ? 0 : parsed };
    setSettings(updated);
    localStorage.setItem(key, parsed.toString());
  };

  const toggleAdminMode = () => {
    const updated = !adminMode;
    setAdminMode(updated);
    localStorage.setItem("adminMode", updated.toString());
  };

  if (!adminMode) {
    return (
      <div className="mb-6">
        <AdminModeToggle />
      </div>
    );
  }

  return (
    <Card className="border border-slate-700 bg-slate-900 text-slate-100 mb-6">
      <CardHeader>
        <CardTitle>Admin Mode Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdminModeToggle />

        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key} className="capitalize">{key}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="bg-slate-800 border-slate-600 text-slate-100"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
