// -------------------------------------------------------------
// My Tasks Page - /my-tasks
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MyTasksView from '@/components/my-tasks/MyTasksView';

export const metadata = {
  title: 'My Tasks · TeamFlow',
};

export default async function MyTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const tasks = await prisma.task.findMany({
    where: { assigneeId: session.user.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          workspaceId: true,
          workspace: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const workspaceIds = [...new Set(tasks.map((t) => t.project.workspaceId))];
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, workspaceId: { in: workspaceIds } },
    select: { workspaceId: true },
  });

  const allowedWorkspaceIds = new Set(memberships.map((m) => m.workspaceId));
  const visibleTasks = tasks.filter((t) => allowedWorkspaceIds.has(t.project.workspaceId));

  const shapedTasks = visibleTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    projectId: t.projectId, // <--- ADDED this to ensure the row links work
    project: {
      id: t.project.id,
      name: t.project.name,
      color: t.project.color,
      workspaceId: t.project.workspaceId,
      workspace: {
        id: t.project.workspace.id,
        name: t.project.workspace.name,
      },
    },
  }));

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          My Tasks
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          Everything assigned to you across all your workspaces.
        </p>
      </header>

      <section aria-label="Assigned tasks">
        <MyTasksView tasks={shapedTasks} />
      </section>
    </div>
  );
}