// src/app.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";

const app = express();

// parse FRONTEND_URL env (support comma-separated list)
const rawFrontends = (process.env.FRONTEND_URL || "").trim();
const allowedOrigins = rawFrontends
  ? rawFrontends.split(",").map(s => s.trim()).filter(Boolean)
  : [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // allow non-browser requests (curl/postman) where origin is undefined
    if (!origin) return callback(null, true);

    // allow wildcard if provided
    if (allowedOrigins.includes("*")) return callback(null, true);

    // allow exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // otherwise reject
    return callback(new Error("CORS not allowed by FRONTEND_URL"));
  },
  credentials: true,
  // let cors package set allowed headers and methods
};

// ensure preflight receives CORS headers
app.options("*", cors(corsOptions));

app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// health endpoints
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// mount routes under /api
app.use("/api", routes);

export default app;
