import { z } from 'zod';

// Role updates: only MEMBER <-> MANAGER. Owner is fixed.
export const updateMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'MANAGER'], {
    errorMap: () => ({ message: 'Role must be MEMBER or MANAGER' }),
  }),
});