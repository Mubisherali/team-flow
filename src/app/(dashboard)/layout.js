// -------------------------------------------------------------
// Dashboard Layout
// -------------------------------------------------------------
//
// SERVER COMPONENT:
//   - Reads session
//   - Fetches workspaces (for the sidebar)
//   - Computes context-aware stats:
//       * Inside a workspace → counts for that workspace
//       - Inside a project  → counts for that project
//       - Otherwise          → no stats
//   - Renders <NotificationsProvider> + <Sidebar> + children
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Toaster } from 'react-hot-toast';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/layout/Sidebar';
import { NotificationsProvider } from '@/context/NotificationsContext';
import NotificationToaster from '@/components/layout/NotificationToaster';
import NotificationSound from '@/components/layout/NotificationSound';

export default async function DashboardLayout({ children, params }) {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // NOTE: Next.js doesn't pass params to layouts by default.
  // We read the URL segments from the searchParams/params that
  // are NOT available here — so we use a different trick:
  // children components read params themselves via useParams.
  //
  // For layout-level stats, we need to know if we're inside a
  // workspace/project. We'll read this from the request URL via
  // the headers() helper.

  const { headers } = await import('next/headers');
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || '';

  // Parse the URL to detect context
  // Patterns:
  //   /workspaces/:wid
  //   /workspaces/:wid/projects/:pid
  //   /workspaces/:wid/projects/:pid/tasks/:tid
  const pathParts = pathname.split('/').filter(Boolean);

  let workspaceId = null;
  let projectId = null;

  if (pathParts[0] === 'workspaces' && pathParts[1]) {
    workspaceId = pathParts[1];
    if (pathParts[2] === 'projects' && pathParts[3]) {
      projectId = pathParts[3];
    }
  }

  // ─── Fetch workspaces for the sidebar ───
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
  }));

  // ─── Compute stats based on context ───
  const stats = {};

  // Only fetch stats if we're in a workspace the user is a member of
  const isMember = workspaceId
    ? memberships.some((m) => m.workspace.id === workspaceId)
    : false;

  if (workspaceId && isMember) {
    if (projectId) {
      // ─── Project-scoped stats ───
      const [projectMemberCount, openTasks, doneTasks] = await Promise.all([
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

      stats.memberCount = projectMemberCount;
      stats.openTasks = openTasks;
      stats.doneTasks = doneTasks;
    } else {
      // ─── Workspace-scoped stats ───
      const [projectCount, memberCount, openTasks, doneTasks] = await Promise.all([
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

      stats.projectCount = projectCount;
      stats.memberCount = memberCount;
      stats.openTasks = openTasks;
      stats.doneTasks = doneTasks;
    }
  }

  // ─── Render ───
  return (
    <NotificationsProvider>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
        <Sidebar
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
          workspaces={workspaces}
          stats={stats}
        />

        <main className="flex-1 min-w-0">{children}</main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
            },
          }}
        />

        <NotificationToaster />
        <NotificationSound />
      </div>
    </NotificationsProvider>
  );
}