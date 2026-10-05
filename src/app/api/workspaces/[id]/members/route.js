// -------------------------------------------------------------
// /api/workspaces/[id]/members - List Members
// -------------------------------------------------------------
//
// GET: Returns all members of the workspace.
// Auth: any workspace member can view.
//
// Response includes:
//   - user details (id, name, email, avatar)
//   - role
//   - joinedAt
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canViewWorkspace(role)) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first (alphabetical: MANAGER, MEMBER, OWNER → reversed?)
        { joinedAt: 'asc' },
      ],
    });

    // Note on ordering: Prisma sorts enums alphabetically by default.
    // We want OWNER first. Sort manually below.

    const roleWeight = { OWNER: 0, MANAGER: 1, MEMBER: 2 };
    const sorted = members.sort(
      (a, b) => roleWeight[a.role] - roleWeight[b.role]
    );

    const shaped = sorted.map((m) => ({
      id: m.id, // membership id
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
      isOwner: m.userId === m.workspaceId ? false : m.role === 'OWNER',
      // ↑ simple: role === OWNER identifies the owner
    }));

    return NextResponse.json({ members: shaped });
  } catch (error) {
    console.error('[MEMBERS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}