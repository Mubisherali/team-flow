// -------------------------------------------------------------
// /api/invitations/mine - Pending invites for the current user
// -------------------------------------------------------------
//
// PURPOSE:
//   Returns all PENDING invitations where the invitation's
//   email matches the logged-in user's email. Used by the
//   /invitations page so users can accept/decline in-app
//   without needing the email link.
//
// AUTH:
//   Must be logged in. Returns an empty array for logged-out
//   visitors (the page handles its own auth UX).
//
// RESPONSE:
//   {
//     invitations: [
//       {
//         id, email, role, status, expiresAt, createdAt,
//         token,              // needed for accept/decline calls
//         inviteLink,         // for optional "copy link"
//         workspace: { id, name, slug },
//         invitedBy: { id, name, email, avatarUrl }
//       }
//     ]
//   }
//
// FILTERS:
//   - Only PENDING
//   - Only non-expired (expired ones get lazily flipped
//     to EXPIRED like the accept route does)
//   - Ordered by newest first
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/tokens';

export async function GET() {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      // Not an error — the page handles the logged-out case.
      return NextResponse.json({ invitations: [] });
    }

    const userEmail = session.user.email.toLowerCase().trim();

    // ─── Step 2: Fetch pending invitations ───
    const invitations = await prisma.invitation.findMany({
      where: {
        email: userEmail,
        status: 'PENDING',
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ─── Step 3: Lazy-expire any that are past their date ───
    // We don't return expired invites, and we flip their
    // status in the DB so future queries filter them out fast.
    const now = Date.now();
    const expired = [];
    const live = [];

    for (const inv of invitations) {
      if (isTokenExpired(inv.expiresAt)) {
        expired.push(inv.id);
      } else {
        live.push(inv);
      }
    }

    if (expired.length > 0) {
      try {
        await prisma.invitation.updateMany({
          where: { id: { in: expired } },
          data: { status: 'EXPIRED' },
        });
      } catch (err) {
        // Non-fatal — we already excluded them from the response.
        console.error('[INVITATIONS_MINE_EXPIRE]', err);
      }
    }

    // ─── Step 4: Build the invite link for each ───
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = appUrl.replace(/\/$/, '');

    // ─── Step 5: Shape for the client ───
    const shaped = live.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      token: inv.token,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      inviteLink: `${baseUrl}/invite/${inv.token}`,
      workspace: inv.workspace,
      invitedBy: inv.invitedBy,
    }));

    return NextResponse.json({ invitations: shaped });
  } catch (error) {
    console.error('[INVITATIONS_MINE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to load invitations' },
      { status: 500 }
    );
  }
}