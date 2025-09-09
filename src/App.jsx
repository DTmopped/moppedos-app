import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "@/AppLayout";
import ViewRenderer from "@/components/ViewRenderer";
import AppInitializer from "@/components/AppInitializer";
import { views } from "@/config/views";
import Login from "@/pages/Login";
import { supabase } from "@/supabaseClient"; // ✅ correct path

const App = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // 🔄 Show loading while checking session
  if (loading) return <div style={{ padding: "2rem" }}>Loading Mopped OS...</div>;

  // 🔐 Redirect to login if not authenticated
  if (!session && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // ✅ If authenticated or on /login, render app routes
  return (
    <>
      <AppInitializer />

      <Routes>
        <Route path="/login" element={<Login />} />

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
