import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace } from '@/lib/permissions';
import TaskPageView from '@/components/task/TaskPageView';

export default async function TaskPage({ params }) {
  // Authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id: workspaceId, projectId, taskId } = await params;

  // Workspace membership and visibility
  const role = await getMemberRole(session.user.id, workspaceId);

  if (!canViewWorkspace(role)) {
    notFound();
  }

  const isPrivileged = role === 'OWNER' || role === 'MANAGER';

  // Fetch the task, project, and workspace concurrently.
  const [task, project, workspace] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    }),

    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        workspaceId: true,
      },
    }),

    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  // Prevent cross-workspace and cross-project access.
  if (!task || !project || !workspace) {
    notFound();
  }

  if (
    task.projectId !== projectId ||
    project.workspaceId !== workspaceId
  ) {
    notFound();
  }

  // Regular members must belong to the project.
  if (!isPrivileged) {
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    if (!projectMember) {
      notFound();
    }
  }

  // Project members are used by the assignee selector.
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
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
    orderBy: { addedAt: 'asc' },
  });

  // Serialize Prisma data before passing it to the client.
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

  const shapedMembers = projectMembers.map((member) => ({
    id: member.id,
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatarUrl: member.user.avatarUrl,
  }));

  // Editing: assignee, creator, owner, or manager.
  const canEdit =
    isPrivileged ||
    task.assigneeId === session.user.id ||
    task.createdById === session.user.id;

  // Deletion: owner or manager only.
  const canDelete = isPrivileged;

  return (
    <TaskPageView
      task={shapedTask}
      project={{
        id: project.id,
        name: project.name,
      }}
      workspace={{
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      }}
      projectMembers={shapedMembers}
      canEdit={canEdit}
      canDelete={canDelete}
      currentUserId={session.user.id}
      currentUserRole={role}
    />
  );
}
