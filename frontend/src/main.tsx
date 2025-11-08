import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthToken } from "./api";

const token = localStorage.getItem("token");
if (token) setAuthToken(token);

const el = document.getElementById("root");
if (!el) throw new Error("Root element not found");
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
