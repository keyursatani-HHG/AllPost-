import { z } from "zod";

/**
 * Shared validation schemas (Zod). Reused by react-hook-form on the client
 * and mirror the constraints enforced by the FastAPI backend.
 */

const email = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional().default(false),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name is too long"),
    email,
    phone: z
      .string()
      .max(20, "Phone number is too long")
      .optional()
      .or(z.literal("")),
    company: z
      .string()
      .max(80, "Company name is too long")
      .optional()
      .or(z.literal("")),
    password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Rough password-strength score (0–4) for the register meter.
 */
export function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}
