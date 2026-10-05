// -------------------------------------------------------------
// /api/workspaces/[id]/members - List Members
// -------------------------------------------------------------
//
// GET: Returns all members of the workspace.
// Auth: any workspace member can view.
//
// RESPONSE SHAPE:
//   {
//     members: [
//       {
//         id: <membership id>,   // NOT the user id
//         userId: <user id>,
//         name, email, avatarUrl,
//         role: 'OWNER' | 'MANAGER' | 'MEMBER',
//         joinedAt: ISO string,
//       },
//       ...
//     ]
//   }
//
// ORDERING:
//   OWNER first, then MANAGERs, then MEMBERs.
//   Within the same role, oldest member first.
//   We sort in JS because Prisma's enum ordering is
//   alphabetical, which would put MEMBER before OWNER.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    // ─── Step 1: Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // ─── Step 2: Must be a member to view ───
    const role = await getMemberRole(session.user.id, workspaceId);
    if (!canViewWorkspace(role)) {
      // 404 (not 403) — don't reveal the workspace exists.
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Step 3: Fetch memberships + user info ───
    const memberships = await prisma.workspaceMember.findMany({
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
    });

    // ─── Step 4: Sort by role priority, then join date ───
    const roleWeight = { OWNER: 0, MANAGER: 1, MEMBER: 2 };

    const sorted = [...memberships].sort((a, b) => {
      const roleDiff = roleWeight[a.role] - roleWeight[b.role];
      if (roleDiff !== 0) return roleDiff;
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

    // ─── Step 5: Shape for the client ───
    const members = sorted.map((m) => ({
      id: m.id,              // membership row id
      userId: m.user.id,     // underlying user id
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[MEMBERS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}