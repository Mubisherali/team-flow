// -------------------------------------------------------------
// Kanban Helpers
// -------------------------------------------------------------
//
// Pure functions for:
//   1. Grouping a flat task list into columns by status
//   2. Computing the new order after a drag-and-drop
//
// No dependencies on React or Prisma — just data in, data out.
// -------------------------------------------------------------

import { TASK_STATUSES } from './task-constants';

// -------------------------------------------------------------
// GROUP TASKS INTO COLUMNS
// -------------------------------------------------------------
// Input:  flat array of tasks (each has status + order)
// Output: { TODO: [...], IN_PROGRESS: [...], REVIEW: [...], DONE: [...] }
//
// Within each column, tasks are sorted by `order` ascending.
// Empty columns are still present (as empty arrays) so the UI
// always renders all four.
export function groupTasksByStatus(tasks) {
  const grouped = {};

  // Initialize every status with an empty array.
  for (const status of TASK_STATUSES) {
    grouped[status.value] = [];
  }

  // Place each task in its column.
  for (const task of tasks || []) {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
    // Unknown status → silently skip. Defensive.
  }

  // Sort each column by order (ascending), then createdAt as tiebreaker.
  for (const status of Object.keys(grouped)) {
    grouped[status].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  return grouped;
}

// -------------------------------------------------------------
// COMPUTE REORDER
// -------------------------------------------------------------
// Called after a drag-and-drop. Given:
//   - current tasks (flat array)
//   - taskId being moved
//   - newStatus (the column it landed in)
//   - newIndex (position within that column, 0-based)
//
// Returns an array of { id, order, status? } updates to send
// to the server.
//
// We renumber the entire destination column. If the status
// changed, we also renumber the source column.
//
// WHY RENUMBER THE WHOLE COLUMN:
//   Simpler than fractional indexing. For a few hundred tasks
//   per column, this is instant. If we ever scale, we can
//   switch to fractional indices.
export function computeReorder(tasks, taskId, newStatus, newIndex) {
  const movingTask = tasks.find((t) => t.id === taskId);
  if (!movingTask) return [];

  const oldStatus = movingTask.status;

  // Build working arrays for source and destination columns,
  // excluding the moving task.
  const others = tasks.filter((t) => t.id !== taskId);

  const sourceColumn = others
    .filter((t) => t.status === oldStatus)
    .sort((a, b) => a.order - b.order);

  const destColumn =
    oldStatus === newStatus
      ? sourceColumn
      : others
          .filter((t) => t.status === newStatus)
          .sort((a, b) => a.order - b.order);

  // Clamp newIndex into range.
  const safeIndex = Math.max(0, Math.min(newIndex, destColumn.length));

  // Insert the moving task at its new position.
  const updatedDest = [...destColumn];
  updatedDest.splice(safeIndex, 0, movingTask);

  // Build the update payload.
  const updates = [];

  // Renumber the destination column.
  updatedDest.forEach((task, idx) => {
    const isMoving = task.id === taskId;
    updates.push({
      id: task.id,
      order: idx,
      // Only include status when it actually changed (avoids
      // unnecessary writes on same-column reorders).
      ...(isMoving && oldStatus !== newStatus ? { status: newStatus } : {}),
    });
  });

  // If the status changed, also renumber the source column
  // (removing the moved task leaves a gap).
  if (oldStatus !== newStatus) {
    sourceColumn.forEach((task, idx) => {
      updates.push({ id: task.id, order: idx });
    });
  }

  return updates;
}

// -------------------------------------------------------------
// APPLY REORDER LOCALLY (optimistic UI)
// -------------------------------------------------------------
// Takes the current flat task list + updates from
// computeReorder and returns a NEW flat array with the changes
// applied. Used to update the UI instantly before the server
// responds.
export function applyUpdates(tasks, updates) {
  if (!updates || updates.length === 0) return tasks;

  // Build a map for O(1) lookup.
  const updateMap = new Map(updates.map((u) => [u.id, u]));

  return tasks.map((task) => {
    const update = updateMap.get(task.id);
    if (!update) return task;
    return {
      ...task,
      order: update.order,
      ...(update.status ? { status: update.status } : {}),
    };
  });
}

// -------------------------------------------------------------
// COUNT HELPERS — used for column headers and stats
// -------------------------------------------------------------
export function countByStatus(tasks) {
  const counts = {};
  for (const status of TASK_STATUSES) counts[status.value] = 0;
  for (const t of tasks || []) {
    if (counts[t.status] !== undefined) counts[t.status] += 1;
  }
  return counts;
}

// -------------------------------------------------------------
// FILTER — basic assignee + priority filters
// -------------------------------------------------------------
// filters = { assignee: 'all' | 'me' | userId, priority: 'ALL' | 'URGENT' | ... }
export function filterTasks(tasks, filters, currentUserId) {
  if (!filters) return tasks;

  return (tasks || []).filter((task) => {
    // Assignee
    if (filters.assignee && filters.assignee !== 'all') {
      if (filters.assignee === 'me') {
        if (task.assigneeId !== currentUserId) return false;
      } else {
        if (task.assigneeId !== filters.assignee) return false;
      }
    }

    // Priority
    if (
      filters.priority &&
      filters.priority !== 'ALL' &&
      task.priority !== filters.priority
    ) {
      return false;
    }

    return true;
  });
}