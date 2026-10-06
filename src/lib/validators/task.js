// -------------------------------------------------------------
// Zod Validation Schemas - Tasks
// -------------------------------------------------------------
//
// Used by both client (modals) and server (API routes).
// One schema = same validation everywhere.
// -------------------------------------------------------------

import { z } from 'zod';

// -------------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------------
// Kept inline (small list) — matches the enums in schema.prisma.
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// -------------------------------------------------------------
// LABEL
// -------------------------------------------------------------
// A single task label:
//   - 1-24 chars
//   - lowercase, no leading/trailing spaces
//   - alphanumeric + spaces, hyphens, underscores
const labelSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Label cannot be empty')
  .max(24, 'Label must be 24 characters or fewer')
  .regex(
    /^[a-z0-9 _-]+$/,
    'Label can only contain letters, numbers, spaces, hyphens, and underscores'
  );

// -------------------------------------------------------------
// CREATE TASK
// -------------------------------------------------------------
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must be 150 characters or fewer'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional()
    .or(z.literal('')),

  status: z.enum(TASK_STATUSES).default('TODO'),

  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),

  // Assignee is optional. If provided, the API checks they're a
  // project member.
  assigneeId: z
    .union([z.string().min(1), z.literal(''), z.null()])
    .optional(),

  // Due date: ISO string or null.
  dueDate: z
    .union([
      z
        .string()
        .datetime({ message: 'Due date must be a valid date' }),
      z.literal(''),
      z.null(),
    ])
    .optional(),

  // Labels: array of short strings. Max 8 per task.
  labels: z
    .array(labelSchema)
    .max(8, 'A task can have at most 8 labels')
    .optional(),
});

// -------------------------------------------------------------
// UPDATE TASK
// -------------------------------------------------------------
// All fields optional — partial updates.
// Same rules as create.
export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must be 150 characters or fewer')
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional()
    .or(z.literal('')),

  status: z.enum(TASK_STATUSES).optional(),

  priority: z.enum(TASK_PRIORITIES).optional(),

  assigneeId: z
    .union([z.string().min(1), z.literal(''), z.null()])
    .optional(),

  dueDate: z
    .union([
      z
        .string()
        .datetime({ message: 'Due date must be a valid date' }),
      z.literal(''),
      z.null(),
    ])
    .optional(),

  labels: z
    .array(labelSchema)
    .max(8, 'A task can have at most 8 labels')
    .optional(),
});

// -------------------------------------------------------------
// REORDER TASK
// -------------------------------------------------------------
// Sent after a drag-and-drop. Server renumbers the destination
// column and (if status changed) removes the task from its old
// column's ordering.
export const reorderTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  newStatus: z.enum(TASK_STATUSES),
  newIndex: z
    .number()
    .int('Index must be an integer')
    .min(0, 'Index cannot be negative'),
});