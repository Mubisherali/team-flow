// -------------------------------------------------------------
// /api/workspaces/[id]/members/[userId]
// -------------------------------------------------------------
//
// PATCH  : Change a member's role (MEMBER <-> MANAGER)
// DELETE : Remove a member from the workspace
//
// AUTHORIZATION:
//   PATCH  - Only the OWNER can change roles
//   DELETE - OWNER or MANAGER can remove members
//
// GUARDS (in both endpoints):
//   - Cannot target yourself
//   - Cannot modify/remove the OWNER
//   - MANAGERs cannot remove other MANAGERs (only OWNER can)
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
// PATCH — Change member's role
// =============================================================
export async function PATCH(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, userId: targetUserId } = await params;

    // ─── Step 2: Actor must be OWNER ───
    const actorRole = await getMemberRole(session.user.id, workspaceId);
    if (!canChangeRoles(actorRole)) {
      return NextResponse.json(
        { error: 'Only the owner can change member roles' },
        { status: 403 }
      );
    }

    // ─── Step 3: Can't change your own role ───
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // ─── Step 4: Validate body ───
    const body = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ─── Step 5: Target membership must exist ───
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

    // ─── Step 6: Owner's role cannot be changed ───
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'The owner role cannot be changed' },
        { status: 403 }
      );
    }

    // ─── Step 7: Update role ───
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
// DELETE — Remove member from workspace
// =============================================================
export async function DELETE(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, userId: targetUserId } = await params;

    // ─── Step 2: Actor must be OWNER or MANAGER ───
    const actorRole = await getMemberRole(session.user.id, workspaceId);
    if (!canRemoveMembers(actorRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to remove members' },
        { status: 403 }
      );
    }

    // ─── Step 3: Can't remove yourself (future: "leave workspace") ───
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the workspace' },
        { status: 400 }
      );
    }

    // ─── Step 4: Target membership must exist ───
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

    // ─── Step 5: Can't remove the OWNER ───
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'The workspace owner cannot be removed' },
        { status: 403 }
      );
    }

    // ─── Step 6: MANAGERs can't remove other MANAGERs ───
    if (actorRole === 'MANAGER' && membership.role === 'MANAGER') {
      return NextResponse.json(
        { error: 'Managers cannot remove other managers' },
        { status: 403 }
      );
    }

    // ─── Step 7: Transaction — remove member + their project memberships ───
    // We also clean up their ProjectMember rows in this workspace so
    // they don't linger as a project member after leaving the workspace.
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