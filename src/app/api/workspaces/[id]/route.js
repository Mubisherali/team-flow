// -------------------------------------------------------------
// /api/workspaces/[id] - Single Workspace Endpoints
// -------------------------------------------------------------
//
// ENDPOINTS:
//   GET    /api/workspaces/:id  - fetch workspace details
//   PATCH  /api/workspaces/:id  - update name/description
//   DELETE /api/workspaces/:id  - delete workspace
//
// AUTHENTICATION:
// All endpoints require a logged-in user.
//
// AUTHORIZATION:
//   GET    - any workspace member
//   PATCH  - OWNER only
//   DELETE - OWNER only
//
// NOTE ON Next.js 16 route params:
// `params` is a Promise, so we `await params` inside each handler.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canEditWorkspace,
  canDeleteWorkspace,
  canViewWorkspace,
} from '@/lib/permissions';
import { updateWorkspaceSchema } from '@/lib/validators/workspace';

// =============================================================
// GET /api/workspaces/:id
// =============================================================
export async function GET(request, { params }) {
  try {
    // ─── Step 1: Auth check ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Step 2: Get workspace id from URL ───
    // In Next.js 16, params is a Promise — must await.
    const { id } = await params;

    // ─── Step 3: Fetch workspace + role of the current user ───
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, projects: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Step 4: Verify the user is a member ───
    const role = await getMemberRole(session.user.id, id);

    if (!canViewWorkspace(role)) {
      // 404 not 403 — don't reveal that this workspace exists
      // to non-members. Prevents enumeration.
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // ─── Step 5: Return workspace ───
    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        ownerId: workspace.ownerId,
        role,
        memberCount: workspace._count.members,
        projectCount: workspace._count.projects,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error('[WORKSPACE_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/workspaces/:id
// =============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // ─── Step 1: Check role ───
    const role = await getMemberRole(session.user.id, id);
    if (!canEditWorkspace(role)) {
      // 403 here is correct: the user is logged in, but not
      // allowed to edit. We don't care if they can see the
      // workspace or not — 403 makes it clear it's a permission
      // issue, not a "not found" issue.
      return NextResponse.json(
        { error: 'You do not have permission to edit this workspace' },
        { status: 403 }
      );
    }

    // ─── Step 2: Validate body ───
    const body = await request.json();
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ─── Step 3: Build update payload ───
    // Only include fields that were provided (partial update).
    const data = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      data.description = parsed.data.description || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // ─── Step 4: Update ───
    const workspace = await prisma.workspace.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: 'Workspace updated',
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        ownerId: workspace.ownerId,
        updatedAt: workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error('[WORKSPACE_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE /api/workspaces/:id
// =============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // ─── Step 1: Check role ───
    const role = await getMemberRole(session.user.id, id);
    if (!canDeleteWorkspace(role)) {
      return NextResponse.json(
        { error: 'Only the owner can delete this workspace' },
        { status: 403 }
      );
    }

    // ─── Step 2: Delete ───
    // Thanks to `onDelete: Cascade` in the schema, this removes:
    //   - All workspace_members rows
    //   - All projects (and their project_members)
    //   - All tasks (and their comments)
    //   - All invitations
    // All automatically. One SQL DELETE.
    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workspace deleted' });
  } catch (error) {
    console.error('[WORKSPACE_DELETE_ERROR]', error);

    // P2025 = "record not found" — the workspace was already gone.
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}