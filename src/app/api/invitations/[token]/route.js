// -------------------------------------------------------------
// /api/invitations/[token] - Verify Invitation Token
// -------------------------------------------------------------
//
// PURPOSE:
// Called by the /invite/[token] page to check if the token
// is valid and get details about the invitation.
//
// PUBLIC ENDPOINT (no auth required):
// The token itself is the "authentication". Only the person
// with a valid 256-bit random token can call this successfully.
//
// WHAT IT RETURNS ON SUCCESS (200):
//   {
//     invitation: {
//       id, email, role, expiresAt,
//       workspace: { id, name, slug },
//       inviter:   { name, email },
//     }
//   }
//
// WHAT IT RETURNS ON FAILURE:
//   - 404 "Invalid invitation"   → token not found in DB
//   - 404 "Invitation no longer valid" → already accepted/revoked
//   - 410 "Invitation has expired" → past expiresAt
//     (410 = Gone — the right code for "expired resource")
//
// SIDE EFFECTS:
//   - If the invitation is PENDING but expired, we mark it
//     as EXPIRED in the DB so future checks are fast.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/tokens';

export async function GET(request, { params }) {
  try {
    // ─── Step 1: Get token from URL ───
    const { token } = await params;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // ─── Step 2: Look up the invitation ───
    // `token` is @unique in the schema → findUnique is fast.
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // ─── Step 3: Check status ───
    // Only PENDING invitations can be verified. Anything else
    // (ACCEPTED, REVOKED, EXPIRED) means the link no longer works.
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

    // ─── Step 4: Check expiry ───
    if (isTokenExpired(invitation.expiresAt)) {
      // Lazily mark it as EXPIRED so future lookups short-circuit
      // at Step 3.
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'This invitation has expired', status: 'EXPIRED' },
        { status: 410 }
      );
    }

    // ─── Step 5: Return the invitation details ───
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        workspace: {
          id: invitation.workspace.id,
          name: invitation.workspace.name,
          slug: invitation.workspace.slug,
        },
        inviter: {
          name: invitation.invitedBy.name || invitation.invitedBy.email,
          email: invitation.invitedBy.email,
        },
      },
    });
  } catch (error) {
    console.error('[INVITATION_VERIFY_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}