// -------------------------------------------------------------
// useSidebarModules - Compute sidebar modules by context
// -------------------------------------------------------------
//
// PHASE 11 (My Tasks):
//   - Added "My Tasks" module to the top of the sidebar
//     regardless of context.
// -------------------------------------------------------------

"use client";

export function useSidebarModules({
  workspaceId,
  projectId,
  taskId,
  stats = {},
}) {
  // ─── Icon library ───
  const ICONS = {
    myTasks: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    overview: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M3 11.5 12 4l9 7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10.5V20h14v-9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    projects: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    tasks: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M9 11l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    members: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2" strokeLinecap="round" />
        <path d="M16 3.5a4 4 0 0 1 0 7.5" strokeLinecap="round" />
        <path d="M21 21v-2a6 6 0 0 0-3.5-5.46" strokeLinecap="round" />
      </svg>
    ),
    settings: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-2.72 2.72-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V21h-3.84v-.18a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05-2.72-2.72.05-.05A1.7 1.7 0 0 0 5 15a1.7 1.7 0 0 0-1.56-1.04H3v-3.84h.44A1.7 1.7 0 0 0 5 9.08a1.7 1.7 0 0 0-.34-1.88l-.05-.05 2.72-2.72.05.05a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10.3 3.26V3h3.84v.26a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05 2.72 2.72-.05.05a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04H21v3.84h-.44A1.7 1.7 0 0 0 19.4 15Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    task: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    comments: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    invitations: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path
          d="M22 6l-10 7L2 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  // ─── Icon backgrounds ───
  const BG = {
    myTasks: "bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
    overview:
      "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    projects:
      "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    tasks:
      "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    members: "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
    settings:
      "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400",
    task: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    comments:
      "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    invitations:
      "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };

  // ─── Global Modules (always shown at the top) ───
  const myTasksModule = [
    {
      key: "my-tasks",
      href: "/my-tasks",
      exact: true,
      name: "My Tasks",
      subtext: "Your assigned work",
      iconBg: BG.myTasks,
      icon: ICONS.myTasks,
    },
  ];

  const inviteCount = stats.pendingInvitationCount || 0;
  const invitationModule =
    inviteCount > 0
      ? [
          {
            key: "invitations",
            href: "/invitations",
            exact: true,
            name: "Invitations",
            subtext:
              inviteCount === 1
                ? "1 pending invite"
                : `${inviteCount} pending invites`,
            iconBg: BG.invitations,
            icon: ICONS.invitations,
            badge: String(inviteCount),
          },
        ]
      : [];

  const globalModules = [...myTasksModule, ...invitationModule];

  // ─── Subtext helpers ───
  const projectsSubtext =
    typeof stats.projectCount === "number"
      ? `${stats.projectCount} active`
      : null;
  const tasksSubtext = (() => {
    const open = stats.openTasks;
    const done = stats.doneTasks;
    if (typeof open === "number" && typeof done === "number")
      return `${open} open · ${done} done`;
    if (typeof open === "number") return `${open} open`;
    return null;
  })();
  const membersSubtext =
    typeof stats.memberCount === "number"
      ? `${stats.memberCount} ${stats.memberCount === 1 ? "teammate" : "teammates"}`
      : null;

  // ─── Return logic ───

  // 1. No workspace context
  if (!workspaceId) {
    return globalModules;
  }

  // 2. Inside a task
  if (workspaceId && projectId && taskId) {
    return [
      ...globalModules,
      {
        key: "task",
        href: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
        exact: true,
        name: "Task details",
        subtext: "Overview and fields",
        iconBg: BG.task,
        icon: ICONS.task,
      },
      {
        key: "comments",
        href: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}#comments`,
        exact: false,
        name: "Discussion",
        subtext: "Comments and replies",
        iconBg: BG.comments,
        icon: ICONS.comments,
      },
    ];
  }

  // 3. Inside a project
  if (workspaceId && projectId) {
    return [
      ...globalModules,
      {
        key: "overview",
        href: `/workspaces/${workspaceId}/projects/${projectId}`,
        exact: true,
        name: "Overview",
        subtext: "Project dashboard",
        iconBg: BG.overview,
        icon: ICONS.overview,
      },
      {
        key: "tasks",
        href: `/workspaces/${workspaceId}/projects/${projectId}#tasks`,
        exact: false,
        name: "Tasks",
        subtext: tasksSubtext,
        iconBg: BG.tasks,
        icon: ICONS.tasks,
      },
      {
        key: "members",
        href: `/workspaces/${workspaceId}/projects/${projectId}#members`,
        exact: false,
        name: "Members",
        subtext: membersSubtext,
        iconBg: BG.members,
        icon: ICONS.members,
      },
      {
        key: "settings",
        href: `/workspaces/${workspaceId}/projects/${projectId}/settings`,
        exact: true,
        name: "Settings",
        subtext: "Project configuration",
        iconBg: BG.settings,
        icon: ICONS.settings,
      },
    ];
  }

  // 4. Inside a workspace
  return [
    ...globalModules,
    {
      key: "overview",
      href: `/workspaces/${workspaceId}`,
      exact: true,
      name: "Overview",
      subtext: "Workspace dashboard",
      iconBg: BG.overview,
      icon: ICONS.overview,
    },
    {
      key: "projects",
      href: `/workspaces/${workspaceId}#projects`,
      exact: false,
      name: "Projects",
      subtext: projectsSubtext,
      iconBg: BG.projects,
      icon: ICONS.projects,
    },
    {
      key: "members",
      href: `/workspaces/${workspaceId}/members`,
      exact: true,
      name: "Members",
      subtext: membersSubtext,
      iconBg: BG.members,
      icon: ICONS.members,
    },
    {
      key: "settings",
      href: `/workspaces/${workspaceId}/settings`,
      exact: true,
      name: "Settings",
      subtext: "Workspace configuration",
      iconBg: BG.settings,
      icon: ICONS.settings,
    },
  ];
}
