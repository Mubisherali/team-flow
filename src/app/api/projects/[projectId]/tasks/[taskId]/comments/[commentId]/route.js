import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canEditComment,
  canDeleteComment,
} from '@/lib/permissions';
import { commentContentSchema } from '@/lib/validators/comment';

// -------------------------------------------------------------
// Load task access + the specific comment in one helper.
// Returns { comment, role, isPrivileged } or { error }.
// -------------------------------------------------------------
async function loadCommentContext(projectId, taskId, commentId, userId) {
  // Project exists?
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });

  if (!project) {
    return { error: notFound() };
  }

  // Caller's workspace role
  const role = await getMemberRole(userId, project.workspaceId);
  if (!canViewWorkspace(role)) {
    return { error: notFound() };
  }

  const isPrivileged = role === 'OWNER' || role === 'MANAGER';

  // Non-privileged users must be a project member
  if (!isPrivileged) {
    const pm = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!pm) {
      return { error: notFound() };
    }
  }

  // Task exists and belongs to this project?
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });

  if (!task || task.projectId !== projectId) {
    return { error: notFound() };
  }

  // Comment exists and belongs to this task?
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, taskId: true, userId: true, content: true },
  });

  if (!comment || comment.taskId !== taskId) {
    return { error: notFound() };
  }

  return { comment, role, isPrivileged };
}

function notFound() {
  return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
}

// =============================================================
// PATCH — Edit a comment
// =============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId, commentId } = await params;

    const ctx = await loadCommentContext(
      projectId,
      taskId,
      commentId,
      session.user.id
    );
    if (ctx.error) return ctx.error;

    // Only the author can edit
    if (
      !canEditComment({
        userId: session.user.id,
        comment: ctx.comment,
      })
    ) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Validate body
    const body = await request.json();
    const parsed = commentContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // No-op check — if the content is identical, skip the write
    if (parsed.data.content === ctx.comment.content) {
      return NextResponse.json({ message: 'No changes' });
    }

    // Update
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Comment updated',
      comment: {
        id: updated.id,
        taskId: updated.taskId,
        userId: updated.user.id,
        user: {
          id: updated.user.id,
          name: updated.user.name,
          email: updated.user.email,
          avatarUrl: updated.user.avatarUrl,
        },
        content: updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        isEdited: true, // we just changed it
      },
    });
  } catch (error) {
    console.error('[COMMENT_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE — Delete a comment
// =============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, taskId, commentId } = await params;

    const ctx = await loadCommentContext(
      projectId,
      taskId,
      commentId,
      session.user.id
    );
    if (ctx.error) return ctx.error;

    // Author OR privileged can delete
    if (
      !canDeleteComment({
        role: ctx.role,
        userId: session.user.id,
        comment: ctx.comment,
      })
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('[COMMENT_DELETE_ERROR]', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}