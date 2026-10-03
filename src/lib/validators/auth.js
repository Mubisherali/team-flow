// ─────────────────────────────────────────────────────────────
// Zod Validation Schemas — Authentication
// ─────────────────────────────────────────────────────────────
//
// WHY ZOD:
// - We validate user input in ONE place.
// - The same schema is used on the frontend (form) AND backend (API).
//   This means: whatever the form accepts, the API accepts. No drift.
// - Zod gives us clean error messages with field names.
//
// WHAT WE EXPORT:
//   - registerSchema: for POST /api/auth/register
//   - loginSchema:    for the login form (NextAuth does its own
//                     validation, but we still use this client-side)
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ─────────────────────────────────────────────
// REGISTER SCHEMA
// ─────────────────────────────────────────────
// Rules:
//   - name: 2-50 characters
//   - email: valid email format
//   - password: min 8 chars, must contain at least 1 number
//   - confirmPassword: must match password
// ─────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be 50 characters or fewer')
      .trim(),

    email: z
      .string()
      .email('Please enter a valid email address')
      .toLowerCase() // emails are case-insensitive
      .trim(),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least one number'),

    confirmPassword: z.string(),
  })
  // `.refine()` lets us add a custom rule across multiple fields.
  // Here: confirmPassword must equal password.
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // attach error to this field
  });

// ─────────────────────────────────────────────
// LOGIN SCHEMA
// ─────────────────────────────────────────────
// Lighter than register — just check the shape.
// NextAuth will do the actual credential verification.
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  // On login we don't enforce password rules — an existing user's
  // password was already validated at signup. Just require non-empty.
  password: z.string().min(1, 'Password is required'),
});