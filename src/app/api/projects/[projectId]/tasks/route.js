// -------------------------------------------------------------
// /api/projects/[projectId]/tasks
// -------------------------------------------------------------
//
// GET  : List tasks in the project
// POST : Create a task
//
// AUTH:
//   Both require the caller to be a project member OR an
//   owner/manager of the project's workspace.
//
// SCOPE:
//   Tasks are scoped to a project. `projectId` uniquely
//   identifies the project — the workspace is derived via
//   a lookup. Hence this route isn't nested under /workspaces.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canAssignTo,
} from '@/lib/permissions';
import { createTaskSchema } from '@/lib/validators/task';
import { notifyTaskEvent } from '@/lib/notifications';

// -------------------------------------------------------------
// Shared helper — load project + verify caller access
// -------------------------------------------------------------
// Returns { project, role, isProjectMember } or { error }.
async function loadProjectAccess(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });

  if (!project) {
    return {
      error: NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      ),
    };
  }

  const role = await getMemberRole(userId, project.workspaceId);
  if (!canViewWorkspace(role)) {
    return {
      error: NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      ),
    };
  }

  const isPrivileged = role === 'OWNER' || role === 'MANAGER';
  let isProjectMember = false;

  if (!isPrivileged) {
    const pm = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    isProjectMember = !!pm;

    if (!isProjectMember) {
      return {
        error: NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        ),
      };
    }
  } else {
    isProjectMember = true; // privileged users have implicit access
  }

  return { project, role, isProjectMember };
}

// =============================================================
// GET — List tasks
// =============================================================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const access = await loadProjectAccess(projectId, session.user.id);
    if (access.error) return access.error;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const shaped = tasks.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      labels: t.labels,
      dueDate: t.dueDate,
      assigneeId: t.assigneeId,
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            name: t.assignee.name,
            email: t.assignee.email,
            avatarUrl: t.assignee.avatarUrl,
          }
        : null,
      createdById: t.createdById,
      createdBy: {
        id: t.createdBy.id,
        name: t.createdBy.name,
        email: t.createdBy.email,
      },
      commentCount: t._count.comments,
      order: t.order,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ tasks: shaped });
  } catch (error) {
    console.error('[TASKS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// =============================================================
// POST — Create task
// =============================================================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const access = await loadProjectAccess(projectId, session.user.id);
    if (access.error) return access.error;

    const { role } = access;

    // ─── Validate body ───
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      labels,
    } = parsed.data;

    // ─── Validate assignee ───
    // Two checks:
    //   1. The target user must be a project member.
    //   2. The CALLER must be allowed to assign to that user
    //      (see canAssignTo — members can only self-assign).
    let finalAssigneeId = null;
    if (assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!isMember) {
        return NextResponse.json(
          { error: 'Assignee must be a member of this project' },
          { status: 400 }
        );
      }

      if (
        !canAssignTo({
          role,
          userId: session.user.id,
          targetUserId: assigneeId,
        })
      ) {
        return NextResponse.json(
          { error: 'You can only assign tasks to yourself' },
          { status: 403 }
        );
      }

      finalAssigneeId = assigneeId;
    }

    // ─── Compute `order`: new tasks go to the bottom of their column ───
    const lastInColumn = await prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastInColumn?.order ?? -1) + 1;

    // ─── Create ───
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        status,
        priority,
        assigneeId: finalAssigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels || [],
        createdById: session.user.id,
        order: nextOrder,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    });

      if (finalAssigneeId && finalAssigneeId !== session.user.id) {
      const actorName = session.user.name || session.user.email || 'Someone';
      await notifyTaskEvent({
        task: {
          id: task.id,
          projectId: task.projectId,
          title: task.title,
          assigneeId: task.assigneeId,
          createdById: task.createdById,
        },
        workspaceId: access.project.workspaceId,
        actorId: session.user.id,
        actorName,
        event: 'assigned',
      });
    }

    return NextResponse.json(
      {
        message: 'Task created',
        task: {
          id: task.id,
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          labels: task.labels,
          dueDate: task.dueDate,
          assigneeId: task.assigneeId,
          assignee: task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
                avatarUrl: task.assignee.avatarUrl,
              }
            : null,
          createdById: task.createdById,
          createdBy: {
            id: task.createdBy.id,
            name: task.createdBy.name,
            email: task.createdBy.email,
          },
          commentCount: task._count.comments,
          order: task.order,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[TASKS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}