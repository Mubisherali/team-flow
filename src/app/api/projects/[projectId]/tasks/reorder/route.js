// -------------------------------------------------------------
// /api/projects/[projectId]/tasks/reorder
// -------------------------------------------------------------
//
// PATCH: Bulk reorder tasks after a drag-and-drop.
//
// BODY:
//   { taskId, newStatus, newIndex }
//
// PERMISSIONS:
//   - OWNER/MANAGER  → can move any task to any column
//   - ASSIGNEE/CREATOR → can move own tasks, BUT NOT to DONE
//   - Everyone else  → blocked
//
// WHY THE DONE RESTRICTION:
//   Managers approve work. A member marking their own task as
//   DONE removes the review step. This enforces the workflow.
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

export async function PATCH(request, { params }) {
  try {
    // ─── Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // ─── Project access ───
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

    // Non-privileged users must be a project member
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

    // ─── Validate body ───
    const body = await request.json();
    const parsed = reorderTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { taskId, newStatus, newIndex } = parsed.data;

    // ─── Confirm the task belongs to this project ───
    const movingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
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

    // ─── Workflow permission check ───
    // Same rule as PATCH /tasks/[taskId] and the client-side check.
    if (
      !canMoveTaskTo({
        role,
        userId: session.user.id,
        task: movingTask,
        newStatus,
      })
    ) {
      // Give a helpful, specific error.
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

    // ─── Fetch all tasks in the project ───
    const allTasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true, status: true, order: true, createdAt: true },
    });

    // ─── Compute the updates ───
    const updates = computeReorder(allTasks, taskId, newStatus, newIndex);

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes' });
    }

    // ─── Apply in a transaction ───
    await prisma.$transaction(
      updates.map((u) =>
        prisma.task.update({
          where: { id: u.id },
          data: {
            order: u.order,
            ...(u.status ? { status: u.status } : {}),
          },
        })
      )
    );

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