// -------------------------------------------------------------
// Workspace Dashboard - Single workspace detail page
// -------------------------------------------------------------
//
// URL: /workspaces/:id
//
// SERVER COMPONENT:
//   - Fetches workspace + user role + stats server-side
//   - Fetches visible projects for the current user
//   - Fetches 14-day task data for the new Analytics
//   - Renders header, stats, projects, team, AND analytics (at bottom)
// -------------------------------------------------------------

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
  // ─── Step 1: Auth check ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  // ─── Step 2: Verify membership ───
  const role = await getMemberRole(session.user.id, id);
  if (!canViewWorkspace(role)) {
    notFound();
  }

  // ─── Step 3: Fetch workspace + counts ───
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true, projects: true } },
    },
  });

  if (!workspace) notFound();

  // ─── Step 4: Fetch visible projects ───
  const isPrivileged = role === "OWNER" || role === "MANAGER";
  const projectWhere = isPrivileged
    ? { workspaceId: id }
    : { workspaceId: id, members: { some: { userId: session.user.id } } };

  const projects = await prisma.project.findMany({
    where: projectWhere,
    include: {
      _count: { select: { members: true, tasks: true } },
      members: { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const shapedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color || DEFAULT_PROJECT_COLOR,
    memberCount: p._count.members,
    taskCount: p._count.tasks,
    isMember: p.members.length > 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // ─── Step 5: Fetch Analytics Data ───
  const visibleProjectIds = projects.map((p) => p.id);

  const analyticsTasks = visibleProjectIds.length
    ? await prisma.task.findMany({
        where: { projectId: { in: visibleProjectIds } },
        select: {
          id: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      })
    : [];

  const analytics = buildAdvancedAnalytics(analyticsTasks);

  // ─── Step 6: Permissions ───
  const canEdit = canEditWorkspace(role);
  const canCreate = canCreateProjects(role);

  // ─── Step 7: Render ───
  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* ══════════ HEADER ══════════ */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="
              w-14 h-14 rounded-2xl flex-shrink-0
              bg-gradient-to-br from-indigo-500 to-purple-600
              flex items-center justify-center
              text-white font-bold text-lg
              shadow-lg shadow-indigo-500/20
              ring-1 ring-inset ring-white/20
            "
            aria-hidden="true"
          >
            {workspace.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white truncate">
                {workspace.name}
              </h1>
              <RoleBadge role={role} />
            </div>
            <p className="text-[12.5px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
              /{workspace.slug}
            </p>
            {workspace.description && (
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-2 max-w-2xl leading-relaxed">
                {workspace.description}
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <Link
            href={`/workspaces/${id}/settings`}
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
        aria-label="Workspace stats"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <StatCard
          label="Members"
          value={workspace._count.members}
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
          label="Projects"
          value={workspace._count.projects}
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
                d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Tasks"
          value={analytics.totalTasks}
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
      </section>

      {/* ══════════ PROJECTS ══════════ */}
      <section aria-labelledby="projects-heading" className="mb-8">
        <ProjectsSection
          workspaceId={id}
          initialProjects={shapedProjects}
          canCreate={canCreate}
        />
      </section>

      {/* ══════════ TEAM ══════════ */}
      <section aria-labelledby="team-heading" className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2
            id="team-heading"
            className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Team
          </h2>
          <Link
            href={`/workspaces/${id}/members`}
            className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[13px] text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {workspace._count.members}
                </strong>{" "}
                {workspace._count.members === 1 ? "member" : "members"} in this
                workspace
              </p>
              <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-1">
                Invite teammates to collaborate on projects and tasks.
              </p>
            </div>

            <Link
              href={`/workspaces/${id}/members`}
              className="inline-flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-[13px] font-medium transition-all duration-150"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Manage team
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ ANALYTICS (MOVED TO BOTTOM) ══════════ */}
      <div className="border-t border-gray-200 dark:border-white/[0.06] pt-10">
        <AnalyticsSection analytics={analytics} title="Workspace Analytics" />
      </div>
    </div>
  );
}

// =============================================================
// Helper: Advanced Analytics
// =============================================================
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
  const dueHealth = { overdue: 0, dueSoon: 0, onTrack: 0, noDate: 0 };
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
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
    if (sLabel && priorityMixMap[sLabel]) priorityMixMap[sLabel][t.priority]++;

    if (t.status !== "DONE") {
      if (!t.dueDate) dueHealth.noDate++;
      else {
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
      if (velocityMap.has(dStr))
        velocityMap.set(dStr, velocityMap.get(dStr) + 1);
    }
  }

  const velocityData = Array.from(velocityMap.entries()).map(
    ([dStr, count]) => {
      const d = new Date(dStr);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

// =============================================================
// Sub-components
// =============================================================
const StatCard = ({ label, value, icon }) => (
  <div className="rounded-2xl p-5 border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115]">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
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

const RoleBadge = ({ role }) => {
  const styles = {
    OWNER:
      "bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
    MANAGER:
      "bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
    MEMBER:
      "bg-gray-500/10 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${styles[role] || styles.MEMBER}`}
    >
      {role}
    </span>
  );
};
