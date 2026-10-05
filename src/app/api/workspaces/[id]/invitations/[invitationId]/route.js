// -------------------------------------------------------------
// /api/workspaces/[id]/invitations/[invitationId]
// -------------------------------------------------------------
//
// DELETE: Revoke a PENDING invitation.
//
// AUTHORIZATION:
//   Owner or manager of the workspace.
//
// BEHAVIOR:
//   Sets status = 'REVOKED' (soft delete). We keep the row
//   for audit purposes, but the token can no longer be used.
//
// GUARDS:
//   - Invitation must exist and belong to this workspace
//   - Invitation must be PENDING (can't revoke accepted ones)
//   - Caller must be owner/manager
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canInviteMembers } from '@/lib/permissions';

export async function DELETE(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, invitationId } = await params;

    // ─── Step 2: Fetch the invitation and verify it belongs here ───
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { id: true, workspaceId: true, status: true },
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // ─── Step 3: Role check (owner or manager) ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canInviteMembers(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke invitations' },
        { status: 403 }
      );
    }

    // ─── Step 4: Only PENDING can be revoked ───
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending invitations can be revoked' },
        { status: 400 }
      );
    }

    // ─── Step 5: Soft delete ───
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return NextResponse.json({ message: 'Invitation revoked' });
  } catch (error) {
    console.error('[INVITATION_REVOKE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}