import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/AppLayout";
import ViewRenderer from "@/components/ViewRenderer";
import AppInitializer from "@/components/AppInitializer"; // initializes localStorage etc
import { views } from "@/config/views";

// 🔐 import your new Login page
import Login from "@/pages/Login";

const App = () => {
  return (
    <>
      <AppInitializer />

      <Routes>
        {/* Public login route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes (assumed protected — we can add auth logic later) */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/*" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<ViewRenderer viewsConfig={views} />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
