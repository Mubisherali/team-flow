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
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={`/workspaces/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to workspace
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Workspace settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {workspace.name} · <span className="font-mono">/{workspace.slug}</span>
        </p>
      </div>

      {/* General section */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          General
        </h2>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <WorkspaceSettingsForm
            workspaceId={workspace.id}
            initialName={workspace.name}
            initialDescription={workspace.description || ''}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger zone
        </h2>
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Delete this workspace
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
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