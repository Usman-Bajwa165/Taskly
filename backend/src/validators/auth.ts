// src/validators/auth.ts
import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6), // require min length 6
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
