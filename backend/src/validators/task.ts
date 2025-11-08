// src/validators/task.ts (update)
import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
});

export const ListTasksQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
  dueBefore: z.string().optional(), // ISO date string
  dueAfter: z.string().optional(),
});
