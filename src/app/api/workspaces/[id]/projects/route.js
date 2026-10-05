// -------------------------------------------------------------
// /api/workspaces/[id]/projects - Projects Collection
// -------------------------------------------------------------
//
// ENDPOINTS:
//   POST /api/workspaces/:id/projects
//     - Create a new project inside the workspace
//     - Auth: owner or manager
//     - Creator is automatically added as a project member
//
//   GET /api/workspaces/:id/projects
//     - List all projects the current user can see
//     - Auth: any workspace member
//     - Owners/managers see ALL projects in the workspace
//     - Members see only projects they belong to
//
// RESPONSE SHAPES:
//   POST → { message, project }
//   GET  → { projects: [...] }
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canCreateProjects,
} from '@/lib/permissions';
import { createProjectSchema } from '@/lib/validators/project';
import { DEFAULT_PROJECT_COLOR } from '@/lib/project-colors';

// =============================================================
// GET — List projects
// =============================================================
export async function GET(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // ─── Step 2: Must be a workspace member ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canViewWorkspace(role)) {
      // 404 — don't reveal the workspace exists.
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Step 3: Build the query filter ───
    // Owners and managers see ALL projects in the workspace.
    // Regular members see ONLY projects they belong to.
    const isPrivileged = role === 'OWNER' || role === 'MANAGER';

    const where = isPrivileged
      ? { workspaceId }
      : {
          workspaceId,
          members: { some: { userId: session.user.id } },
        };

    // ─── Step 4: Fetch ───
    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: { members: true, tasks: true },
        },
        // Include the current user's membership in each project
        // (so the UI can show whether they're a member).
        members: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ─── Step 5: Shape for the client ───
    const shaped = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color || DEFAULT_PROJECT_COLOR,
      memberCount: p._count.members,
      taskCount: p._count.tasks,
      isMember: p.members.length > 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ projects: shaped });
  } catch (error) {
    console.error('[PROJECTS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// =============================================================
// POST — Create project
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
    if (!canCreateProjects(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create projects' },
        { status: 403 }
      );
    }

    // ─── Step 3: Validate body ───
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, color } = parsed.data;

    // ─── Step 4: Confirm workspace exists ───
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Step 5: Transaction — create project + auto-add creator ───
    // Both operations must succeed together, otherwise we'd end
    // up with an orphan project the creator isn't a member of.
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          workspaceId,
          name,
          description: description || null,
          color: color || DEFAULT_PROJECT_COLOR,
        },
      });

      // Auto-add the creator as a project member.
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: session.user.id,
        },
      });

      return newProject;
    });

    // ─── Step 6: Respond ───
    return NextResponse.json(
      {
        message: 'Project created',
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          color: project.color,
          memberCount: 1, // creator only
          taskCount: 0,
          isMember: true,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[PROJECTS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}