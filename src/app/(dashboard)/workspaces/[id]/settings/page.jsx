// -------------------------------------------------------------
// Workspace Settings Page
// -------------------------------------------------------------
//
// URL: /workspaces/:id/settings
//
// WHO CAN ACCESS:
//   Owner only (via canEditWorkspace).
//   Managers and members → 404 (don't leak existence).
//
// STRUCTURE:
//   page.jsx (server) → checks auth, fetches workspace
//   <WorkspaceSettingsForm> (client) → rename + description
//   <DeleteWorkspaceButton> (client) → danger zone
//
// POLISH:
//   - Card surface matches TaskDetailModal (dark #0f1115)
//   - Glass danger-zone surface
//   - Tighter type scale (Wave-3)
//   - Back link + focus rings + hover
//   - A11y: section landmarks, aria-labelledby, aria-hidden
//
// PRESERVED:
//   - Same server logic (auth → owner gate → fetch)
//   - notFound() for non-owners
//   - Same component structure
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMemberRole, canEditWorkspace } from '@/lib/permissions';
import WorkspaceSettingsForm from '@/components/workspace/WorkspaceSettingsForm';
import DeleteWorkspaceButton from '@/components/workspace/DeleteWorkspaceButton';

export default async function WorkspaceSettingsPage({ params }) {
  // ─── Step 1: Auth check ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  // ─── Step 2: Owner-only access ───
  const role = await getMemberRole(session.user.id, id);
  if (!canEditWorkspace(role)) {
    // 404 — don't reveal that this workspace exists to non-owners.
    notFound();
  }

  // ─── Step 3: Fetch workspace ───
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  if (!workspace) {
    notFound();
  }

  // ─── Step 4: Render ───
  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* ══════════ BACK LINK ══════════ */}
      <Link
        href={`/workspaces/${id}`}
        className="
          inline-flex items-center gap-1.5 mb-6
          text-[13px] font-medium
          text-gray-600 dark:text-gray-400
          hover:text-gray-900 dark:hover:text-white
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          rounded
          transition-colors duration-150
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
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to workspace
      </Link>

      {/* ══════════ HEADER ══════════ */}
      <header className="mb-8">
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          Workspace settings
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          {workspace.name} ·{' '}
          <span className="font-mono text-[12.5px]">/{workspace.slug}</span>
        </p>
      </header>

      {/* ══════════ GENERAL ══════════ */}
      <section aria-labelledby="general-heading" className="mb-8">
        <h2
          id="general-heading"
          className="text-[13px] font-semibold tracking-tight text-gray-900 dark:text-white mb-4"
        >
          General
        </h2>
        <div
          className="
            rounded-2xl p-5 sm:p-6
            border border-gray-200 dark:border-white/[0.08]
            bg-white dark:bg-[#0f1115]
          "
        >
          <WorkspaceSettingsForm
            workspaceId={workspace.id}
            initialName={workspace.name}
            initialDescription={workspace.description || ''}
          />
        </div>
      </section>

      {/* ══════════ DANGER ZONE ══════════ */}
      <section aria-labelledby="danger-heading">
        <h2
          id="danger-heading"
          className="text-[13px] font-semibold tracking-tight text-red-600 dark:text-red-400 mb-4"
        >
          Danger zone
        </h2>
        <div
          className="
            rounded-2xl p-5 sm:p-6
            border border-red-500/20
            bg-red-500/[0.04] dark:bg-red-500/[0.06]
          "
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">
                Delete this workspace
              </h3>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 mt-1 max-w-md leading-relaxed">
                Once deleted, the workspace and all its projects, tasks, and
                members are permanently removed. This cannot be undone.
              </p>
            </div>
            <DeleteWorkspaceButton
              workspaceId={workspace.id}
              workspaceName={workspace.name}
            />
          </div>
        </div>
      </section>
    </div>
  );
}