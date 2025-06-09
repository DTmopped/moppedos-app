import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/AppLayout"; // Ensure path is correct

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
};

export default App;
