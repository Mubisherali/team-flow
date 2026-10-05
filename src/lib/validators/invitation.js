// -------------------------------------------------------------
// Zod Validation Schemas - Invitations
// -------------------------------------------------------------

import { z } from 'zod';

// -------------------------------------------------------------
// CREATE INVITATION
// -------------------------------------------------------------
// Rules:
//   - email: valid email
//   - role: MEMBER or MANAGER (never OWNER — only one owner
//           per workspace, and there's no ownership transfer yet)
export const createInvitationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  role: z
    .enum(['MEMBER', 'MANAGER'], {
      errorMap: () => ({ message: 'Role must be MEMBER or MANAGER' }),
    })
    .default('MEMBER'),
});