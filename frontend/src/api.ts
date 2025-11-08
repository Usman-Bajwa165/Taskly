// src/Api.ts
// src/Api.ts
import axios from "axios";

const raw = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:4000";
const baseURL = raw.endsWith("/api") ? raw : `${raw.replace(/\/$/, "")}/api`;

console.log("API baseURL:", baseURL); 

const api = axios.create({ baseURL, timeout: 7000 });

export const setAuthToken = (token: string | null) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

export const getErrorMessage = (err: any) => {
  if (!err) return "Unknown error";
  if (err.response?.data?.error) return err.response.data.error;
  if (typeof err === "string") return err;
  return err.message ?? String(err);
};

export default api;
