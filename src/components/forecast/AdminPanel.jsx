import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";

const AdminPanel = () => {
  const { isAdminMode, adminSettings, updateAdminSetting } = useData();

  if (!isAdminMode) return null;

  return (
    <Card className="border border-slate-700 bg-slate-900 text-slate-100 mb-6">
      <CardHeader>
        <CardTitle>Admin Mode Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(adminSettings).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key} className="capitalize">{key}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => updateAdminSetting(key, parseFloat(e.target.value))}
              className="bg-slate-800 border-slate-600 text-slate-100"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
