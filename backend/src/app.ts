// src/app.ts
import dotenv from "dotenv";
dotenv.config(); // <-- load env first

import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";

const app = express();

// Read FRONTEND_URL from env. Support a comma-separated list for multiple origins.
const rawFrontends = (process.env.FRONTEND_URL || "").trim();
const allowedOrigins = rawFrontends
  ? rawFrontends.split(",").map(s => s.trim()).filter(Boolean)
  : []; // empty => no origin allowed except server-to-server requests

// Debug helper: uncomment only while debugging (then remove)
// console.log("Allowed origins:", allowedOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // allow non-browser requests (curl/postman) where origin is undefined
    if (!origin) return callback(null, true);

    // allow all if FRONTEND_URL was set to "*" explicitly
    if (allowedOrigins.includes("*")) return callback(null, true);

    // allow if origin matches one of allowedOrigins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // otherwise block
    return callback(new Error("CORS not allowed by FRONTEND_URL"));
  },
  credentials: true,
  // let the cors package set sensible defaults for Access-Control-Allow-Headers/Methods
};

// handle preflight requests for all routes
app.options("*", cors(corsOptions));

// global middleware
app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// health endpoints (root and under /api if you want them both)
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// mount API routes
app.use("/api", routes);

export default app;
