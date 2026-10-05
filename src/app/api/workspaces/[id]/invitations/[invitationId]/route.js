// -------------------------------------------------------------
// /api/workspaces/[id]/invitations/[invitationId]
// -------------------------------------------------------------
//
// DELETE: Revoke a pending invitation.
// Auth: owner or manager of the workspace.
//
// Moved from /api/invitations/[id] because Next.js forbids two
// different dynamic names at the same path level
// ([id] and [token] under /api/invitations/).
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canInviteMembers } from '@/lib/permissions';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, invitationId } = await params;

    // Verify the invitation belongs to this workspace
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

    // Role check
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canInviteMembers(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke invitations' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending invitations can be revoked' },
        { status: 400 }
      );
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return NextResponse.json({ message: 'Invitation revoked' });
  } catch (error) {
    console.error('[INVITATION_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}