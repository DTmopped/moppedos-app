import React from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AppNavigation from "@/components/AppNavigation";
import { views } from "@/config/views"; // Adjust path if needed

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <AppHeader views={views} />
      <div className="flex flex-1 overflow-hidden">
        <AppNavigation views={views} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AppFooter />
    </div>
  );
};

export default AppLayout;
