// -------------------------------------------------------------
// /api/workspaces/[id]/projects/[projectId]/members
// -------------------------------------------------------------
//
// GET  : List all project members (with user details)
// POST : Add a workspace member to the project
//
// AUTHORIZATION:
//   GET  - workspace members who are project members,
//          OR workspace owners/managers
//   POST - workspace owners/managers only
//
// INVARIANT:
//   Only workspace members can be added to a project. A user
//   cannot be a project member without being in the workspace.
//
// NOTIFICATIONS (POST only):
//   On successful add, the added user gets an
//   INVITATION-style project notification so their bell lights
//   up. Fire-and-forget — never breaks the add operation.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canManageProjectMembers,
} from '@/lib/permissions';
import { addProjectMemberSchema } from '@/lib/validators/project';
import { notifyProjectEvent } from '@/lib/notifications';

// =============================================================
// GET — List project members
// =============================================================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, projectId } = await params;

    // Workspace membership check
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canViewWorkspace(role)) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Confirm project belongs to this workspace
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true },
    });

    if (!project || project.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Regular members must be a project member to see the list.
    const isPrivileged = role === 'OWNER' || role === 'MANAGER';
    if (!isPrivileged) {
      const isProjectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
      });
      if (!isProjectMember) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // Fetch members + user details
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { addedAt: 'asc' },
    });

    const shaped = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      addedAt: m.addedAt,
    }));

    return NextResponse.json({ members: shaped });
  } catch (error) {
    console.error('[PROJECT_MEMBERS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch project members' },
      { status: 500 }
    );
  }
}

// =============================================================
// POST — Add a workspace member to the project
// =============================================================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, projectId } = await params;

    // Role check: owner or manager of the workspace
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canManageProjectMembers(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage project members' },
        { status: 403 }
      );
    }

    // Validate body
    const body = await request.json();
    const parsed = addProjectMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;

    // Confirm project belongs to this workspace.
    // Also fetch name + workspace name for the notification message.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project || project.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // ⚠️ KEY INVARIANT — the target user must be a workspace member
    const workspaceMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMembership) {
      return NextResponse.json(
        {
          error:
            'Only workspace members can be added to a project. Invite them to the workspace first.',
        },
        { status: 400 }
      );
    }

    // Check not already a project member
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This user is already a project member' },
        { status: 409 }
      );
    }

    // Create the membership
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // ─── Notify the added user (fire-and-forget) ───
    // Wrapped in try/catch so a notification failure never
    // breaks the add operation.
    try {
      const actorName =
        session.user.name || session.user.email || 'Someone';

      await notifyProjectEvent({
        event: 'member_added',
        recipientId: userId,
        actorId: session.user.id,
        actorName,
        workspace: project.workspace,
        project: { id: project.id, name: project.name },
      });
    } catch (notifyErr) {
      console.error('[PROJECT_MEMBER_NOTIFY]', notifyErr);
    }

    return NextResponse.json(
      {
        message: 'Member added to project',
        member: {
          id: member.id,
          userId: member.user.id,
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
          addedAt: member.addedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[PROJECT_MEMBERS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to add project member' },
      { status: 500 }
    );
  }
}