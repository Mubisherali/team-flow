// -------------------------------------------------------------
// Zod Validation Schemas - Comments
// -------------------------------------------------------------
//
// Shared between client (CommentForm) and server (API routes).
//
// A comment is just plain text. No HTML, no markdown — those
// would require sanitization + rendering libraries. Text-only
// is safe, simple, and matches the "quick clarification"
// use case.
// -------------------------------------------------------------

import { z } from 'zod';

export const commentContentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or fewer'),
});