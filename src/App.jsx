import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/AppLayout";
import ViewRenderer from "@/components/ViewRenderer";
import AppInitializer from "@/components/AppInitializer"; // ✅ new import
import { views } from "@/config/views";

const App = () => {
  return (
    <>
      <AppInitializer /> {/* ✅ initializes localStorage on first load */}

      <Routes>
        {/* Redirect root to default view */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* App layout wraps nested routes */}
        <Route path="/*" element={<AppLayout />}>
          {/* Nested route that renders views dynamically */}
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<ViewRenderer viewsConfig={views} />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
