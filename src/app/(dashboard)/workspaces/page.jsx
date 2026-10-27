
// -------------------------------------------------------------
// Workspaces List Page
// -------------------------------------------------------------
//
// SERVER COMPONENT:
//   - Auth check (defense in depth — layout also checks)
//   - Fetches the user's workspaces directly through Prisma
//   - Passes serializable data to the client wrapper
//
// DESIGN:
//   - Premium dark TeamFlow workspace experience
//   - Responsive content container
//   - Subtle background accents
//   - Preserves existing authentication and data flow
// -------------------------------------------------------------

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkspaceListClient from "@/components/workspace/WorkspaceListClient";

// -------------------------------------------------------------
// PAGE METADATA
// -------------------------------------------------------------

export const metadata = {
  title: "Workspaces · TeamFlow",
  description: "Manage your TeamFlow workspaces, projects, and team collaboration.",
};

// -------------------------------------------------------------
// PAGE
// -------------------------------------------------------------

export default async function WorkspacesPage() {
  // ─── Authentication ───
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // ─── Fetch workspaces ───
  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  // ─── Serialize database results ───
  const workspaces = memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    description: membership.workspace.description,
    role: membership.role,
    memberCount: membership.workspace._count.members,
    projectCount: membership.workspace._count.projects,
    createdAt: membership.workspace.createdAt.toISOString(),
  }));

  // ─── Render ───
  return (
    <main className="relative isolate min-h-full overflow-hidden">
      {/* Ambient background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-[120px]" />

        <div className="absolute right-[-12rem] top-[28rem] h-72 w-72 rounded-full bg-violet-500/[0.05] blur-[110px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      </div>

      {/* Workspace content */}
      <div className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <WorkspaceListClient initialWorkspaces={workspaces} />
      </div>
    </main>
  );
}
