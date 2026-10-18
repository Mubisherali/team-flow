// -------------------------------------------------------------
// /api/onboarding - API for the onboarding wizard
// -------------------------------------------------------------
//
// ACTIONS:
//   - create_workspace
//   - send_invites
//   - create_project
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueSlug } from '@/lib/slug'; // <-- FIXED IMPORT
import { sendEmail } from '@/lib/email';
import { invitationEmail } from '@/lib/email-templates';
import { generateToken, getTokenExpiry } from '@/lib/tokens';
import { DEFAULT_PROJECT_COLOR } from '@/lib/project-colors';
import { notifyInvitationEvent } from '@/lib/notifications'; // <-- ADDED

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ═══════════════════════════════════════════════════════════
    // ACTION 1: CREATE WORKSPACE
    // ═══════════════════════════════════════════════════════════
    if (action === 'create_workspace') {
      const { name, description } = body;
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

      const slug = await generateUniqueSlug(name);

      const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
          data: {
            name,
            slug,
            description: description || null,
            ownerId: session.user.id,
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: ws.id,
            userId: session.user.id,
            role: 'OWNER',
          },
        });

        return ws;
      });

      return NextResponse.json({ workspace });
    }

    // ═══════════════════════════════════════════════════════════
    // ACTION 2: SEND INVITES
    // ═══════════════════════════════════════════════════════════
    if (action === 'send_invites') {
      const { workspaceId, emails } = body;
      
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true, id: true },
      });

      if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

      const inviterName = session.user.name || session.user.email;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const baseUrl = appUrl.replace(/\/$/, '');

      // Fire off emails asynchronously
      Promise.all(
        emails.map(async (email) => {
          const emailLower = email.toLowerCase().trim();
          
          const existing = await prisma.invitation.findFirst({
            where: { workspaceId, email: emailLower, status: 'PENDING' },
          });
          if (existing) return;

          const token = generateToken();
          const expiresAt = getTokenExpiry(7);
          const inviteLink = `${baseUrl}/invite/${token}`;

          const invitation = await prisma.invitation.create({
            data: {
              workspaceId,
              email: emailLower,
              role: 'MEMBER',
              token,
              status: 'PENDING',
              invitedById: session.user.id,
              expiresAt,
            },
          });

          // ─── NOTIFICATION TRIGGER ───
          // Check if the invited email belongs to an existing user
          const existingUser = await prisma.user.findUnique({
            where: { email: emailLower },
            select: { id: true },
          });

          if (existingUser) {
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
          }

          // Send the email
          const emailContent = invitationEmail({
            inviterName,
            workspaceName: workspace.name,
            roleName: 'MEMBER',
            inviteLink,
            expiresInDays: 7,
          });

          await sendEmail({
            to: emailLower,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
        })
      ).catch((err) => console.error('[ONBOARDING_INVITES_ERROR]', err));

      return NextResponse.json({ success: true });
    }

    // ═══════════════════════════════════════════════════════════
    // ACTION 3: CREATE PROJECT
    // ═══════════════════════════════════════════════════════════
    if (action === 'create_project') {
      const { workspaceId, name, color } = body;
      
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

      const project = await prisma.$transaction(async (tx) => {
        const proj = await tx.project.create({
          data: {
            workspaceId,
            name,
            color: color || DEFAULT_PROJECT_COLOR,
          },
        });

        await tx.projectMember.create({
          data: {
            projectId: proj.id,
            userId: session.user.id,
          },
        });

        return proj;
      });

      return NextResponse.json({ project });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[ONBOARDING_API_ERROR]', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}