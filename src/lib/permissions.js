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