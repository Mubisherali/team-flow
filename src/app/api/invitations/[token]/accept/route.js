// -------------------------------------------------------------
// /api/invitations/[token]/accept - Accept Invitation
// -------------------------------------------------------------
//
// PURPOSE:
// Called by the /invite/[token] page when the user clicks
// "Accept invitation". Adds the user to the workspace.
//
// AUTH: MUST be logged in.
//
// SECURITY CHECK:
// The logged-in user's email MUST match the invitation's
// email. Otherwise a leaked link could be used by anyone.
//
// WHAT HAPPENS:
//   1. Verify invitation is valid (PENDING, not expired)
//   2. Verify user email matches
//   3. Create WorkspaceMember row with the invited role
//   4. Mark invitation as ACCEPTED
//   5. Return workspace info for redirect
//
// ERROR CASES:
//   401 - Not logged in
//   404 - Invalid/revoked/accepted/expired invitation
//   403 - Wrong email (link was for someone else)
//   409 - Already a member (idempotent, no harm done)
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/tokens';

export async function POST(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      );
    }

    const { token } = await params;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // ─── Step 2: Look up invitation ───
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // ─── Step 3: Status check ───
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        {
          error:
            invitation.status === 'ACCEPTED'
              ? 'This invitation has already been accepted'
              : 'This invitation is no longer valid',
          status: invitation.status,
        },
        { status: 404 }
      );
    }

    // ─── Step 4: Expiry check ───
    if (isTokenExpired(invitation.expiresAt)) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'This invitation has expired', status: 'EXPIRED' },
        { status: 410 }
      );
    }

    // ─── Step 5: Email match — THE security gate ───
    // Compare case-insensitively.
    const sessionEmail = session.user.email.toLowerCase().trim();
    const inviteEmail = invitation.email.toLowerCase().trim();

    if (sessionEmail !== inviteEmail) {
      return NextResponse.json(
        {
          error:
            'This invitation was sent to a different email address. Log in with the invited email to accept.',
        },
        { status: 403 }
      );
    }

    // ─── Step 6: Already a member? ───
    // Idempotent — no harm if they click twice.
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      // Mark invitation as ACCEPTED anyway (cleanup).
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return NextResponse.json(
        {
          message: 'You are already a member',
          workspace: {
            id: invitation.workspace.id,
            name: invitation.workspace.name,
            slug: invitation.workspace.slug,
          },
          role: existingMembership.role,
        },
        { status: 200 }
      );
    }

    // ─── Step 7: Transaction — create member + mark accepted ───
    // Both must succeed or both roll back.
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: session.user.id,
          role: invitation.role,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return member;
    });

    // ─── Step 8: Success ───
    return NextResponse.json(
      {
        message: 'Successfully joined workspace',
        workspace: {
          id: invitation.workspace.id,
          name: invitation.workspace.name,
          slug: invitation.workspace.slug,
        },
        role: result.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[INVITATION_ACCEPT_ERROR]', error);

    // P2002 = unique constraint failed.
    // Shouldn't happen because of Step 6, but race conditions
    // are possible if the user clicks twice quickly.
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You are already a member of this workspace' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}