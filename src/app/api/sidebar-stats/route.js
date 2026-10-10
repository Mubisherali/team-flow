// -------------------------------------------------------------
// GET /api/sidebar-stats
// -------------------------------------------------------------
//
// QUERY PARAMS:
//   workspaceId : string (required)
//   projectId   : string (optional)
//
// RETURNS:
//   {
//     stats: {
//       projectCount?,
//       openTasks,
//       doneTasks,
//       memberCount,
//     }
//   }
//
// If projectId is provided, stats are project-scoped.
// Otherwise they're workspace-scoped.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace } from '@/lib/permissions';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // ─── Access check ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canViewWorkspace(role)) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Project-scoped stats ───
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true },
      });

      if (!project || project.workspaceId !== workspaceId) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      const [memberCount, openTasks, doneTasks] = await Promise.all([
        prisma.projectMember.count({ where: { projectId } }),
        prisma.task.count({
          where: {
            projectId,
            status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
          },
        }),
        prisma.task.count({
          where: { projectId, status: 'DONE' },
        }),
      ]);

      return NextResponse.json({
        stats: { memberCount, openTasks, doneTasks },
      });
    }

    // ─── Workspace-scoped stats ───
    const [projectCount, memberCount, openTasks, doneTasks] =
      await Promise.all([
        prisma.project.count({ where: { workspaceId } }),
        prisma.workspaceMember.count({ where: { workspaceId } }),
        prisma.task.count({
          where: {
            project: { workspaceId },
            status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
          },
        }),
        prisma.task.count({
          where: {
            project: { workspaceId },
            status: 'DONE',
          },
        }),
      ]);

    return NextResponse.json({
      stats: { projectCount, memberCount, openTasks, doneTasks },
    });
  } catch (error) {
    console.error('[SIDEBAR_STATS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch sidebar stats' },
      { status: 500 }
    );
  }
}