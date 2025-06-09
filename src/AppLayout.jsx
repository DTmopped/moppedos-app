import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/AppLayout";
import ViewRenderer from "@/components/ViewRenderer"; // <- adjust path if needed
import { views } from "@/config/views"; // <- wherever you define the `views`

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      
      <Route path="/*" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<ViewRenderer viewsConfig={views} />} />
      </Route>
    </Routes>
  );
};

export default App;
