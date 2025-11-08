// src/models/Task.ts
import mongoose, { Document, Schema } from "mongoose";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate?: Date | null;
  status: TaskStatus;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);
export default Task;
