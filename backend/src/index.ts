// src/index.ts — Vercel serverless handler (DO NOT start a local server here)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "./app";               // note: "./app" (relative)
import { connectDB } from "./config/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uri = process.env.MONGO_URI || "";
    if (!uri) {
      console.error("No MONGO_URI provided to Vercel function.");
      return res.status(500).json({ error: "Missing MONGO_URI" });
    }
    await connectDB(uri);
  } catch (err) {
    console.error("DB connect error:", err);
    return res.status(500).json({ error: "DB connection failed" });
  }

  (app as any)(req, res);
}
