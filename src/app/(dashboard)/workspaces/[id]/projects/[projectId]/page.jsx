// -------------------------------------------------------------
// Project Detail Page - /workspaces/[id]/projects/[projectId]
// -------------------------------------------------------------
//
// SERVER COMPONENT:
//   - Auth check
//   - Verify project visibility (owner/manager OR project member)
//   - Fetch project + tasks + project members + workspace members
//   - Render header, stats, Kanban, members section
//
// PROJECT VISIBILITY:
//   - OWNER/MANAGER of the workspace  → always
//   - MEMBER of the workspace         → only if project member
// -------------------------------------------------------------

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMemberRole,
  canViewWorkspace,
  canManageProjectMembers,
} from "@/lib/permissions";
import ManageMembersButton from "@/components/project/ManageMembersButton";
import ProjectTasksSection from "@/components/task/ProjectTasksSection";
import { DEFAULT_PROJECT_COLOR } from "@/lib/project-colors";

export default async function ProjectDetailPage({ params }) {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id: workspaceId, projectId } = await params;

  // ─── Workspace membership check ───
  const role = await getMemberRole(session.user.id, workspaceId);
  if (!canViewWorkspace(role)) {
    notFound();
  }

  // ─── Fetch project + verify it belongs to this workspace ───
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      _count: {
        select: { members: true, tasks: true },
      },
    },
  });

  if (!project || project.workspaceId !== workspaceId) {
    notFound();
  }

  // ─── Regular members can only see projects they belong to ───
  const isPrivileged = role === "OWNER" || role === "MANAGER";

  if (!isPrivileged) {
    const isProjectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
    });
    if (!isProjectMember) {
      notFound();
    }
  }

  // ─── Fetch tasks + project members + workspace members in parallel ───
  const [tasks, projectMembers, workspaceMembers] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),

    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { addedAt: "asc" },
    }),

    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  // ─── Shape for the client ───
  // Dates → ISO strings (serializable). Flatten nested user objects.
  const shapedTasks = tasks.map((t) => ({
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    labels: t.labels,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assigneeId: t.assigneeId,
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          name: t.assignee.name,
          email: t.assignee.email,
          avatarUrl: t.assignee.avatarUrl,
        }
      : null,
    createdById: t.createdById,
    createdBy: {
      id: t.createdBy.id,
      name: t.createdBy.name,
      email: t.createdBy.email,
      avatarUrl: t.createdBy.avatarUrl,
    },
    commentCount: t._count.comments,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const shapedProjectMembers = projectMembers.map((m) => ({
    id: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
  }));

  const shapedWorkspaceMembers = workspaceMembers.map((m) => ({
    id: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
  }));

  // ─── Render ───
  const canManage = canManageProjectMembers(role);
  const projectColor = project.color || DEFAULT_PROJECT_COLOR;
  const initials = project.name.trim().slice(0, 2).toUpperCase();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link
          href={`/workspaces/${workspaceId}`}
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {project.workspace.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Projects</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: projectColor }}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {canManage && (
          <Link
            href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors self-start"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .69.41 1.29 1 1.51H21a2 2 0 110 4h-.09c-.59.22-1 .82-1 1.51z" />
            </svg>
            Settings
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Members"
          value={project._count.members}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                strokeLinecap="round"
              />
              <circle cx="9" cy="7" r="4" />
              <path
                d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Tasks"
          value={project._count.tasks}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M9 11l3 3L22 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Progress"
          value="0%"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 12A10 10 0 1112 2v10z" />
            </svg>
          }
        />
      </div>

      {/* ─── Kanban Board ─── */}
      <section className="mb-10">
        <ProjectTasksSection
          workspaceId={workspaceId}
          projectId={projectId}
          initialTasks={shapedTasks}
          projectMembers={shapedProjectMembers}
          currentUserId={session.user.id}
          workspaceRole={role}
        />
      </section>

      {/* ─── Members Section ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Members
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              {shapedProjectMembers.length}
            </span>
          </h2>

          {canManage && (
            <ManageMembersButton
              workspaceId={workspaceId}
              projectId={projectId}
              projectMembers={shapedProjectMembers}
              allMembers={shapedWorkspaceMembers}
              currentUserId={session.user.id}
            />
          )}
        </div>

        {shapedProjectMembers.length > 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-3 flex-wrap">
              {shapedProjectMembers.map((m) => (
                <MemberChip key={m.id} member={m} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No members yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// =============================================================
// StatCard
// =============================================================
const StatCard = ({ label, value, icon }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {value}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </div>
);

// =============================================================
// MemberChip
// =============================================================
const MemberChip = ({ member }) => {
  const initials = (member.name || member.email || "?")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt=""
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-semibold">
          {initials}
        </div>
      )}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {member.name || member.email}
      </span>
    </div>
  );
};
