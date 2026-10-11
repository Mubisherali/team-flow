// -------------------------------------------------------------
// Workspaces List Page
// -------------------------------------------------------------
//
// SERVER COMPONENT:
//   - Auth check (defense in depth — layout also checks)
//   - Fetches the user's workspaces from the DB
//   - Passes them to a client wrapper
//
// WHY SERVER-SIDE FETCH:
//   No API roundtrip — the server talks to Prisma directly.
//   The client component gets plain JSON-serializable props.
//
// PADDING:
//   Mobile-first: p-5 on phones, p-8 on sm+.
//   Content is centered in a max-w-6xl container.
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import WorkspaceListClient from '@/components/workspace/WorkspaceListClient';

// -------------------------------------------------------------
// PAGE METADATA
// -------------------------------------------------------------
// Sets the browser tab title. Next.js reads this export.
export const metadata = {
  title: 'Workspaces · TeamFlow',
};

export default async function WorkspacesPage() {
  // ─── Auth check ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ─── Fetch workspaces ───
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
    createdAt: m.workspace.createdAt.toISOString(),
  }));

  // ─── Render ───
  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <WorkspaceListClient initialWorkspaces={workspaces} />
    </div>
  );
}