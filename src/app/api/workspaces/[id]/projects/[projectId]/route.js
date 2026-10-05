// -------------------------------------------------------------
// /api/workspaces/[id]/projects/[projectId] - Single Project
// -------------------------------------------------------------
//
// GET    : Fetch a project the current user can view
// PATCH  : Update name / description / color
// DELETE : Delete the project (and cascade tasks/comments)
//
// AUTHORIZATION:
//   GET    - workspace members who are also project members,
//            OR owners/managers of the workspace
//   PATCH  - owner or manager of the workspace
//   DELETE - owner or manager of the workspace
//
// Because a project belongs to a workspace, all role checks
// use getMemberRole(workspaceId) — the actor's workspace role.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canEditProject,
  canDeleteProject,
} from '@/lib/permissions';
import { updateProjectSchema } from '@/lib/validators/project';

// =============================================================
// Shared helper — fetch project + verify access
// =============================================================
// Returns { project, role } on success.
// Returns { error: NextResponse } on failure.
// Using a helper avoids repeating the same 5 checks 3 times.
async function loadProjectWithAccess(workspaceId, projectId, userId) {
  // 1. Must be a workspace member at all.
  const role = await getMemberRole(userId, workspaceId);
  if (!canViewWorkspace(role)) {
    return {
      error: NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      ),
    };
  }

  // 2. Fetch the project + confirm it belongs to this workspace.
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: { members: true, tasks: true },
      },
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!project || project.workspaceId !== workspaceId) {
    return {
      error: NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      ),
    };
  }

  // 3. Regular members can only see projects they belong to.
  const isPrivileged = role === 'OWNER' || role === 'MANAGER';
  const isMember = project.members.length > 0;

  if (!isPrivileged && !isMember) {
    return {
      error: NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      ),
    };
  }

  return { project, role, isMember };
}

// =============================================================
// GET — Fetch one project
// =============================================================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, projectId } = await params;

    const result = await loadProjectWithAccess(
      workspaceId,
      projectId,
      session.user.id
    );

    if (result.error) return result.error;

    const { project, role, isMember } = result;

    return NextResponse.json({
      project: {
        id: project.id,
        workspaceId: project.workspaceId,
        name: project.name,
        description: project.description,
        color: project.color,
        memberCount: project._count.members,
        taskCount: project._count.tasks,
        isMember,
        role, // the current user's workspace role
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('[PROJECT_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH — Update project
// =============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, projectId } = await params;

    // ─── Role check: owner or manager ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canEditProject(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this project' },
        { status: 403 }
      );
    }

    // ─── Confirm project exists and belongs to this workspace ───
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true },
    });

    if (!existing || existing.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // ─── Validate body ───
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ─── Build partial update payload ───
    const data = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      data.description = parsed.data.description || null;
    }
    if (parsed.data.color !== undefined) data.color = parsed.data.color;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // ─── Update ───
    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    return NextResponse.json({
      message: 'Project updated',
      project: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        color: updated.color,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('[PROJECT_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE — Delete project
// =============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, projectId } = await params;

    // ─── Role check ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canDeleteProject(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }

    // ─── Confirm project exists and belongs to this workspace ───
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true },
    });

    if (!existing || existing.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // ─── Delete ───
    // Thanks to onDelete: Cascade on ProjectMember and Task,
    // this removes related rows automatically.
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('[PROJECT_DELETE_ERROR]', error);

    // P2025 = "record not found" — already gone.
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}