// -------------------------------------------------------------
// Workspace Dashboard - Single workspace detail page
// -------------------------------------------------------------
//
// URL: /workspaces/:id
//
// SERVER COMPONENT:
//   - Fetches workspace + user role + stats server-side
//   - Renders header, stats, projects placeholder, team section
//
// AUTH:
//   - If not a member → 404 (don't leak existence)
//   - If a member → render page
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canViewWorkspace, canEditWorkspace } from '@/lib/permissions';

export default async function WorkspaceDetailPage({ params }) {
  // ─── Step 1: Auth check ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ─── Step 2: Get workspace id ───
  const { id } = await params;

  // ─── Step 3: Verify membership ───
  const role = await getMemberRole(session.user.id, id);
  if (!canViewWorkspace(role)) {
    notFound();
  }

  // ─── Step 4: Fetch workspace + stats ───
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

  // ─── Step 5: Count tasks ───
  const taskCount = await prisma.task.count({
    where: {
      project: { workspaceId: id },
    },
  });

  // ─── Step 6: Render ───
  const canEdit = canEditWorkspace(role);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ----- Header ----- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {workspace.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {workspace.name}
              </h1>
              <RoleBadge role={role} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              /{workspace.slug}
            </p>
            {workspace.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                {workspace.description}
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <Link
            href={`/workspaces/${id}/settings`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors self-start"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .69.41 1.29 1 1.51H21a2 2 0 110 4h-.09c-.59.22-1 .82-1 1.51z" />
            </svg>
            Settings
          </Link>
        )}
      </div>

      {/* ----- Stats cards ----- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Members"
          value={workspace._count.members}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Projects"
          value={workspace._count.projects}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="Tasks"
          value={taskCount}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* ----- Projects placeholder (Phase 5) ----- */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
            Coming in Phase 5
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlaceholderCard text="Projects will appear here" />
          <PlaceholderCard text="Create one from this page soon" />
          <PlaceholderCard text="Assign tasks, add members" />
        </div>
      </section>

      {/* ----- Team section ----- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team
          </h2>
          <Link
            href={`/workspaces/${id}/members`}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">
                  {workspace._count.members}
                </strong>{' '}
                {workspace._count.members === 1 ? 'member' : 'members'} in this workspace
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Invite teammates to collaborate on projects and tasks.
              </p>
            </div>

            <Link
              href={`/workspaces/${id}/members`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Manage team
            </Link>
          </div>
        </div>
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
// RoleBadge
// =============================================================
const RoleBadge = ({ role }) => {
  const styles = {
    OWNER: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    MANAGER: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    MEMBER: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${styles[role] || styles.MEMBER}`}>
      {role}
    </span>
  );
};

// =============================================================
// PlaceholderCard
// =============================================================
const PlaceholderCard = ({ text }) => (
  <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-6 min-h-[120px] flex items-center justify-center">
    <p className="text-xs text-gray-400 dark:text-gray-600 text-center">{text}</p>
  </div>
);