// src/AppLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AppNavigation from "@/components/AppNavigation";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
