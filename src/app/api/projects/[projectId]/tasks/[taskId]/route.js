// -------------------------------------------------------------
// /api/projects/[projectId]/tasks/[taskId]
// -------------------------------------------------------------
//
// GET    : Fetch one task
// PATCH  : Update a task
// DELETE : Delete a task
//
// AUTH:
//   GET    - any project member / workspace owner / manager
//   PATCH  - owner/manager OR (member who is the assignee
//            or the creator of the task)
//   DELETE - same as PATCH
//
// WORKFLOW RULE:
//   Only owners/managers can move a task to DONE. Members must
//   submit via REVIEW. Enforced via canMoveTaskTo() when the
//   status field changes.
//
// PERMISSION NOTE:
//   PATCH/DELETE use a CONTEXT-AWARE check — the caller's
//   ability depends on the specific task, not just their role.
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
import { notifyTaskEvent } from '@/lib/notifications';
import { statusMeta } from '@/lib/task-constants';

// -------------------------------------------------------------
// Load project + task + caller's role in one go.
// -------------------------------------------------------------
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

  // Non-privileged users must be a project member to see the task.
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

// Can this user edit/delete this specific task?
function canMutateTask({ task, userId, isPrivileged }) {
  if (isPrivileged) return true;
  if (task.assigneeId === userId) return true;
  if (task.createdById === userId) return true;
  return false;
}

// -------------------------------------------------------------
// Shape a task for the API response
// -------------------------------------------------------------
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
// PATCH — Update task
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

    // Base permission: can this user edit this task at all?
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

    // Validate body
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

    // ─── Workflow check: only when status is actually changing ───
    // Members can move their own tasks around, but not INTO Done.
    // Only owners/managers can approve and complete.
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

    // Build partial update payload
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;

    // Assignee: '' or null clears it
    if (assigneeId !== undefined) {
      if (assigneeId === '' || assigneeId === null) {
        data.assigneeId = null;
      } else {
        // Must be a project member
        const isMember = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: assigneeId } },
        });
        if (!isMember) {
          return NextResponse.json(
            { error: 'Assignee must be a member of this project' },
            { status: 400 }
          );
        }

        // Caller must be allowed to assign to that target
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

    // ─── Capture original values for notification diffing ───
    // We need to know what changed, so we snapshot before update.
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

    // ─── Fire notifications for what changed ───
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

    // Trigger A: assignee changed → notify the new assignee
    const newAssigneeId = updated.assigneeId || null;
    if (newAssigneeId && newAssigneeId !== originalAssigneeId) {
      await notifyTaskEvent({ ...notifyBase, event: 'reassigned' });
    }

    // Trigger B: status changed → notify assignee + creator
    if (updated.status !== originalStatus) {
      await notifyTaskEvent({
        ...notifyBase,
        event: 'status_changed',
        extra: { statusLabel: statusMeta(updated.status).label },
      });
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
// DELETE — Delete task
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

    if (
      !canMutateTask({
        task: ctx.task,
        userId: session.user.id,
        isPrivileged: ctx.isPrivileged,
      })
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this task' },
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