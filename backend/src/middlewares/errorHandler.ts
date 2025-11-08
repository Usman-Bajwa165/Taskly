import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err && (err.stack || err));
  if (process.env.NODE_ENV === "test") {
    return res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error", stack: String(err?.stack || "") });
  }
  if (err?.status && err?.message) {
    return res.status(err.status).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal Server Error" });
};
