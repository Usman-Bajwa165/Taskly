// src/middlewares/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validate request body (req.body) with Zod schema
 */
export const validateBody = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map(i => ({
      origin: i.code,
      path: i.path,
      message: i.message,
    }));
    return res.status(400).json({ error: "Validation error", details, message: result.error.message });
  }
  // replace the object content rather than reassigning req.body (which is safe)
  req.body = result.data;
  next();
};

/**
 * Validate query string (req.query) with Zod schema.
 * DO NOT replace req.query object — merge parsed values into it.
 */
export const validateQuery = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  // req.query values come as strings (or arrays); parse into expected types via zod
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues.map(i => ({
      origin: i.code,
      path: i.path,
      message: i.message,
    }));
    return res.status(400).json({ error: "Validation error", details, message: result.error.message });
  }

  // Merge parsed/validated values into existing req.query object
  const parsed = result.data;
  try {
    // keep existing properties, overwrite with parsed ones
    for (const key of Object.keys(parsed)) {
      // assign to property on req.query (do not reassign req.query itself)
      (req.query as any)[key] = parsed[key];
    }
  } catch (err) {
    // fallback: attach validated query to a safe field so routes can read it if needed
    (req as any).validatedQuery = parsed;
  }

  next();
};
