// -------------------------------------------------------------
// /api/search - Global search for the Command Palette
// -------------------------------------------------------------
//
// QUERY PARAMS:
//   q : string (the search term)
//
// RETURNS:
//   { tasks: [], projects: [], workspaces: [] }
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ tasks: [], projects: [], workspaces: [] });
    }

    // Prisma's "insensitive" mode is PostgreSQL-only.
    const searchFilter = {
      contains: query,
      mode: 'insensitive',
    };

    // ─── 1. Search Workspaces ───
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId: session.user.id } },
        name: searchFilter,
      },
      select: { id: true, name: true, slug: true },
      take: 3,
    });

    // ─── 2. Search Projects ───
    const projects = await prisma.project.findMany({
      where: {
        name: searchFilter,
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        workspace: { select: { name: true } },
      },
      take: 4,
    });

    // ─── 3. Search Tasks ───
    const tasks = await prisma.task.findMany({
      where: {
        title: searchFilter,
        project: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        projectId: true,
        project: {
          select: {
            name: true,
            workspaceId: true,
          },
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      workspaces,
      projects,
      tasks,
    });
  } catch (error) {
    console.error('[SEARCH_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}