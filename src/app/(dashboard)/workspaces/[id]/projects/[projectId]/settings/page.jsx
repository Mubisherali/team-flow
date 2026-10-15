// -------------------------------------------------------------
// Project Settings Page
// -------------------------------------------------------------
//
// URL: /workspaces/[id]/projects/[projectId]/settings
//
// AUTH: workspace owner or manager only.
//   Members → 404 (don't leak existence).
//
// STRUCTURE:
//   page.jsx (server) → auth + fetch project
//   <ProjectSettingsForm>  (client) → rename, description, color
//   <DeleteProjectButton>  (client) → danger zone
//
// POLISH:
//   - Card surface matches TaskDetailModal (dark #0f1115)
//   - Glass danger zone
//   - Tighter type scale (Wave-3)
//   - Back link + focus rings
//   - A11y: section landmarks, aria-hidden on decorative SVGs
//
// PRESERVED:
//   - Same server logic (auth → role gate → fetch)
//   - notFound() for non-managers
//   - Same component structure
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canEditProject,
} from '@/lib/permissions';
import ProjectSettingsForm from '@/components/project/ProjectSettingsForm';
import DeleteProjectButton from '@/components/project/DeleteProjectButton';
import { DEFAULT_PROJECT_COLOR } from '@/lib/project-colors';

export default async function ProjectSettingsPage({ params }) {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id: workspaceId, projectId } = await params;

  // ─── Role check ───
  const role = await getMemberRole(session.user.id, workspaceId);
  if (!canEditProject(role)) {
    notFound();
  }

  // ─── Fetch project ───
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      workspaceId: true,
    },
  });

  if (!project || project.workspaceId !== workspaceId) {
    notFound();
  }

  // ─── Render ───
  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* ══════════ BACK LINK ══════════ */}
      <Link
        href={`/workspaces/${workspaceId}/projects/${projectId}`}
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
        Back to project
      </Link>

      {/* ══════════ HEADER ══════════ */}
      <header className="mb-8">
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          Project settings
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          {project.name}
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
          <ProjectSettingsForm
            workspaceId={workspaceId}
            projectId={projectId}
            initialName={project.name}
            initialDescription={project.description || ''}
            initialColor={project.color || DEFAULT_PROJECT_COLOR}
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
                Delete this project
              </h3>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 mt-1 max-w-md leading-relaxed">
                Once deleted, the project and all its tasks are permanently
                removed. Members will remain in the workspace.
              </p>
            </div>
            <DeleteProjectButton
              workspaceId={workspaceId}
              projectId={projectId}
              projectName={project.name}
            />
          </div>
        </div>
      </section>
    </div>
  );
}