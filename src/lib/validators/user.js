// -------------------------------------------------------------
// Zod Validation Schemas - User Profile
// -------------------------------------------------------------
//
// SCOPE:
//   - Update own profile (name, avatar URL)
//   - (Later) change password — not in this phase
//
// USED BY:
//   - PATCH /api/users/me    → updateProfileSchema
//   - ProfileForm.jsx        → same schema for client-side validation
// -------------------------------------------------------------

import { z } from 'zod';

// -------------------------------------------------------------
// UPDATE PROFILE
// -------------------------------------------------------------
// Both fields are optional (partial update).
//
// name      : 2-50 chars (trimmed first, then length-checked)
// avatarUrl : https URL, or empty string to clear
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or fewer')
    .optional(),

  avatarUrl: z
    .union([
      z
        .string()
        .url('Avatar must be a valid URL')
        .refine((val) => val.startsWith('https://'), {
          message: 'Avatar URL must use https',
        }),
      z.literal(''),
    ])
    .optional(),
});