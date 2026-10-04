import {z} from 'zod';

export const createWorkspaceSchema  = z.object({

    name:z
          .string()
          .min(2, 'workspace must be mor then 2 characters ')
          .max(20, 'workspcae must be less then 20 characters')
          .trim(),

    description: z
    .string()
    .max(200, 'Description must be 200 characters or fewer')
    .trim()
    .optional()
    .or(z.literal('')), // allow empty string


});

export const updateWorkspaceSchema = z.object({
      name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name must be 50 characters or fewer')
    .trim()
    .optional(),

  description: z
    .string()
    .max(200, 'Description must be 200 characters or fewer')
    .trim()
    .optional()
    .or(z.literal('')),
})