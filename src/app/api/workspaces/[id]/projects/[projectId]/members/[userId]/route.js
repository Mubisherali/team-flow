// -------------------------------------------------------------
// /api/workspaces/[id]/projects/[projectId]/members/[userId]
// -------------------------------------------------------------
//
// DELETE: Remove a member from a project.
//
// AUTHORIZATION:
//   Workspace owner or manager only.
//
// GUARDS:
//   - Cannot remove yourself via this endpoint (only the
//     manage-members flow should remove people; you can't
//     accidentally lock yourself out of a project you created)
//   - The project must belong to the URL's workspace
//
// WHAT HAPPENS ON REMOVAL:
//   The user's ProjectMember row is deleted. If they had tasks
//   assigned in this project, those task.assigneeId references
//   will be set to NULL (see schema: onDelete: SetNull).
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canManageProjectMembers,
} from '@/lib/permissions';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, projectId, userId: targetUserId } = await params;

    // Role check
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canManageProjectMembers(role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage project members' },
        { status: 403 }
      );
    }

    // Can't remove yourself this way (future: "leave project")
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from a project' },
        { status: 400 }
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

    // Confirm the target is actually a project member
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'This user is not a member of the project' },
        { status: 404 }
      );
    }

       // Delete the membership AND unassign their tasks in this project.
    // Both operations in one transaction so state stays consistent.
    await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          projectId,
          assigneeId: targetUserId,
        },
        data: { assigneeId: null },
      }),
      prisma.projectMember.delete({
        where: { id: membership.id },
      }),
    ]);

    return NextResponse.json({ message: 'Member removed from project' });
  } catch (error) {
    console.error('[PROJECT_MEMBERS_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to remove project member' },
      { status: 500 }
    );
  }
}