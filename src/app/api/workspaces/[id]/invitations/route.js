// -------------------------------------------------------------
// /api/workspaces/[id]/invitations - Invitation Collection
// -------------------------------------------------------------
//
// ENDPOINTS:
//   POST /api/workspaces/:id/invitations
//     - Create an invitation + send email + notify existing
//       users via the bell
//     - Auth: owner or manager
//
//   GET /api/workspaces/:id/invitations
//     - List PENDING invitations for this workspace
//     - Auth: owner or manager
//
// NOTES:
//   - Invitations expire after 7 days (see src/lib/tokens.js)
//   - Duplicate prevention: no invite if email already a member
//     or already has a pending invite for this workspace
//   - If the invited email matches an EXISTING user account,
//     we create an INVITATION_RECEIVED notification so their
//     bell lights up immediately. Users without accounts get
//     the invite when they sign up (see auth.js in Batch 6).
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canInviteMembers } from '@/lib/permissions';
import { generateToken, getTokenExpiry } from '@/lib/tokens';
import { sendEmail } from '@/lib/email';
import { invitationEmail } from '@/lib/email-templates';
import { createInvitationSchema } from '@/lib/validators/invitation';
import { notifyInvitationEvent } from '@/lib/notifications';

// =============================================================
// POST /api/workspaces/:id/invitations
// =============================================================
export async function POST(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // ─── Step 2: Role check (owner or manager) ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canInviteMembers(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      );
    }

    // ─── Step 3: Validate body ───
    const body = await request.json();
    const parsed = createInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const inviteRole = parsed.data.role;

    // ─── Step 4: Fetch workspace (need name for the email) ───
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Step 5: Prevent inviting existing members ───
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id,
          },
        },
      });

      if (alreadyMember) {
        return NextResponse.json(
          { error: 'This person is already a member of the workspace' },
          { status: 409 }
        );
      }
    }

    // ─── Step 6: Prevent duplicate PENDING invites ───
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        workspaceId,
        email,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'There is already a pending invitation for this email' },
        { status: 409 }
      );
    }

    // ─── Step 7: Generate token + expiry ───
    const token = generateToken();
    const expiresAt = getTokenExpiry(7);

    // ─── Step 8: Create the invitation ───
    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role: inviteRole,
        token,
        status: 'PENDING',
        invitedById: session.user.id,
        expiresAt,
      },
    });

    // ─── Step 9: Build the invite link ───
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl.replace(/\/$/, '')}/invite/${token}`;

    // ─── Step 9.5: Notify existing user (fire-and-forget) ───
    // If the invited email matches an EXISTING account, create
    // an INVITATION_RECEIVED notification so the bell lights up
    // immediately. Users who haven't signed up yet get the
    // notification when they do (see auth.js).
    //
    // Wrapped in try/catch — a notification failure must never
    // break the invite-creation flow.
    if (existingUser) {
      try {
        const inviterName = session.user.name || session.user.email || 'Someone';

        await notifyInvitationEvent({
          event: 'received',
          recipientId: existingUser.id,
          workspace: { id: workspace.id, name: workspace.name },
          actorName: inviterName,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
          },
        });
      } catch (notifyErr) {
        console.error('[INVITATION_NOTIFY_RECEIVED]', notifyErr);
      }
    }

    // ─── Step 10: Send email (best-effort) ───
    const inviterName = session.user.name || session.user.email;

    const emailContent = invitationEmail({
      inviterName,
      workspaceName: workspace.name,
      roleName: inviteRole,
      inviteLink,
      expiresInDays: 7,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // ─── Step 11: Respond ───
    const response = {
      message: 'Invitation created',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
      inviteLink,
    };

    if (emailResult.error) {
      response.warning = `Email could not be sent: ${emailResult.error}. Share the link manually.`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[INVITATION_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// =============================================================
// GET /api/workspaces/:id/invitations
// =============================================================
// Lists all PENDING invitations for the workspace.
// Expired ones are filtered out automatically.
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canInviteMembers(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations' },
        { status: 403 }
      );
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = appUrl.replace(/\/$/, '');

    const shaped = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      invitedBy: inv.invitedBy,
      inviteLink: `${baseUrl}/invite/${inv.token}`,
    }));

    return NextResponse.json({ invitations: shaped });
  } catch (error) {
    console.error('[INVITATION_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}