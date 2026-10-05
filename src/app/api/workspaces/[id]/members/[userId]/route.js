// -------------------------------------------------------------
// /api/workspaces/[id]/members/[userId] - Manage a Member
// -------------------------------------------------------------
//
// PATCH  : Change a member's role (MEMBER <-> MANAGER)
// DELETE : Remove a member from the workspace
//
// AUTH RULES:
//   PATCH  - Only the OWNER can change roles
//   DELETE - OWNER or MANAGER can remove members
//          (but not the OWNER themselves)
//
// GUARDS:
//   - Can't change own role
//   - Can't remove yourself
//   - Can't remove the owner
//   - Can't demote the owner (owner stays owner)
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canChangeRoles,
  canRemoveMembers,
} from '@/lib/permissions';
import { updateMemberRoleSchema } from '@/lib/validators/member';

// =============================================================
// PATCH - Change role
// =============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, userId: targetUserId } = await params;

    // Role check — only OWNER can change roles
    const actorRole = await getMemberRole(session.user.id, workspaceId);
    if (!canChangeRoles(actorRole)) {
      return NextResponse.json(
        { error: 'Only the owner can change member roles' },
        { status: 403 }
      );
    }

    // Can't change your own role
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Validate body
    const body = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Find target membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found in this workspace' },
        { status: 404 }
      );
    }

    // Can't demote the owner
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'The owner role cannot be changed' },
        { status: 403 }
      );
    }

    // Update
    const updated = await prisma.workspaceMember.update({
      where: { id: membership.id },
      data: { role: parsed.data.role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Role updated',
      member: {
        id: updated.id,
        userId: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        avatarUrl: updated.user.avatarUrl,
        role: updated.role,
        joinedAt: updated.joinedAt,
      },
    });
  } catch (error) {
    console.error('[MEMBER_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE - Remove member
// =============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, userId: targetUserId } = await params;

    const actorRole = await getMemberRole(session.user.id, workspaceId);
    if (!canRemoveMembers(actorRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to remove members' },
        { status: 403 }
      );
    }

    // Can't remove yourself (must use "leave workspace" — future feature)
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the workspace' },
        { status: 400 }
      );
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found in this workspace' },
        { status: 404 }
      );
    }

    // Can't remove the owner
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'The workspace owner cannot be removed' },
        { status: 403 }
      );
    }

    // Managers can't remove other managers — only the owner can.
    if (actorRole === 'MANAGER' && membership.role === 'MANAGER') {
      return NextResponse.json(
        { error: 'Managers cannot remove other managers' },
        { status: 403 }
      );
    }

    // Also remove from any projects in this workspace
    // (so they don't linger as project members of a workspace they left)
    await prisma.$transaction([
      prisma.projectMember.deleteMany({
        where: {
          userId: targetUserId,
          project: { workspaceId },
        },
      }),
      prisma.workspaceMember.delete({
        where: { id: membership.id },
      }),
    ]);

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    console.error('[MEMBER_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}