// -------------------------------------------------------------
// ProjectsSection - Client wrapper for the projects grid
// -------------------------------------------------------------
//
// PROPS:
//   workspaceId     : string
//   initialProjects : array (from server)
//   canCreate       : boolean (owner or manager)
//
// WHY A CLIENT WRAPPER:
//   The parent page is a server component that fetches data.
//   But we need:
//     - Modal state (open/close)
//     - router.refresh() after creation
//     - Click handlers
//   So we isolate the interactive bits here.
//
// AFTER CREATION:
//   We call router.refresh() so the server component re-runs
//   and the new project appears. We DON'T mutate the array
//   in place — the server is the source of truth.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import CreateProjectModal from './CreateProjectModal';
import ProjectCard from './ProjectCard';

const ProjectsSection = ({ workspaceId, initialProjects, canCreate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const hasProjects = initialProjects.length > 0;

  const handleCreated = () => {
    // The modal already redirects to the new project.
    // This refresh is a safety net in case the redirect
    // doesn't fire (e.g. user navigates back).
    router.refresh();
  };

  return (
    <>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Projects
          {hasProjects && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              {initialProjects.length}
            </span>
          )}
        </h2>

        {canCreate && hasProjects && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New project
          </button>
        )}
      </div>

      {/* ─── Content ─── */}
      {hasProjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              workspaceId={workspaceId}
            />
          ))}

          {/* Dashed "create" card at the end of the grid */}
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 min-h-[160px] hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 flex items-center justify-center transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Create project
              </span>
            </button>
          )}
        </div>
      ) : (
        <EmptyProjects
          canCreate={canCreate}
          onCreateClick={() => setIsModalOpen(true)}
        />
      )}

      {/* ─── Modal ─── */}
      {canCreate && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workspaceId={workspaceId}
          onCreated={handleCreated}
        />
      )}
    </>
  );
};

// =============================================================
// EmptyProjects - shown when there are no projects yet
// =============================================================
const EmptyProjects = ({ canCreate, onCreateClick }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-indigo-600 dark:text-indigo-400"
      >
        <path
          d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
      No projects yet
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
      {canCreate
        ? 'A project is where tasks live. Create one to get started.'
        : 'No projects yet. Ask a workspace owner or manager to create one.'}
    </p>
    {canCreate && (
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Create your first project
      </button>
    )}
  </div>
);

export default ProjectsSection;