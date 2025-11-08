// src/app.ts
import dotenv from "dotenv";
dotenv.config(); // <-- load env first

import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";

const app = express();

// Use FRONTEND_URL env to control CORS in production
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
  // allow non-browser clients (curl/postman) when origin is undefined
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // server-to-server or curl
    if (FRONTEND_URL === "*" || origin === FRONTEND_URL) return callback(null, true);
    return callback(new Error("CORS not allowed by FRONTEND_URL"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// mount API routes
app.use("/api", routes);

export default app;
