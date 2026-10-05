// -------------------------------------------------------------
// Zod Validation Schemas - Projects
// -------------------------------------------------------------
//
// Shared between:
//   - Client: CreateProjectModal, ProjectSettingsForm
//   - Server: API routes (security)
//
// The color palette is imported from @/lib/project-colors so
// there's ONE source of truth. If we add a color there, the
// validator accepts it automatically.
// -------------------------------------------------------------

import { z } from 'zod';
import { PROJECT_COLOR_VALUES } from '@/lib/project-colors';

// -------------------------------------------------------------
// CREATE PROJECT
// -------------------------------------------------------------
// Fields:
//   - name: 2-60 chars
//   - description: optional, up to 300 chars
//   - color: must be one of the preset palette values
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(60, 'Project name must be 60 characters or fewer')
    .trim(),

  description: z
    .string()
    .max(300, 'Description must be 300 characters or fewer')
    .trim()
    .optional()
    .or(z.literal('')),

  color: z
    .string()
    .refine((val) => PROJECT_COLOR_VALUES.includes(val), {
      message: 'Invalid color',
    })
    .optional(),
});

// -------------------------------------------------------------
// UPDATE PROJECT (partial)
// -------------------------------------------------------------
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(60, 'Project name must be 60 characters or fewer')
    .trim()
    .optional(),

  description: z
    .string()
    .max(300, 'Description must be 300 characters or fewer')
    .trim()
    .optional()
    .or(z.literal('')),

  color: z
    .string()
    .refine((val) => PROJECT_COLOR_VALUES.includes(val), {
      message: 'Invalid color',
    })
    .optional(),
});

// -------------------------------------------------------------
// ADD PROJECT MEMBER
// -------------------------------------------------------------
// Body for POST /workspaces/[id]/projects/[projectId]/members
export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});