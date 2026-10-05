// -------------------------------------------------------------
// Zod Validation Schemas - Member Management
// -------------------------------------------------------------

import { z } from 'zod';

// -------------------------------------------------------------
// UPDATE MEMBER ROLE
// -------------------------------------------------------------
// Only MEMBER <-> MANAGER changes are allowed via the API.
// The OWNER role is fixed — ownership transfer is a future
// feature that will need its own endpoint.
export const updateMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'MANAGER'], {
    errorMap: () => ({ message: 'Role must be MEMBER or MANAGER' }),
  }),
});