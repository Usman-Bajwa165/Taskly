// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { setAuthToken } from "./api";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";

export default function App() {
  // keep a minimal auth state to force re-render on login/logout
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem("token"));

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setAuthToken(t);
  }, []);

  return (
    <BrowserRouter>
      <Nav authed={authed} setAuthed={setAuthed} />
      <Routes>
        <Route path="/" element={authed ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/register" element={React.createElement(Register as any, { setAuthed })} />
        <Route path="/login" element={React.createElement(Login as any, { setAuthed })} />
        <Route path="/dashboard" element={authed ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
