// WHAT'S IN THIS FILE:
//   - Helper: getMemberRole(userId, workspaceId)  → fetch role
//   - Predicates: canX(role) → true/false for each action
// -------------------------------------------------------------

import { prisma } from '@/lib/prisma';

// -------------------------------------------------------------
// FETCH MEMBER ROLE
// -------------------------------------------------------------
// Given a user and a workspace, return the user's role
// (OWNER, MANAGER, MEMBER) or null if they're not a member.
//
// This is the building block for every permission check.
// Always call this first, then check the role with the
// predicate functions below.
export async function getMemberRole(userId, workspaceId) {
  if (!userId || !workspaceId) return null;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      // The @@unique([workspaceId, userId]) constraint lets us
      // query by the compound key like this.
      workspaceId_userId: { workspaceId, userId },
    },
    select: { role: true },
  });

  return membership?.role ?? null;
}

// -------------------------------------------------------------
// ROLE PREDICATES
// -------------------------------------------------------------
// These take a role and return a boolean.
// They are pure functions - no DB calls, just rules.

export function isOwner(role) {
  return role === 'OWNER';
}

export function isManagerOrOwner(role) {
  return role === 'OWNER' || role === 'MANAGER';
}

export function isMember(role) {
  // Any valid role means they're a member of the workspace.
  return role === 'OWNER' || role === 'MANAGER' || role === 'MEMBER';
}

// -------------------------------------------------------------
// ACTION PREDICATES
// -----------------------------------------------------------ca--
// Named after what the user wants to DO, not what role they
// have. This makes calling code read like English:
//   if (canDeleteWorkspace(role)) { ... }

// --- Workspace-level actions ---

export function canViewWorkspace(role) {
  // Any member can view.
  return isMember(role);
}

export function canEditWorkspace(role) {
  // Rename / change description: owner only.
  // (We can loosen this later to include managers.)
  return isOwner(role);
}

export function canDeleteWorkspace(role) {
  // Deleting a workspace is destructive - owner only.
  return isOwner(role);
}

// --- Member-level actions ---

export function canInviteMembers(role) {
  // Owners and managers can invite.
  return isManagerOrOwner(role);
}

export function canRemoveMembers(role) {
  // Owners and managers can remove members.
  // (Additional rules - like "can't remove the owner" -
  //  will be enforced in the specific route handler.)
  return isManagerOrOwner(role);
}

export function canChangeRoles(role) {
  // Only owners can promote/demote.
  return isOwner(role);
}

// --- Project-level actions ---
// (These will be used in Phase 5 when we build projects.)

export function canCreateProjects(role) {
  return isManagerOrOwner(role);
}

export function canDeleteProjects(role) {
  return isManagerOrOwner(role);
}
// -------------------------------------------------------------
// Aliases to match single-project route naming.
export function canEditProject(role) {
  return isManagerOrOwner(role);
}

export function canDeleteProject(role) {
  return isManagerOrOwner(role);
}

export function canManageProjectMembers(role) {
  return isManagerOrOwner(role);
}

// --- Task-level actions ---
// (These will be used in Phase 6 when we build tasks.)

export function canAssignTasks(role) {
  return isManagerOrOwner(role);
}

export function canUpdateAnyTask(role) {
  // Managers/owners can update any task.
  // Members can only update tasks they're assigned to
  // (that rule is enforced in the task route).
  return isManagerOrOwner(role);
}



// -------------------------------------------------------------
// TASK PERMISSIONS
// -------------------------------------------------------------

// --- Role-based (workspace role) ---

// Can this role view tasks at all? (Workspace-level gate.)
export function canViewTasks(role) {
  return isMember(role); // any workspace member passes this gate
}

// Can this role create tasks? (Owner, manager, or any project
// member — project membership is verified separately.)
export function canCreateTask(role) {
  return isMember(role);
}

// Can this role edit ANY task in the project?
// Only owners and managers have blanket edit rights.
export function canEditAnyTask(role) {
  return isManagerOrOwner(role);
}

// Can this role delete ANY task in the project?
export function canDeleteAnyTask(role) {
  return isManagerOrOwner(role);
}

// Is this role "privileged" for tasks — i.e. bypasses the
// own-task restriction? (Just a clearer alias.)
export function isTaskPrivileged(role) {
  return isManagerOrOwner(role);
}

// --- Context-aware (needs the task) ---

// Can the user mutate (edit / delete) this specific task?
// Returns true if:
//   - Role is owner/manager, OR
//   - User is the task's assignee, OR
//   - User created the task
//
// Pure function. Doesn't check project access — the caller
// must have already established that.
export function canMutateTask({ role, task, userId }) {
  if (!task || !userId) return false;
  if (isTaskPrivileged(role)) return true;
  if (task.assigneeId === userId) return true;
  if (task.createdById === userId) return true;
  return false;
}

// -------------------------------------------------------------
// ASSIGNMENT PERMISSIONS
// -------------------------------------------------------------
// Whether `userId` (with `role`) is allowed to set a task's
// assignee to `targetUserId`.
//
// RULES:
//   - targetUserId is null/empty  → allowed (unassign)
//   - targetUserId === userId     → allowed (self)
//   - owner/manager               → allowed (any target)
//   - plain member                → NOT allowed (others)
export function canAssignTo({ role, userId, targetUserId }) {
  if (!targetUserId) return true;              // unassign
  if (targetUserId === userId) return true;    // assign to self
  return isManagerOrOwner(role);               // only privileged can assign to others
}


// -------------------------------------------------------------
// KANBAN WORKFLOW PERMISSIONS
// -------------------------------------------------------------
// Whether `userId` (with `role`) can move `task` to `newStatus`.
//
// RULES:
//   - OWNER/MANAGER        → can move any task anywhere
//   - ASSIGNEE/CREATOR     → can move own tasks, but NOT to DONE
//   - Everyone else        → cannot move
//
// WHY MEMBERS CAN'T MOVE TO DONE:
//   DONE means "verified by a manager". Members push to REVIEW
//   to request approval; only managers/owners complete the loop.
export function canMoveTaskTo({ role, userId, task, newStatus }) {
  if (!task || !userId || !newStatus) return false;

  // Privileged: any move.
  if (isManagerOrOwner(role)) return true;

  // Members only move their own tasks.
  const isMyTask =
    task.assigneeId === userId || task.createdById === userId;
  if (!isMyTask) return false;

  // Members can never push their own task into DONE.
  if (newStatus === 'DONE') return false;

  return true;
}



// -------------------------------------------------------------
// COMMENT PERMISSIONS
// -------------------------------------------------------------

// Can the user delete this specific comment?
//
// RULES:
//   - The author can always delete their own comment
//   - OWNER/MANAGER can delete any comment (moderation)
//   - Everyone else → no
//
// Pure function. Takes the comment + caller + their role.
export function canDeleteComment({ role, userId, comment }) {
  if (!comment || !userId) return false;
  if (comment.userId === userId) return true;      // own comment
  return isManagerOrOwner(role);                    // moderation
}

// Can the user edit this comment?
// Only the author can edit. Managers can delete but not
// rewrite someone else's words.
export function canEditComment({ userId, comment }) {
  if (!comment || !userId) return false;
  return comment.userId === userId;
}