// -------------------------------------------------------------
// Notification Helper
// -------------------------------------------------------------
//
// USED BY:
//   - Task creation (notify on assign)
//   - Task PATCH    (notify on reassign / status change)
//   - Task PATCH    (notify managers when moved to REVIEW)
//   - Comment POST  (notify on comment)
//   - Invitation POST   (notify existing user of incoming invite)
//   - Invitation accept (notify inviter)
//   - Invitation decline (notify inviter)
//   - Project member add (notify the added user)
//
// DESIGN:
//   createNotification() is FIRE-AND-FORGET. It never throws.
// -------------------------------------------------------------

import { prisma } from '@/lib/prisma';

// -------------------------------------------------------------
// CREATE NOTIFICATION
// -------------------------------------------------------------
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
    console.error('[notify] Failed to create notification', err);
    return { ok: false, error: err.message };
  }
}

// -------------------------------------------------------------
// NOTIFY TASK EVENT
// -------------------------------------------------------------
export async function notifyTaskEvent({
  task,
  workspaceId,
  actorId,
  actorName,
  event,
  extra = {},
}) {
  if (!task || !workspaceId || !actorId) return;

  const link = `/workspaces/${workspaceId}/projects/${task.projectId}/tasks/${task.id}`;

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

  if (recipients.size === 0) return;

  const type =
    event === 'assigned' || event === 'reassigned'
      ? 'TASK_ASSIGNED'
      : event === 'status_changed'
        ? 'TASK_STATUS_CHANGED'
        : event === 'commented'
          ? 'TASK_COMMENTED'
          : 'TASK_ASSIGNED';

  await Promise.all(
    Array.from(recipients).map((userId) =>
      createNotification({ userId, type, message, link })
    )
  );
}

// -------------------------------------------------------------
// NOTIFY INVITATION EVENT
// -------------------------------------------------------------
export async function notifyInvitationEvent({
  event,
  recipientId,
  workspace,
  actorName,
  invitation,
}) {
  if (!event || !recipientId || !workspace) return;

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

// -------------------------------------------------------------
// NOTIFY PROJECT EVENT
// -------------------------------------------------------------
export async function notifyProjectEvent({
  event,
  recipientId,
  actorId,
  actorName,
  workspace,
  project,
}) {
  if (event !== 'member_added') return;
  if (!recipientId || !workspace || !project) return;

  if (recipientId === actorId) return;

  const link = `/workspaces/${workspace.id}/projects/${project.id}`;
  const message = `${actorName} added you to "${project.name}" in ${workspace.name}`;

  await createNotification({
    userId: recipientId,
    type: 'PROJECT_ADDED',
    message,
    link,
  });
}

// -------------------------------------------------------------
// NOTIFY REVIEW SUBMITTED
// -------------------------------------------------------------
// Higher-level helper. Called when a MEMBER moves a task to
// REVIEW. Notifies every OWNER/MANAGER in the workspace so any
// manager who's available can review and approve.
//
// RULES:
//   - Skip the actor (they're the one submitting, no self-notify)
//   - Skip if the actor is already a manager/owner (they ARE
//     the reviewer — no one else needs to be paged)
//   - Notify ALL privileged members (owners + managers) —
//     managers are a team; whoever's awake handles it
//   - No dedup — each transition to REVIEW is a distinct event
//
// PARAMS:
//   task         : { id, projectId, title }
//   workspaceId  : string
//   actorId      : string (who submitted)
//   actorName    : string
//   actorIsPrivileged : boolean — if true, skip entirely
export async function notifyReviewSubmitted({
  task,
  workspaceId,
  actorId,
  actorName,
  actorIsPrivileged,
}) {
  if (!task || !workspaceId || !actorId) return;

  // Only members trigger this — managers are their own reviewers.
  if (actorIsPrivileged) return;

  // Find all owners/managers in this workspace except the actor.
  const privilegedMembers = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      role: { in: ['OWNER', 'MANAGER'] },
      userId: { not: actorId },
    },
    select: { userId: true },
  });

  if (privilegedMembers.length === 0) return;

  const link = `/workspaces/${workspaceId}/projects/${task.projectId}/tasks/${task.id}`;
  const message = `${actorName} submitted "${task.title}" for review`;

  await Promise.all(
    privilegedMembers.map((m) =>
      createNotification({
        userId: m.userId,
        type: 'TASK_MOVED_TO_REVIEW',
        message,
        link,
      })
    )
  );
}