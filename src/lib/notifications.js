// -------------------------------------------------------------
// Notification Helper
// -------------------------------------------------------------
//
// USED BY:
//   - Task creation (notify on assign)
//   - Task PATCH    (notify on reassign / status change)
//   - Comment POST  (notify on comment)
//
// DESIGN:
//   createNotification() is FIRE-AND-FORGET. It never throws.
//   If the DB write fails, we log it and move on. The primary
//   action (create task, post comment) must not fail just
//   because a notification couldn't be created.
// -------------------------------------------------------------

import { prisma } from '@/lib/prisma';

// -------------------------------------------------------------
// CREATE NOTIFICATION
// -------------------------------------------------------------
// Low-level helper. Inserts one row. Never throws.
//
// Caller: pass userId (recipient), type, message, link.
// Returns: { ok: true } or { ok: false, error } — but the
// caller usually ignores the return value.
export async function createNotification({
  userId,
  type,
  message,
  link,
}) {
  try {
    if (!userId || !type || !message) {
      console.warn('[notify] Missing required fields', { userId, type });
      return { ok: false, error: 'Missing fields' };
    }

    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        link: link || null,
      },
    });

    return { ok: true };
  } catch (err) {
    // Swallow the error. Log it so we can spot patterns.
    console.error('[notify] Failed to create notification', err);
    return { ok: false, error: err.message };
  }
}

// -------------------------------------------------------------
// NOTIFY TASK EVENT
// -------------------------------------------------------------
// Higher-level helper. Given a task + actor + event info,
// computes WHO should be notified and calls createNotification
// for each.
//
// RULES:
//   - Skip the actor (don't notify yourself)
//   - Notify the assignee (if different from actor)
//   - Notify the creator (if different from actor AND assignee)
//     → deduped so a single person gets one notification
//
// PARAMS:
//   task      : task with { id, title, projectId, assigneeId, createdById }
//   workspaceId : string (for building the link)
//   actorId   : string (who did the action)
//   actorName : string (display name)
//   event     : 'assigned' | 'reassigned' | 'status_changed' | 'commented'
//   extra     : optional, e.g. { statusLabel: 'Review' }
export async function notifyTaskEvent({
  task,
  workspaceId,
  actorId,
  actorName,
  event,
  extra = {},
}) {
  if (!task || !workspaceId || !actorId) return;

  // Build the deep link to the task page
  const link = `/workspaces/${workspaceId}/projects/${task.projectId}/tasks/${task.id}`;

  // Decide message text based on event
  let message;
  if (event === 'assigned') {
    message = `${actorName} assigned you to "${task.title}"`;
  } else if (event === 'reassigned') {
    message = `${actorName} assigned you to "${task.title}"`;
  } else if (event === 'status_changed') {
    const statusLabel = extra.statusLabel || 'a new status';
    message = `${actorName} moved "${task.title}" to ${statusLabel}`;
  } else if (event === 'commented') {
    message = `${actorName} commented on "${task.title}"`;
  } else {
    message = `${actorName} updated "${task.title}"`;
  }

  // Build the recipient set (deduped, no self)
  const recipients = new Set();

  if (task.assigneeId && task.assigneeId !== actorId) {
    recipients.add(task.assigneeId);
  }
  if (
    task.createdById &&
    task.createdById !== actorId &&
    task.createdById !== task.assigneeId
  ) {
    recipients.add(task.createdById);
  }

  // Nothing to notify (e.g., actor is the only person involved)
  if (recipients.size === 0) return;

  // Map event → notification type
  const type =
    event === 'assigned' || event === 'reassigned'
      ? 'TASK_ASSIGNED'
      : event === 'status_changed'
        ? 'TASK_STATUS_CHANGED'
        : event === 'commented'
          ? 'TASK_COMMENTED'
          : 'TASK_ASSIGNED';

  // Fire-and-forget for each recipient
  await Promise.all(
    Array.from(recipients).map((userId) =>
      createNotification({ userId, type, message, link })
    )
  );
}