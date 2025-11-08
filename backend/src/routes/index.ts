// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth";
import tasksRoutes from "./tasks";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Welcome to Taskly API 👋" });
});

// mount auth routes: /api/auth/*
router.use("/auth", authRoutes);

// mount task routes: /api/tasks/*
router.use("/tasks", tasksRoutes);

// protected test route
router.get("/protected", requireAuth, (req: AuthRequest, res) => {
  res.json({ message: "You reached a protected route", userId: req.userId });
});

export default router;
