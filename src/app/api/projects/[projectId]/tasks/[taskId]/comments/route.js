// -------------------------------------------------------------
// /api/projects/[projectId]/tasks/[taskId]/comments
// -------------------------------------------------------------
//
// POST : Create a comment on a task
// GET  : List all comments on a task (chronological)
//
// AUTH:
//   Caller must be able to see the task (project member OR
//   workspace owner/manager). Same check as the task itself.
//
// ORDER:
//   Oldest first — the thread reads top-to-bottom.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace } from '@/lib/permissions';
import { commentContentSchema } from '@/lib/validators/comment';

// -------------------------------------------------------------
// Shared helper — verify task access for the caller.
// Returns { task, role, isPrivileged } or { error }.
// -------------------------------------------------------------
async function loadTaskAccess(projectId, taskId, userId) {
  // Project must exist
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

  // Caller's workspace role
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

  // Non-privileged users must be a project member
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

  // Task must exist and belong to the project
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });

  if (!task || task.projectId !== projectId) {
    return {
      error: NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      ),
    };
  }

  return { task, role, isPrivileged };
}

// =============================================================
// GET — List comments
// =============================================================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId } = await params;

    const access = await loadTaskAccess(projectId, taskId, session.user.id);
    if (access.error) return access.error;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const shaped = comments.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      userId: c.user.id,
      user: {
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        avatarUrl: c.user.avatarUrl,
      },
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      // Was this comment edited after posting?
      isEdited:
        new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() >
        1000, // 1-second tolerance for clock drift
    }));

    return NextResponse.json({ comments: shaped });
  } catch (error) {
    console.error('[COMMENTS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// =============================================================
// POST — Create comment
// =============================================================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId } = await params;

    const access = await loadTaskAccess(projectId, taskId, session.user.id);
    if (access.error) return access.error;

    // Validate body
    const body = await request.json();
    const parsed = commentContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Create
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Comment posted',
        comment: {
          id: comment.id,
          taskId: comment.taskId,
          userId: comment.user.id,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            email: comment.user.email,
            avatarUrl: comment.user.avatarUrl,
          },
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          isEdited: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[COMMENTS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 }
    );
  }
}