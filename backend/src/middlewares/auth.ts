// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    // Normalize header to string
    const header = Array.isArray(authHeader) ? authHeader.join(" ") : String(authHeader || "");

    // debug log in test mode to see what's being passed
    if (process.env.NODE_ENV === "test") {
      console.log("requireAuth — raw Authorization header:", header);
    }

    if (!header) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const parts = header.split(" ").filter(Boolean);
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Invalid auth format" });
    }

    const token = parts[1];

    // quick decode for logging (non-verified)
    if (process.env.NODE_ENV === "test") {
      try {
        const decoded = jwt.decode(token);
        console.log("requireAuth — decoded token (unchecked):", decoded);
      } catch (e) {
        console.log("requireAuth — jwt.decode failed:", String(e));
      }
    }

    // verify token properly
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET as jwt.Secret);
    } catch (err: any) {
      // log error in tests so we can see why verification failed
      console.error("requireAuth — jwt.verify failed:", err && (err.stack || err.message || err));
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // payload should have id
    if (!payload || !payload.id) {
      console.error("requireAuth — token verified but payload.id missing:", payload);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.userId = String(payload.id);
    return next();
  } catch (err: any) {
    console.error("requireAuth — unexpected error:", err && (err.stack || err));
    return res.status(401).json({ error: "Authentication failed" });
  }
};
