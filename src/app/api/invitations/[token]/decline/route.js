// -------------------------------------------------------------
// /api/invitations/[token]/decline - Decline Invitation
// -------------------------------------------------------------
//
// PURPOSE:
//   Called from the /invitations page when the user clicks
//   "Decline". Marks the invitation as DECLINED and notifies
//   the inviter.
//
// AUTH: MUST be logged in.
//
// SECURITY CHECK:
//   The logged-in user's email MUST match the invitation's
//   email. Same gate as the accept route.
//
// WHAT HAPPENS:
//   1. Verify invitation exists + is PENDING + not expired
//   2. Verify email match
//   3. Mark invitation as DECLINED (single update, no
//      workspace membership created)
//   4. Fire-and-forget notify the inviter
//   5. Return ok
//
// ERROR CASES:
//   401 - Not logged in
//   404 - Invalid / already handled / expired
//   403 - Wrong email
//
// NOTE:
//   There is no Prisma transaction here — only one DB write
//   (the status update) + a fire-and-forget notification.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/tokens';
import { notifyInvitationEvent } from '@/lib/notifications';

export async function POST(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'You must be logged in to decline an invitation' },
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
      const message =
        invitation.status === 'DECLINED'
          ? 'You already declined this invitation'
          : invitation.status === 'ACCEPTED'
            ? 'You already accepted this invitation'
            : 'This invitation is no longer valid';

      return NextResponse.json(
        { error: message, status: invitation.status },
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

    // ─── Step 5: Email match ───
    const sessionEmail = session.user.email.toLowerCase().trim();
    const inviteEmail = invitation.email.toLowerCase().trim();

    if (sessionEmail !== inviteEmail) {
      return NextResponse.json(
        {
          error:
            'This invitation was sent to a different email address. Log in with the invited email to decline.',
        },
        { status: 403 }
      );
    }

    // ─── Step 6: Mark as DECLINED ───
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });

    // ─── Step 7: Notify the inviter (fire-and-forget) ───
    // The invitation row already has invitedById. We fetch the
    // user's name for a nicer message. Wrapped in try/catch so
    // a notification failure never breaks the decline action.
    try {
      const inviter = await prisma.user.findUnique({
        where: { id: invitation.invitedById },
        select: { id: true },
      });

      if (inviter && inviter.id !== session.user.id) {
        const accepterName =
          session.user.name || session.user.email || 'Someone';

        await notifyInvitationEvent({
          event: 'declined',
          recipientId: inviter.id,
          workspace: invitation.workspace,
          actorName: accepterName,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
          },
        });
      }
    } catch (notifyErr) {
      // Silent — the decline succeeded regardless.
      console.error('[INVITATION_DECLINE_NOTIFY]', notifyErr);
    }

    // ─── Step 8: Success ───
    return NextResponse.json(
      {
        message: 'Invitation declined',
        workspace: {
          id: invitation.workspace.id,
          name: invitation.workspace.name,
          slug: invitation.workspace.slug,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[INVITATION_DECLINE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 }
    );
  }
}