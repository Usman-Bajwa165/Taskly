// src/routes/tasks.ts
import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Task, { ITask, TaskStatus } from "../models/Task";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { validateBody, validateQuery } from "../middlewares/validate";
import { CreateTaskSchema, UpdateTaskSchema, ListTasksQuerySchema } from "../validators/task";
import { validateObjectIdParam } from "../middlewares/params";

const router = Router();
const allowedStatuses: TaskStatus[] = ["todo", "in-progress", "done"];

router.use(requireAuth);

/**
 * POST /api/tasks
 * Create a task (protected)
 */
router.post("/", validateBody(CreateTaskSchema), async (req: AuthRequest, res: Response) => {  try {
    const { title, description, dueDate, status } = req.body;
    if (!title || typeof title !== "string") return res.status(400).json({ error: "title is required" });
    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ error: "invalid status" });

    const task = new Task({
      title: title.trim(),
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: (status as TaskStatus) || "todo",
      owner: new mongoose.Types.ObjectId(req.userId),
    });

    await task.save();
    res.status(201).json(task);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/tasks
 * List tasks for the authenticated user, with optional pagination
 * Query params: ?page=1&limit=10
 */
router.get("/", validateQuery(ListTasksQuerySchema), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

const filter: any = { owner: req.userId };
if (req.query.status) filter.status = String(req.query.status);
if (req.query.q) {
  const q = String(req.query.q);
  filter.$or = [
    { title: { $regex: q, $options: "i" } },
    { description: { $regex: q, $options: "i" } }
  ];
}

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.dueBefore) {
      const before = new Date(String(req.query.dueBefore));
      if (!isNaN(before.getTime())) {
        filter.dueDate = { ...(filter.dueDate || {}), $lte: before };
      }
    }

    if (req.query.dueAfter) {
      const after = new Date(String(req.query.dueAfter));
      if (!isNaN(after.getTime())) {
        filter.dueDate = { ...(filter.dueDate || {}), $gte: after };
      }
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Task.countDocuments(filter),
    ]);
    
    res.json({ tasks, meta: { total, page, limit } });
  } catch (err: any) {
    console.error("Error in GET /api/tasks:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task (owner-only)
 */
router.get("/:id", validateObjectIdParam("id"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.owner.toString() !== req.userId) return res.status(403).json({ error: "Not authorized" });

    res.json(task);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task (owner-only). Partial updates allowed.
 */
router.put("/:id", validateObjectIdParam("id"), validateBody(UpdateTaskSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.owner.toString() !== req.userId) return res.status(403).json({ error: "Not authorized" });

    const { title, description, dueDate, status } = req.body;
    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ error: "invalid status" });

    if (title !== undefined) task.title = String(title).trim();
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) task.status = status as TaskStatus;

    await task.save();
    res.json(task);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (owner-only)
 */
router.delete("/:id", validateObjectIdParam("id"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.owner.toString() !== req.userId) return res.status(403).json({ error: "Not authorized" });

    await task.deleteOne();
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
