// -------------------------------------------------------------
// /api/projects/[projectId]/tasks/reorder
// -------------------------------------------------------------
//
// PATCH: Bulk reorder tasks after a drag-and-drop.
//
// COMPLETED AT:
//   If dragged to DONE, sets completedAt = now().
//   If dragged out of DONE, clears completedAt to null.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canMoveTaskTo,
} from '@/lib/permissions';
import { reorderTaskSchema } from '@/lib/validators/task';
import { computeReorder } from '@/lib/kanban';
import { statusMeta } from '@/lib/task-constants';
import {
  notifyTaskEvent,
  notifyReviewSubmitted,
} from '@/lib/notifications';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const role = await getMemberRole(session.user.id, project.workspaceId);
    if (!canViewWorkspace(role)) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isPrivileged = role === 'OWNER' || role === 'MANAGER';

    if (!isPrivileged) {
      const pm = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: session.user.id },
        },
      });
      if (!pm) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    const body = await request.json();
    const parsed = reorderTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { taskId, newStatus, newIndex } = parsed.data;

    const movingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        title: true,
        status: true,
        assigneeId: true,
        createdById: true,
      },
    });

    if (!movingTask || movingTask.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (
      !canMoveTaskTo({
        role,
        userId: session.user.id,
        task: movingTask,
        newStatus,
      })
    ) {
      if (!isPrivileged && newStatus === 'DONE') {
        return NextResponse.json(
          {
            error:
              'Only managers can move tasks to Done. Move it to Review for approval.',
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'You can only move your own tasks' },
        { status: 403 }
      );
    }

    const originalStatus = movingTask.status;

    const allTasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true, status: true, order: true, createdAt: true },
    });

    const updates = computeReorder(allTasks, taskId, newStatus, newIndex);

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes' });
    }

    // ─── Apply in a transaction (now with completedAt) ───
    await prisma.$transaction(
      updates.map((u) => {
        const data = { order: u.order };
        
        if (u.status) {
          data.status = u.status;
          
          // Only the moving task needs completedAt logic
          if (u.id === taskId) {
            if (newStatus === 'DONE') {
              data.completedAt = new Date();
            } else if (originalStatus === 'DONE') {
              data.completedAt = null;
            }
          }
        }

        return prisma.task.update({
          where: { id: u.id },
          data,
        });
      })
    );

    if (newStatus !== originalStatus) {
      const actorName =
        session.user.name || session.user.email || 'Someone';

      try {
        await notifyTaskEvent({
          task: {
            id: movingTask.id,
            projectId: movingTask.projectId,
            title: movingTask.title,
            assigneeId: movingTask.assigneeId,
            createdById: movingTask.createdById,
          },
          workspaceId: project.workspaceId,
          actorId: session.user.id,
          actorName,
          event: 'status_changed',
          extra: { statusLabel: statusMeta(newStatus).label },
        });

        if (newStatus === 'REVIEW' && !isPrivileged) {
          await notifyReviewSubmitted({
            task: {
              id: movingTask.id,
              projectId: movingTask.projectId,
              title: movingTask.title,
            },
            workspaceId: project.workspaceId,
            actorId: session.user.id,
            actorName,
            actorIsPrivileged: false,
          });
        }
      } catch (notifyErr) {
        console.error('[TASKS_REORDER_NOTIFY]', notifyErr);
      }
    }

    return NextResponse.json({
      message: 'Tasks reordered',
      updated: updates.length,
    });
  } catch (error) {
    console.error('[TASKS_REORDER_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}