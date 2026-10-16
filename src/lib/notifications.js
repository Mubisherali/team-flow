// -------------------------------------------------------------
// Notification Helper
// -------------------------------------------------------------
//
// USED BY:
//   - Task creation (notify on assign)
//   - Task PATCH    (notify on reassign / status change)
//   - Comment POST  (notify on comment)
//   - Invitation POST   (notify existing user of incoming invite)
//   - Invitation accept (notify inviter)
//   - Invitation decline (notify inviter)
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

// -------------------------------------------------------------
// NOTIFY INVITATION EVENT
// -------------------------------------------------------------
// Higher-level helper for invitation lifecycle events.
//
// EVENTS:
//   'received' → notify the invited user (only if they already
//                have an account — otherwise no userId exists)
//   'accepted' → notify the inviter
//   'declined' → notify the inviter
//
// DEDUP:
//   For 'received', we skip creating a duplicate if there's
//   already an unread INVITATION_RECEIVED notification for the
//   same link in the last hour. Prevents spam when the same
//   invite is re-issued quickly.
//
// PARAMS:
//   event        : 'received' | 'accepted' | 'declined'
//   recipientId  : string (userId of the person to notify)
//   workspace    : { id, name }
//   actorName    : string (display name of the person doing the action)
//   invitation   : { id, email, role } — used for link + message
export async function notifyInvitationEvent({
  event,
  recipientId,
  workspace,
  actorName,
  invitation,
}) {
  if (!event || !recipientId || !workspace) return;

  // Build the deep link.
  // 'received' → the invitee should land on the invitations page
  //   so they can accept or decline from there.
  // 'accepted' / 'declined' → the inviter should land on the
  //   workspace members page to see the updated list.
  const link =
    event === 'received'
      ? '/invitations'
      : `/workspaces/${workspace.id}/members`;

  let type;
  let message;

  if (event === 'received') {
    type = 'INVITATION_RECEIVED';
    const roleLabel =
      invitation?.role === 'MANAGER' ? 'a manager' : 'a member';
    message = `${actorName} invited you to join ${workspace.name} as ${roleLabel}`;
  } else if (event === 'accepted') {
    type = 'INVITATION_ACCEPTED';
    message = `${actorName} accepted your invitation to ${workspace.name}`;
  } else if (event === 'declined') {
    type = 'INVITATION_DECLINED';
    message = `${actorName} declined your invitation to ${workspace.name}`;
  } else {
    return;
  }

  // ─── Dedup for 'received' ───
  // If an unread INVITATION_RECEIVED notification already exists
  // for the same link in the last hour, skip.
  if (event === 'received') {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          userId: recipientId,
          type: 'INVITATION_RECEIVED',
          link,
          isRead: false,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (existing) return;
    } catch (err) {
      // If dedup check fails, proceed anyway (better to notify
      // twice than to silently skip).
      console.error('[notify] Dedup check failed', err);
    }
  }

  await createNotification({
    userId: recipientId,
    type,
    message,
    link,
  });
}