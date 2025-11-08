import { Router, Request, Response } from "express";
import { authLimiter } from "../middlewares/rateLimiter";
import User from "../models/User";
import { validateBody } from "../middlewares/validate";
import { RegisterSchema, LoginSchema } from "../validators/auth";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Auth routes: POST /register & POST /login" });
});

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

interface AuthRequestBody {
  name?: string;
  email?: string;
  password?: string;
}

// ---------- config for email + frontend link ----------
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || `no-reply@localhost`;

// create transporter if SMTP configured
let transporter: nodemailer.Transporter | null = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}
if (transporter) {
  transporter.verify().then(() => {
    console.log("✅ SMTP transporter verified (ready to send emails)");
  }).catch(err => {
    console.error("❌ SMTP transporter verification failed:", err);
  });
}

// ---------- check-email endpoint (GET /auth/check-email?email=...) ----------
router.get("/check-email", async (req, res) => {
  try {
    const email = String(req.query.email || "").toLowerCase();
    if (!email) return res.json({ exists: false });
    const u = await User.findOne({ email }).select("_id").lean();
    return res.json({ exists: Boolean(u) });
  } catch (err: any) {
    console.error("GET /auth/check-email failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------- validate reset token (GET /auth/validate-reset?token=...) ----------
router.get("/validate-reset", async (req, res) => {
  try {
    const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ valid: false, reason: "Missing token" });

    // tell TS the shape of the lean result
    const user = await User.findOne({ resetPasswordToken: token })
      .select("name email resetPasswordExpires resetPasswordUsed")
      .lean<{
        name?: string;
        email?: string;
        resetPasswordExpires?: Date | null;
        resetPasswordUsed?: boolean | null;
      }>();

    if (!user) return res.status(400).json({ valid: false, reason: "Invalid token" });

    const now = Date.now();
    if (!user.resetPasswordExpires || (new Date(user.resetPasswordExpires).getTime() < now)) {
      return res.status(400).json({ valid: false, reason: "expired" });
    }
    if (user.resetPasswordUsed) {
      return res.status(400).json({ valid: false, reason: "used" });
    }

    // valid
    return res.json({ valid: true, name: user.name ?? null });
  } catch (err: any) {
    console.error("GET /auth/validate-reset failed:", err);
    return res.status(500).json({ valid: false, reason: "Server error" });
  }
});

// ---------- forgot password (POST /auth/forgot) ----------
router.post("/forgot", authLimiter, async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || "").toLowerCase();
    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await User.findOne({ email });
    if (user) {
      // create a random token (url-safe hex)
      const resetToken = crypto.randomBytes(24).toString("hex"); // 48 chars
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // store token on user as single-use
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = expiresAt;
      user.resetPasswordUsed = false;
      await user.save();

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

      const displayName = user.name || user.email.split("@")[0];

      const subject = "Reset your Taskly password";
      const text = `Hi ${displayName},\n\nSomeone requested a password reset for your Taskly account. If that was you, open the link below to choose a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour and can only be used once. If the link is expired or has already been used, request a new reset link.\n\nIf you didn't request this, you can ignore this email.\n\nThanks,\nTaskly`;
      const html = `<p>Hi ${displayName},</p>
        <p>Someone requested a password reset for your Taskly account. If that was you, open the link below to choose a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p><strong>Note:</strong> This link expires in <strong>1 hour</strong> and can only be used once. If the link has expired or was already used, request a new reset link from the app.</p>
        <p>If you didn't request this, you can ignore this email.</p>
        <p>Thanks,<br/>Taskly</p>`;

      if (transporter) {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: user.email,
          subject,
          text,
          html,
        });
      } else {
        console.log("Password reset link (no SMTP):", resetUrl);
      }
    }

    // Always return generic success to avoid enumeration
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("POST /auth/forgot failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------- reset password (POST /auth/reset) ----------
router.post("/reset", authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) return res.status(400).json({ error: "Token and new password are required" });
    if ((password || "").length < 7) return res.status(400).json({ error: "Password must be at least 7 characters" });

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) return res.status(400).json({ error: "Invalid token" });

    const now = Date.now();
    if (!user.resetPasswordExpires || (new Date(user.resetPasswordExpires).getTime() < now)) {
      return res.status(400).json({ error: "Token has expired" });
    }

    if (user.resetPasswordUsed) {
      return res.status(400).json({ error: "This reset link has already been used" });
    }

    // set new password (User model hashes before save)
    user.password = String(password);
    // mark token used and clear token/expiry (single-use)
    user.resetPasswordUsed = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Optionally set passwordChangedAt to invalidate existing JWTs (recommended)
    (user as any).passwordChangedAt = new Date();

    await user.save();

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("POST /auth/reset failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Register
router.post("/register", authLimiter, validateBody(RegisterSchema), async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const user = new User({ name, email, password });
    await user.save();

    // ensure id is a string
    const payload = { id: user._id.toString() };
    // cast to any to avoid TypeScript signature mismatch with jsonwebtoken types
    const token = (jwt.sign as any)(payload, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN } as any);

    res.status(201).json({ token, user: { id: payload.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", authLimiter, validateBody(LoginSchema), async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { id: user._id.toString() };
    const token = (jwt.sign as any)(payload, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN } as any);

    res.json({ token, user: { id: payload.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
