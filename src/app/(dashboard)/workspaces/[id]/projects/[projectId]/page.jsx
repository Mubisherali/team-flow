
 // -------------------------------------------------------------
// Project Detail Page - /workspaces/[id]/projects/[projectId]
// UI POLISH: Premium TeamFlow project workspace
// Existing components, data queries, permissions and analytics kept.
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
import AnalyticsSection from "@/components/analytics/AnalyticsSection";
import { DEFAULT_PROJECT_COLOR } from "@/lib/project-colors";

export default async function ProjectDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id: workspaceId, projectId } = await params;
  const role = await getMemberRole(session.user.id, workspaceId);
  if (!canViewWorkspace(role)) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      _count: { select: { members: true, tasks: true } },
    },
  });

  if (!project || project.workspaceId !== workspaceId) notFound();

  const isPrivileged = role === "OWNER" || role === "MANAGER";

  if (!isPrivileged) {
    const isProjectMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    });
    if (!isProjectMember) notFound();
  }

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

  // Shape tasks for the existing client component.
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
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
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

  const analytics = buildAdvancedAnalytics(tasks);

  const completionPercent =
    analytics.totalTasks > 0
      ? Math.round(
          (analytics.byStatus.DONE / analytics.totalTasks) * 100,
        )
      : 0;

  const canManage = canManageProjectMembers(role);
  const projectColor = project.color || DEFAULT_PROJECT_COLOR;
  const initials = project.name.trim().slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      {/* BREADCRUMB */}
      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px] font-medium sm:mb-9 sm:text-[13px]"
      >
        <Link
          href={`/workspaces/${workspaceId}`}
          className="group inline-flex items-center gap-2 rounded-lg py-1 text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors group-hover:border-gray-300 dark:border-white/[0.09] dark:bg-white/[0.03] dark:group-hover:border-white/20">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M19 12H5m7 7-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Workspaces
        </Link>

        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-gray-300 dark:text-gray-700"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <Link
          href={`/workspaces/${workspaceId}`}
          className="max-w-[180px] truncate text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
        >
          {project.workspace.name}
        </Link>

        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-gray-300 dark:text-gray-700"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <span className="max-w-[200px] truncate text-gray-900 dark:text-white">
          {project.name}
        </span>
      </nav>

      {/* PROJECT HEADER */}
      <header
        className="relative mb-6 overflow-hidden rounded-[24px] border border-gray-200/90 bg-white shadow-sm shadow-gray-950/[0.025] dark:border-white/[0.09] dark:bg-[#101116] dark:shadow-black/20 sm:mb-7 sm:rounded-[28px]"
      >
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -right-20 -top-32 h-80 w-80 rounded-full opacity-[0.10] blur-[90px] dark:opacity-[0.17]"
            style={{ backgroundColor: projectColor }}
          />
          <div
            className="absolute -bottom-28 left-[35%] h-56 w-56 rounded-full opacity-[0.045] blur-[80px] dark:opacity-[0.08]"
            style={{ backgroundColor: projectColor }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/70 via-transparent to-transparent dark:from-white/[0.025] dark:via-transparent" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-9">
          <div className="flex flex-col gap-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div
                  className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[19px] text-lg font-bold tracking-tight text-white ring-1 ring-inset ring-white/25 sm:h-[72px] sm:w-[72px] sm:rounded-[23px] sm:text-2xl"
                  style={{
                    background: `linear-gradient(145deg, ${projectColor}, ${projectColor}cc)`,
                    boxShadow: `0 10px 32px -12px ${projectColor}88`,
                  }}
                  aria-hidden="true"
                >
                  {initials}
                </div>

                <div className="min-w-0 pt-0.5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-gray-500 dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-gray-400">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: projectColor }}
                      />
                      Project workspace
                    </span>
                  </div>

                  <h1 className="break-words text-[25px] font-bold tracking-[-0.045em] text-gray-950 dark:text-white sm:text-[32px] lg:text-[36px]">
                    {project.name}
                  </h1>

                  {project.description ? (
                    <p className="mt-2 max-w-2xl text-[13px] leading-6 text-gray-600 dark:text-gray-400 sm:text-[14px]">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-[13px] text-gray-500 dark:text-gray-500">
                      Organize work, collaborate, and track progress.
                    </p>
                  )}
                </div>
              </div>

              {canManage && (
                <Link
                  href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
                  aria-label="Project settings"
                  className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-3 text-[12px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white sm:h-11 sm:px-4 sm:text-[13px]"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="transition-transform duration-300 group-hover:rotate-45"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path
                      d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0V19a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-.3-1.8 1.7 1.7 0 0 0-1.5-1H2.2a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0V2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 .3 1.8 1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4H20a1.7 1.7 0 0 0-.6 3.1Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              )}
            </div>

            {/* Header footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/80 pt-5 dark:border-white/[0.08] sm:pt-6">
              <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span>
                    <strong className="font-semibold text-gray-800 dark:text-gray-200">
                      {project._count.members}
                    </strong>{" "}
                    {project._count.members === 1 ? "member" : "members"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="m9 11 3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <strong className="font-semibold text-gray-800 dark:text-gray-200">
                      {analytics.totalTasks}
                    </strong>{" "}
                    {analytics.totalTasks === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </div>

              <div className="flex w-full items-center gap-3 sm:w-auto sm:min-w-[210px]">
                <div className="min-w-0 flex-1 sm:w-28 sm:flex-none">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    <span>Overall progress</span>
                    <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                      {completionPercent}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.09]"
                    role="progressbar"
                    aria-label="Project completion"
                    aria-valuenow={completionPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${completionPercent}%`,
                        backgroundColor: projectColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PROJECT OVERVIEW */}
      <section aria-label="Project overview" className="mb-9 sm:mb-11">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold tracking-tight text-gray-900 dark:text-white">
              Overview
            </h2>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
              A quick look at project activity
            </p>
          </div>
          <span className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-gray-400">
            Live summary
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <CompactStat
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
              </svg>
            }
            label="Team members"
            value={project._count.members}
            description="People on this project"
            tone="indigo"
          />

          <CompactStat
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="m9 11 3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label="Total tasks"
            value={analytics.totalTasks}
            description="Tasks across all statuses"
            tone="blue"
          />

          <CompactStat
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M22 12A10 10 0 1 1 12 2v10z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2.5A10 10 0 0 1 21.5 8H16z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label="Completion rate"
            value={`${completionPercent}%`}
            description={`${analytics.byStatus.DONE} of ${analytics.totalTasks} tasks completed`}
            tone="emerald"
          />
        </div>
      </section>

      {/* TASK BOARD */}
      <section aria-label="Task board" className="mb-10 sm:mb-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold tracking-tight text-gray-900 dark:text-white">
              Task board
            </h2>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
              Manage and track work across your team
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-gray-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Workspace active
          </span>
        </div>

        <ProjectTasksSection
          workspaceId={workspaceId}
          projectId={projectId}
          initialTasks={shapedTasks}
          projectMembers={shapedProjectMembers}
          currentUserId={session.user.id}
          workspaceRole={role}
        />
      </section>

      {/* PROJECT MEMBERS */}
      <section aria-labelledby="project-members-heading" className="mb-10 sm:mb-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2
                id="project-members-heading"
                className="text-[14px] font-bold tracking-tight text-gray-900 dark:text-white"
              >
                Project members
              </h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-gray-100 px-1.5 text-[10px] font-bold tabular-nums text-gray-600 dark:bg-white/[0.07] dark:text-gray-300">
                {shapedProjectMembers.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
              The people collaborating on this project
            </p>
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
          <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm shadow-gray-950/[0.015] dark:border-white/[0.08] dark:bg-[#101116] dark:shadow-black/10 sm:rounded-[22px] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-white/[0.06]">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Team directory
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                {shapedProjectMembers.length}{" "}
                {shapedProjectMembers.length === 1 ? "person" : "people"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {shapedProjectMembers.map((m) => (
                <MemberChip key={m.id} member={m} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyProjectMembers />
        )}
      </section>

      {/* ANALYTICS */}
      <section
        aria-labelledby="project-analytics-heading"
        className="border-t border-gray-200/80 pt-8 dark:border-white/[0.07] sm:pt-10"
      >
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-gray-300">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m19 9-5 5-4-4-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2
                id="project-analytics-heading"
                className="text-[14px] font-bold tracking-tight text-gray-900 dark:text-white"
              >
                Performance analytics
              </h2>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
                Task distribution, team workload, and project progress
              </p>
            </div>
          </div>
        </div>

        <AnalyticsSection
          analytics={analytics}
          title="Project Analytics"
        />
      </section>
    </main>
  );
}

// -------------------------------------------------------------
// ADVANCED ANALYTICS
// Calculation logic preserved.
// -------------------------------------------------------------

function buildAdvancedAnalytics(tasks) {
  const byStatus = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
  const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  const memberMap = new Map();

  const priorityMixMap = {
    "To do": { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    "In progress": { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    Review: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    Done: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
  };

  const dueHealth = {
    overdue: 0,
    dueSoon: 0,
    onTrack: 0,
    noDate: 0,
  };

  const now = new Date();
  const twoDaysFromNow = new Date(
    now.getTime() + 2 * 24 * 60 * 60 * 1000,
  );

  const velocityMap = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    velocityMap.set(d.toISOString().split("T")[0], 0);
  }

  for (const t of tasks) {
    if (byStatus[t.status] !== undefined) byStatus[t.status]++;
    if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;

    if (t.assignee) {
      const e = memberMap.get(t.assignee.id) || {
        name: (t.assignee.name || t.assignee.email).split(" ")[0],
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      };

      e[t.status]++;
      memberMap.set(t.assignee.id, e);
    }

    const sLabel = {
      TODO: "To do",
      IN_PROGRESS: "In progress",
      REVIEW: "Review",
      DONE: "Done",
    }[t.status];

    if (sLabel && priorityMixMap[sLabel]) {
      priorityMixMap[sLabel][t.priority]++;
    }

    if (t.status !== "DONE") {
      if (!t.dueDate) {
        dueHealth.noDate++;
      } else {
        const due = new Date(t.dueDate);

        if (due < now) dueHealth.overdue++;
        else if (due <= twoDaysFromNow) dueHealth.dueSoon++;
        else dueHealth.onTrack++;
      }
    }

    if (t.status === "DONE" && t.completedAt) {
      const cDate = new Date(t.completedAt);
      cDate.setHours(0, 0, 0, 0);

      const dStr = cDate.toISOString().split("T")[0];

      if (velocityMap.has(dStr)) {
        velocityMap.set(dStr, velocityMap.get(dStr) + 1);
      }
    }
  }

  const velocityData = Array.from(velocityMap.entries()).map(
    ([dStr, count]) => {
      const d = new Date(dStr);

      return {
        date: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        completed: count,
      };
    },
  );

  const dueDateData = [
    { name: "Overdue", value: dueHealth.overdue, color: "#ef4444" },
    { name: "Due Soon", value: dueHealth.dueSoon, color: "#f59e0b" },
    { name: "On Track", value: dueHealth.onTrack, color: "#10b981" },
    { name: "No Date", value: dueHealth.noDate, color: "#9ca3af" },
  ].filter((d) => d.value > 0);

  const workloadData = Array.from(memberMap.values())
    .sort(
      (a, b) =>
        b.TODO +
        b.IN_PROGRESS +
        b.REVIEW +
        b.DONE -
        (a.TODO + a.IN_PROGRESS + a.REVIEW + a.DONE),
    )
    .slice(0, 6);

  const priorityMixData = Object.entries(priorityMixMap).map(
    ([status, counts]) => ({ status, ...counts }),
  );

  return {
    totalTasks: tasks.length,
    byStatus,
    byPriority,
    workloadData,
    priorityMixData,
    velocityData,
    dueDateData,
  };
}

// -------------------------------------------------------------
// COMPACT STAT
// Same component interface; optional visual props added.
// -------------------------------------------------------------

const CompactStat = ({
  icon,
  label,
  value,
  description,
  tone = "indigo",
}) => {
  const tones = {
    indigo: {
      icon: "bg-indigo-500/[0.09] text-indigo-600 dark:bg-indigo-400/[0.12] dark:text-indigo-300",
      accent: "bg-indigo-500",
    },
    blue: {
      icon: "bg-blue-500/[0.09] text-blue-600 dark:bg-blue-400/[0.12] dark:text-blue-300",
      accent: "bg-blue-500",
    },
    emerald: {
      icon: "bg-emerald-500/[0.09] text-emerald-600 dark:bg-emerald-400/[0.12] dark:text-emerald-300",
      accent: "bg-emerald-500",
    },
  };

  const selectedTone = tones[tone] || tones.indigo;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm shadow-gray-950/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md hover:shadow-gray-950/[0.04] dark:border-white/[0.08] dark:bg-[#101116] dark:shadow-black/[0.06] dark:hover:border-white/[0.13] dark:hover:bg-[#12131a] sm:rounded-[22px] sm:p-5">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[2px] ${selectedTone.accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-[12px]">
            {label}
          </p>
          <p className="mt-2 text-[26px] font-bold leading-none tracking-[-0.05em] text-gray-950 dark:text-white sm:text-[30px]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] transition-transform duration-200 group-hover:scale-105 ${selectedTone.icon}`}
        >
          {icon}
        </div>
      </div>

      {description && (
        <p className="mt-3 truncate text-[10px] text-gray-500 dark:text-gray-500 sm:text-[11px]">
          {description}
        </p>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-5 h-20 w-20 rounded-full bg-gray-100/70 blur-2xl dark:bg-white/[0.025]"
      />
    </div>
  );
};

// -------------------------------------------------------------
// MEMBER CHIP
// Existing props and behavior preserved.
// -------------------------------------------------------------

const MemberChip = ({ member }) => {
  const initials = (member.name || member.email || "?")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-gray-200/90 bg-gray-50/80 py-1.5 pl-1.5 pr-3.5 transition-colors duration-200 hover:border-gray-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05]">
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-gray-200 dark:ring-white/[0.12]"
        />
      ) : (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#101116]"
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      <span className="max-w-[180px] truncate text-[11px] font-semibold text-gray-700 transition-colors group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-white sm:text-[12px]">
        {member.name || member.email}
      </span>
    </div>
  );
};

// -------------------------------------------------------------
// EMPTY MEMBERS STATE
// -------------------------------------------------------------

const EmptyProjectMembers = () => (
  <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-5 py-12 text-center dark:border-white/[0.10] dark:bg-white/[0.015] sm:rounded-[22px]">
    <div
      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-400 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-gray-500"
      aria-hidden="true"
    >
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">
      No project members yet
    </h3>

    <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-5 text-gray-500 dark:text-gray-400">
      Bring your team together by adding workspace members to this project.
    </p>
  </div>
);
