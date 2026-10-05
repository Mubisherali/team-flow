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
// -------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getMemberRole,
  canManageProjectMembers,
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
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={`/workspaces/${workspaceId}/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to project
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {project.name}
        </p>
      </div>

      {/* General */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          General
        </h2>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <ProjectSettingsForm
            workspaceId={workspaceId}
            projectId={projectId}
            initialName={project.name}
            initialDescription={project.description || ''}
            initialColor={project.color || DEFAULT_PROJECT_COLOR}
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
                Delete this project
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
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