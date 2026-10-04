// -------------------------------------------------------------
// Workspaces List Page
// -------------------------------------------------------------
//
// SERVER COMPONENT — fetches the user's workspaces from the DB
// server-side (no API roundtrip), then hands off to a client
// wrapper that manages the create-workspace modal.
//
// TWO-COMPONENT PATTERN:
//   page.jsx               → server: fetches data
//   WorkspaceListClient.jsx → client: modal + interactivity
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import WorkspaceListClient from '@/components/workspace/WorkspaceListClient';

export default async function WorkspacesPage() {
  // ─── Step 1: Auth check ───
  // The layout already checks, but defense in depth.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ─── Step 2: Fetch workspaces ───
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: { members: true, projects: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    description: m.workspace.description,
    role: m.role,
    memberCount: m.workspace._count.members,
    projectCount: m.workspace._count.projects,
    createdAt: m.workspace.createdAt.toISOString(), // serialize for client
  }));

  // ─── Step 3: Render header + client grid ───
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <WorkspaceListClient initialWorkspaces={workspaces} />
    </div>
  );
}