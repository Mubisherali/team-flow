import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { createWorkspaceSchema } from "@/lib/validators/workspace";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// =============================================================
// GET /api/workspaces
// =============================================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: {
          include: {
            // FIX 2: "members" (plural) matches the Prisma relation name
            _count: {
              select: { members: true, projects: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // FIX 3: remove `await` — .map is synchronous
    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      description: m.workspace.description,
      role: m.role,
      memberCount: m.workspace._count.members,
      projectCount: m.workspace._count.projects,
      createdAt: m.workspace.createdAt,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("[WORKSPACES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

// =============================================================
// POST /api/workspaces
// =============================================================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createWorkspaceSchema.safeParse(body);

    // FIX 1: check parsed.success, not parsed
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    const slug = await generateUniqueSlug(name);

    const workspace = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: {
          name,
          slug,
          // FIX 4: coerce empty string → null
          description: description || null,
          ownerId: session.user.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId: session.user.id,
          role: "OWNER",
        },
      });

      return newWorkspace;
    });

    return NextResponse.json(
      {
        message: "Workspace created",
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
          role: "OWNER",
          memberCount: 1,
          projectCount: 0,
          createdAt: workspace.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[WORKSPACES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}