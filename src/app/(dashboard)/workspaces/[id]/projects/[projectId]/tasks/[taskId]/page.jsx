// -------------------------------------------------------------
// Task Page - Full-page view for a single task
// -------------------------------------------------------------
//
// URL: /workspaces/[id]/projects/[projectId]/tasks/[taskId]
//
// SERVER COMPONENT:
//   - Auth check
//   - Verify the user can see this task
//     (workspace member, project member, or privileged)
//   - Fetch task + project + workspace + project members
//   - Render <TaskPageClient>
//
// WHERE THIS PAGE IS REACHED FROM:
//   - Card's "⋯" menu → "Open full task" / "Ask a question"
//   - Notifications (Phase 8) → direct link
//   - Bookmark / shared link
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace } from '@/lib/permissions';
import TaskPageClient from '@/components/task/TaskPageClient';

export default async function TaskPage({ params }) {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id: workspaceId, projectId, taskId } = await params;

  // ─── Workspace membership check ───
  const role = await getMemberRole(session.user.id, workspaceId);
  if (!canViewWorkspace(role)) {
    notFound();
  }

  const isPrivileged = role === 'OWNER' || role === 'MANAGER';

  // ─── Fetch task + project + workspace in parallel ───
  const [task, project, workspace] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, workspaceId: true },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  // ─── Validate the hierarchy ───
  // Task must belong to the project, project must belong to the
  // workspace. Any mismatch → 404 (don't leak existence).
  if (!task || !project || !workspace) notFound();
  if (task.projectId !== projectId) notFound();
  if (project.workspaceId !== workspaceId) notFound();

  // ─── Regular members must be project members to see the task ───
  if (!isPrivileged) {
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });
    if (!projectMember) notFound();
  }

  // ─── Fetch project members (for the assignee dropdown) ───
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { addedAt: 'asc' },
  });

  // ─── Shape for the client ───
  // Dates → ISO strings. Flatten nested user objects.
  const shapedTask = {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    labels: task.labels,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
          avatarUrl: task.assignee.avatarUrl,
        }
      : null,
    createdById: task.createdById,
    createdBy: {
      id: task.createdBy.id,
      name: task.createdBy.name,
      email: task.createdBy.email,
      avatarUrl: task.createdBy.avatarUrl,
    },
    commentCount: task._count.comments,
    order: task.order,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };

  const shapedMembers = projectMembers.map((m) => ({
    id: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
  }));

  // ─── Can the current user edit this task? ───
  // Mirrors canMutateTask on the server.
  const canEdit =
    isPrivileged ||
    task.assigneeId === session.user.id ||
    task.createdById === session.user.id;

  // ─── Render ───
  return (
    <TaskPageClient
      task={shapedTask}
      project={{ id: project.id, name: project.name }}
      workspace={{ id: workspace.id, name: workspace.name, slug: workspace.slug }}
      projectMembers={shapedMembers}
      canEdit={canEdit}
      currentUserId={session.user.id}
      currentUserRole={role}
    />
  );
}