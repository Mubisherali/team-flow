import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMemberRole,
  canViewWorkspace,
  canEditWorkspace,
  canCreateProjects,
} from "@/lib/permissions";
import ProjectsSection from "@/components/project/ProjectsSection";
import AnalyticsSection from "@/components/analytics/AnalyticsSection";
import { DEFAULT_PROJECT_COLOR } from "@/lib/project-colors";

export default async function WorkspaceDetailPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const role = await getMemberRole(session.user.id, id);

  if (!canViewWorkspace(role)) {
    notFound();
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const isPrivileged = role === "OWNER" || role === "MANAGER";

  const projectWhere = isPrivileged
    ? { workspaceId: id }
    : {
        workspaceId: id,
        members: {
          some: { userId: session.user.id },
        },
      };

  const projects = await prisma.project.findMany({
    where: projectWhere,
    include: {
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
      members: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const shapedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color || DEFAULT_PROJECT_COLOR,
    memberCount: project._count.members,
    taskCount: project._count.tasks,
    isMember: project.members.length > 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }));

  const visibleProjectIds = projects.map((project) => project.id);

  const analyticsTasks = visibleProjectIds.length
    ? await prisma.task.findMany({
        where: {
          projectId: { in: visibleProjectIds },
        },
        select: {
          id: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    : [];

  const analytics = buildAdvancedAnalytics(analyticsTasks);

  const canEdit = canEditWorkspace(role);
  const canCreate = canCreateProjects(role);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Workspace header */}
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#0f1115]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-3xl dark:bg-indigo-500/[0.12]" />
          <div className="absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-violet-500/[0.06] blur-3xl dark:bg-violet-500/[0.08]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>

        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold tracking-tight text-white shadow-lg shadow-indigo-500/20 ring-1 ring-inset ring-white/20 sm:h-[68px] sm:w-[68px] sm:rounded-3xl sm:text-xl">
              {workspace.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/[0.08] dark:text-indigo-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Workspace
                </span>

                <RoleBadge role={role} />
              </div>

              <h1 className="break-words text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl dark:text-white">
                {workspace.name}
              </h1>

              <p className="mt-1.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                /{workspace.slug}
              </p>

              {workspace.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href={`/workspaces/${id}/members`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]"
            >
              <UsersIcon />
              <span>Team</span>
            </Link>

            {canEdit && (
              <Link
                href={`/workspaces/${id}/settings`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
              >
                <SettingsIcon />
                <span>Settings</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Workspace overview */}
      <section
        aria-label="Workspace overview"
        className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total members"
          value={workspace._count.members}
          caption="People in this workspace"
          icon={<UsersIcon />}
          accent="indigo"
        />

        <StatCard
          label="Total projects"
          value={workspace._count.projects}
          caption="Projects created here"
          icon={<ProjectsIcon />}
          accent="violet"
        />

        <StatCard
          label="Visible projects"
          value={projects.length}
          caption="Projects available to you"
          icon={<LayersIcon />}
          accent="blue"
        />

        <StatCard
          label="Total tasks"
          value={analytics.totalTasks}
          caption="Tasks across visible projects"
          icon={<TasksIcon />}
          accent="emerald"
        />
      </section>

      {/* Projects */}
      <section aria-labelledby="projects-heading" className="mb-10">
        <ProjectsSection
          workspaceId={id}
          initialProjects={shapedProjects}
          canCreate={canCreate}
        />
      </section>

      {/* Team */}
      <section aria-labelledby="team-heading" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              Collaboration
            </p>

            <h2
              id="team-heading"
              className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white"
            >
              Your team
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage workspace membership and collaboration.
            </p>
          </div>

          <Link
            href={`/workspaces/${id}/members`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-400/[0.08]"
          >
            View members
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#0f1115]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/[0.12] dark:text-indigo-400">
                <UsersIcon size={22} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {workspace._count.members}{" "}
                  {workspace._count.members === 1 ? "member" : "members"}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Bring your teammates together to work on projects and tasks.
                </p>
              </div>
            </div>

            <Link
              href={`/workspaces/${id}/members`}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <UsersIcon />
              Manage team
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 bg-gray-50/70 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-6">
            <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Owners manage the workspace
            </span>

            <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Managers coordinate projects
            </span>

            <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Members collaborate on tasks
            </span>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="border-t border-gray-200 pt-8 dark:border-white/[0.07] sm:pt-10">
        <AnalyticsSection
          analytics={analytics}
          title="Workspace Analytics"
        />
      </section>
    </main>
  );
}

// =============================================================
// Analytics data
// =============================================================

function buildAdvancedAnalytics(tasks) {
  const byStatus = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
  };

  const byPriority = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

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
    now.getTime() + 2 * 24 * 60 * 60 * 1000
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const velocityMap = new Map();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    velocityMap.set(date.toISOString().split("T")[0], 0);
  }

  for (const task of tasks) {
    if (byStatus[task.status] !== undefined) {
      byStatus[task.status]++;
    }

    if (byPriority[task.priority] !== undefined) {
      byPriority[task.priority]++;
    }

    if (task.assignee) {
      const member = memberMap.get(task.assignee.id) || {
        name: (
          task.assignee.name ||
          task.assignee.email ||
          "Unknown member"
        ).split(" ")[0],
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      };

      if (member[task.status] !== undefined) {
        member[task.status]++;
      }

      memberMap.set(task.assignee.id, member);
    }

    const statusLabel = {
      TODO: "To do",
      IN_PROGRESS: "In progress",
      REVIEW: "Review",
      DONE: "Done",
    }[task.status];

    if (
      statusLabel &&
      priorityMixMap[statusLabel] &&
      priorityMixMap[statusLabel][task.priority] !== undefined
    ) {
      priorityMixMap[statusLabel][task.priority]++;
    }

    if (task.status !== "DONE") {
      if (!task.dueDate) {
        dueHealth.noDate++;
      } else {
        const dueDate = new Date(task.dueDate);

        if (dueDate < now) {
          dueHealth.overdue++;
        } else if (dueDate <= twoDaysFromNow) {
          dueHealth.dueSoon++;
        } else {
          dueHealth.onTrack++;
        }
      }
    }

    if (task.status === "DONE" && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      completedDate.setHours(0, 0, 0, 0);

      const dateKey = completedDate.toISOString().split("T")[0];

      if (velocityMap.has(dateKey)) {
        velocityMap.set(
          dateKey,
          velocityMap.get(dateKey) + 1
        );
      }
    }
  }

  const velocityData = Array.from(velocityMap.entries()).map(
    ([dateKey, completed]) => ({
      date: new Date(`${dateKey}T12:00:00`).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      ),
      completed,
    })
  );

  const dueDateData = [
    {
      name: "Overdue",
      value: dueHealth.overdue,
      color: "#ef4444",
    },
    {
      name: "Due Soon",
      value: dueHealth.dueSoon,
      color: "#f59e0b",
    },
    {
      name: "On Track",
      value: dueHealth.onTrack,
      color: "#10b981",
    },
    {
      name: "No Date",
      value: dueHealth.noDate,
      color: "#9ca3af",
    },
  ].filter((item) => item.value > 0);

  const workloadData = Array.from(memberMap.values())
    .sort((a, b) => {
      const totalA = a.TODO + a.IN_PROGRESS + a.REVIEW + a.DONE;
      const totalB = b.TODO + b.IN_PROGRESS + b.REVIEW + b.DONE;

      return totalB - totalA;
    })
    .slice(0, 6);

  const priorityMixData = Object.entries(priorityMixMap).map(
    ([status, counts]) => ({
      status,
      ...counts,
    })
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

// =============================================================
// UI components
// =============================================================

function StatCard({ label, value, caption, icon, accent }) {
  const accents = {
    indigo:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/[0.12] dark:text-indigo-400",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/[0.12] dark:text-violet-400",
    blue:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/[0.12] dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/[0.12] dark:text-emerald-400",
  };

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/40 dark:border-white/[0.08] dark:bg-[#0f1115] dark:hover:border-white/[0.14] dark:hover:shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accents[accent] || accents.indigo}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
        {caption}
      </p>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    OWNER:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-300",
    MANAGER:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/[0.08] dark:text-blue-300",
    MEMBER:
      "border-gray-200 bg-gray-50 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
        styles[role] || styles.MEMBER
      }`}
    >
      {role}
    </span>
  );
}

// =============================================================
// Inline icons
// =============================================================

function UsersIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18M8 4v5" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.2-.1a2 2 0 0 0-3.3 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 6 17.5l-.2.2a2 2 0 1 1-2.8-2.8l.1-.2a2 2 0 0 0-1.4-3.3H1.5a2 2 0 1 1 0-4h.2A2 2 0 0 0 3.1 4l-.2-.2a2 2 0 1 1 2.8-2.8l.2.1a2 2 0 0 0 3.3-1.4v-.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.3 1.4l.2-.1a2 2 0 1 1 2.8 2.8l-.1.2a2 2 0 0 0 1.4 3.3h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.4 3.3Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
