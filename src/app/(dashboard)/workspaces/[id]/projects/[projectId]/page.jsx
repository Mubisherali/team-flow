// -------------------------------------------------------------
// Project Detail Page - /workspaces/[id]/projects/[projectId]
// -------------------------------------------------------------
//
// URL: /workspaces/:id/projects/:projectId
//
// SERVER COMPONENT:
//   - Auth check
//   - Verify project visibility (owner/manager OR project member)
//   - Fetch project + tasks + project members + workspace members
//   - Render breadcrumb, header, stats, Kanban, members section
//
// PROJECT VISIBILITY:
//   - OWNER/MANAGER of the workspace → always
//   - MEMBER of the workspace        → only if project member
//
// POLISH:
//   - Card surface matches TaskDetailModal (dark #0f1115)
//   - Glass indigo stat icon bubbles
//   - Tighter type scale (Wave-3)
//   - Buttons/links get active:scale + focus rings
//   - MemberChip → glass pill
//   - A11y: section landmarks, aria-labelledby, aria-hidden
//
// PRESERVED:
//   - All server logic (auth, visibility, Promise.all fetches)
//   - All data shaping (dates, user flattening)
//   - Sub-components (StatCard, MemberChip)
//   - ProjectTasksSection + ManageMembersButton usage
//   - Hardcoded "0%" progress (Phase 9 will replace)
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canViewWorkspace,
  canManageProjectMembers,
} from '@/lib/permissions';
import ManageMembersButton from '@/components/project/ManageMembersButton';
import ProjectTasksSection from '@/components/task/ProjectTasksSection';
import { DEFAULT_PROJECT_COLOR } from '@/lib/project-colors';

export default async function ProjectDetailPage({ params }) {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
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
  const isPrivileged = role === 'OWNER' || role === 'MANAGER';

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
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),

    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { addedAt: 'asc' },
    }),

    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    }),
  ]);

  // ─── Shape for the client ───
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
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* ══════════ BREADCRUMB ══════════ */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 mb-6 text-[12.5px] text-gray-500 dark:text-gray-400"
      >
        <Link
          href={`/workspaces/${workspaceId}`}
          className="
            hover:text-gray-900 dark:hover:text-white
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
            rounded
            transition-colors duration-150
          "
        >
          {project.workspace.name}
        </Link>
        <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
          /
        </span>
        <span className="text-gray-900 dark:text-white font-medium">
          Projects
        </span>
      </nav>

      {/* ══════════ HEADER ══════════ */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="
              w-14 h-14 rounded-2xl flex-shrink-0
              flex items-center justify-center
              text-white font-bold text-lg
              shadow-lg
              ring-1 ring-inset ring-white/20
            "
            style={{
              backgroundColor: projectColor,
              boxShadow: `0 8px 24px -8px ${projectColor}66`,
            }}
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {canManage && (
          <Link
            href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
            className="
              inline-flex items-center gap-2 self-start flex-shrink-0
              px-3.5 py-2 rounded-lg
              border border-gray-300 dark:border-white/[0.08]
              text-gray-700 dark:text-gray-300
              text-[13px] font-medium
              hover:bg-gray-50 dark:hover:bg-white/[0.04]
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              transition-all duration-150
            "
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .69.41 1.29 1 1.51H21a2 2 0 110 4h-.09c-.59.22-1 .82-1 1.51z" />
            </svg>
            Settings
          </Link>
        )}
      </header>

      {/* ══════════ STATS ══════════ */}
      <section
        aria-label="Project stats"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <StatCard
          label="Members"
          value={project._count.members}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
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
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
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
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M22 12A10 10 0 1112 2v10z" />
            </svg>
          }
        />
      </section>

      {/* ══════════ KANBAN ══════════ */}
      <section aria-label="Task board" className="mb-10">
        <ProjectTasksSection
          workspaceId={workspaceId}
          projectId={projectId}
          initialTasks={shapedTasks}
          projectMembers={shapedProjectMembers}
          currentUserId={session.user.id}
          workspaceRole={role}
        />
      </section>

      {/* ══════════ MEMBERS ══════════ */}
      <section aria-labelledby="project-members-heading">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h2
              id="project-members-heading"
              className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white truncate"
            >
              Members
            </h2>
            <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
              {shapedProjectMembers.length}
            </span>
          </div>

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
          <div
            className="
              rounded-2xl p-5
              border border-gray-200 dark:border-white/[0.08]
              bg-white dark:bg-[#0f1115]
            "
          >
            <div className="flex items-center gap-2 flex-wrap">
              {shapedProjectMembers.map((m) => (
                <MemberChip key={m.id} member={m} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyProjectMembers />
        )}
      </section>
    </div>
  );
}

// =============================================================
// StatCard
// =============================================================
const StatCard = ({ label, value, icon }) => (
  <div
    className="
      rounded-2xl p-5
      border border-gray-200 dark:border-white/[0.08]
      bg-white dark:bg-[#0f1115]
    "
  >
    <div className="flex items-center gap-3">
      <div
        className="
          w-9 h-9 rounded-lg flex-shrink-0
          bg-indigo-500/10 dark:bg-indigo-500/15
          text-indigo-600 dark:text-indigo-400
          flex items-center justify-center
        "
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[20px] font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
          {value}
        </p>
        <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
          {label}
        </p>
      </div>
    </div>
  </div>
);

// =============================================================
// MemberChip — glass pill
// =============================================================
const MemberChip = ({ member }) => {
  const initials = (member.name || member.email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="
        flex items-center gap-2
        pl-1 pr-3 py-1 rounded-full
        border border-gray-200 dark:border-white/[0.08]
        bg-gray-50 dark:bg-white/[0.03]
      "
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt=""
          className="
            w-6 h-6 rounded-full object-cover
            ring-1 ring-gray-200 dark:ring-white/[0.08]
          "
        />
      ) : (
        <div
          className="
            w-6 h-6 rounded-full
            bg-indigo-600 text-white
            flex items-center justify-center
            text-[10px] font-semibold
            ring-1 ring-indigo-500/20
          "
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
        {member.name || member.email}
      </span>
    </div>
  );
};

// =============================================================
// EmptyProjectMembers
// =============================================================
const EmptyProjectMembers = () => (
  <div
    className="
      rounded-2xl py-10 px-4 text-center
      border border-dashed
      border-gray-300 dark:border-white/[0.08]
      bg-white/60 dark:bg-white/[0.02]
    "
  >
    <div
      className="
        w-12 h-12 mx-auto mb-3 rounded-full
        bg-gray-100 dark:bg-white/[0.04]
        flex items-center justify-center
      "
      aria-hidden="true"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-gray-400 dark:text-gray-500"
      >
        <path
          d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-1">
      No members yet
    </p>
    <p className="text-[12px] text-gray-500 dark:text-gray-400">
      Add teammates to collaborate on this project.
    </p>
  </div>
);