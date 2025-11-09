// src/app.ts
import dotenv from "dotenv";
dotenv.config(); // <-- load env first

import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// mount API routes
app.use("/", routes);

export default app;
