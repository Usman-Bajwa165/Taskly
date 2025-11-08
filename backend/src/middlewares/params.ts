// src/middlewares/params.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const validateObjectIdParam = (paramName = "id") => (req: Request, res: Response, next: NextFunction) => {
  const id = String(req.params[paramName] || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id parameter" });
  }
  next();
};
