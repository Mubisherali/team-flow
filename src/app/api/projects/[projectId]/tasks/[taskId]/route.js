// -------------------------------------------------------------
// /api/projects/[projectId]/tasks/[taskId]
// -------------------------------------------------------------
//
// GET    : Fetch one task
// PATCH  : Update a task
// DELETE : Delete a task
//
// AUTH:
//   GET    — any project member / workspace owner / manager
//   PATCH  — owner/manager OR (member who is the assignee
//            or the creator of the task) — "canMutateTask"
//   DELETE — owner/manager ONLY (strict role gate)
//
// COMPLETED AT:
//   When status changes to DONE, we set `completedAt = now()`.
//   When status changes AWAY from DONE, we clear it back to null.
//   This powers the velocity and burndown charts.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canAssignTo,
  canMoveTaskTo,
} from '@/lib/permissions';
import { updateTaskSchema } from '@/lib/validators/task';
import {
  notifyTaskEvent,
  notifyReviewSubmitted,
} from '@/lib/notifications';
import { statusMeta } from '@/lib/task-constants';

async function loadContext(projectId, taskId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });

  if (!project) {
    return {
      error: NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      ),
    };
  }

  const role = await getMemberRole(userId, project.workspaceId);
  if (!canViewWorkspace(role)) {
    return {
      error: NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      ),
    };
  }

  const isPrivileged = role === 'OWNER' || role === 'MANAGER';

  if (!isPrivileged) {
    const pm = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!pm) {
      return {
        error: NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        ),
      };
    }
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
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

  if (!task || task.projectId !== projectId) {
    return {
      error: NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      ),
    };
  }

  return { project, task, role, isPrivileged };
}

function canMutateTask({ task, userId, isPrivileged }) {
  if (isPrivileged) return true;
  if (task.assigneeId === userId) return true;
  if (task.createdById === userId) return true;
  return false;
}

function shapeTask(task) {
  return {
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
    completedAt: task.completedAt, // ✅ Added
  };
}

// =============================================================
// GET — Fetch one task
// =============================================================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const ctx = await loadContext(projectId, taskId, session.user.id);
    if (ctx.error) return ctx.error;

    return NextResponse.json({ task: shapeTask(ctx.task) });
  } catch (error) {
    console.error('[TASK_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH — Update task (with completedAt logic)
// =============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const ctx = await loadContext(projectId, taskId, session.user.id);
    if (ctx.error) return ctx.error;

    if (
      !canMutateTask({
        task: ctx.task,
        userId: session.user.id,
        isPrivileged: ctx.isPrivileged,
      })
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this task' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
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

    if (status !== undefined && status !== ctx.task.status) {
      const canMove = canMoveTaskTo({
        role: ctx.role,
        userId: session.user.id,
        task: ctx.task,
        newStatus: status,
      });

      if (!canMove) {
        if (!ctx.isPrivileged && status === 'DONE') {
          return NextResponse.json(
            {
              error:
                'Only managers can move tasks to Done. Move it to Review for approval.',
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: 'You cannot change this task’s status' },
          { status: 403 }
        );
      }
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (priority !== undefined) data.priority = priority;

    // ─── Status + completedAt logic ───
    if (status !== undefined) {
      data.status = status;
      
      // If moving TO Done, set completedAt
      if (status === 'DONE') {
        data.completedAt = new Date();
      } 
      // If moving AWAY from Done, clear completedAt
      else if (ctx.task.status === 'DONE') {
        data.completedAt = null;
      }
    }

    if (assigneeId !== undefined) {
      if (assigneeId === '' || assigneeId === null) {
        data.assigneeId = null;
      } else {
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
            role: ctx.role,
            userId: session.user.id,
            targetUserId: assigneeId,
          })
        ) {
          return NextResponse.json(
            { error: 'You can only assign tasks to yourself' },
            { status: 403 }
          );
        }

        data.assigneeId = assigneeId;
      }
    }

    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (labels !== undefined) {
      data.labels = labels;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const originalAssigneeId = ctx.task.assigneeId || null;
    const originalStatus = ctx.task.status;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
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

    const actorName = session.user.name || session.user.email || 'Someone';
    const notifyBase = {
      task: {
        id: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        assigneeId: updated.assigneeId,
        createdById: updated.createdById,
      },
      workspaceId: ctx.project.workspaceId,
      actorId: session.user.id,
      actorName,
    };

    const newAssigneeId = updated.assigneeId || null;
    if (newAssigneeId && newAssigneeId !== originalAssigneeId) {
      await notifyTaskEvent({ ...notifyBase, event: 'reassigned' });
    }

    if (updated.status !== originalStatus) {
      await notifyTaskEvent({
        ...notifyBase,
        event: 'status_changed',
        extra: { statusLabel: statusMeta(updated.status).label },
      });

      // ─── Notify managers when a MEMBER moves to REVIEW ───
      if (updated.status === 'REVIEW' && !ctx.isPrivileged) {
        await notifyReviewSubmitted({
          task: {
            id: updated.id,
            projectId: updated.projectId,
            title: updated.title,
          },
          workspaceId: ctx.project.workspaceId,
          actorId: session.user.id,
          actorName,
          actorIsPrivileged: false,
        });
      }
    }

    return NextResponse.json({
      message: 'Task updated',
      task: shapeTask(updated),
    });
  } catch (error) {
    console.error('[TASK_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE — Delete task (strict: owner/manager only)
// =============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const ctx = await loadContext(projectId, taskId, session.user.id);
    if (ctx.error) return ctx.error;

    if (!ctx.isPrivileged) {
      return NextResponse.json(
        { error: 'Only workspace owners or managers can delete tasks.' },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('[TASK_DELETE_ERROR]', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}