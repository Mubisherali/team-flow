// -------------------------------------------------------------
// ProjectsSection - Client wrapper for the projects grid
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by the workspace detail page. Owns modal state
//   and the "create project" trigger.
//
// STRUCTURE:
//   Header (title + count + New project button)
//     - Grid (ProjectCard × N + dashed "create" card)
//     OR
//     - Empty state (EmptyProjects)
//   CreateProjectModal (always rendered when canCreate)
//
// POLISH:
//   - Header typography matches Wave-3 scale
//   - Dashed "create" card gets glass + indigo hover + motion
//   - Empty state matches EmptyMembers/EmptyComments pattern
//   - Primary buttons get active:scale + focus rings
//   - A11y: section landmark, aria-labelledby, aria-hidden
//
// PRESERVED:
//   - Same props (workspaceId, initialProjects, canCreate)
//   - router.refresh() after creation (server is source of truth)
//   - All three render branches (has-projects / empty / modal)
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
      {/* ══════════ HEADER ══════════ */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2
            id="projects-heading"
            className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white truncate"
          >
            Projects
          </h2>
          {hasProjects && (
            <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
              {initialProjects.length}
            </span>
          )}
        </div>

        {canCreate && hasProjects && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="
              inline-flex items-center gap-1.5 flex-shrink-0
              px-3.5 py-2 rounded-lg
              bg-indigo-600 hover:bg-indigo-700
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              text-white text-[13px] font-medium
              transition-all duration-150
            "
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
            New project
          </button>
        )}
      </div>

      {/* ══════════ CONTENT ══════════ */}
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
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="
                group flex flex-col items-center justify-center gap-3
                rounded-2xl p-6 min-h-[160px]
                border-2 border-dashed
                border-gray-300 dark:border-white/[0.08]
                hover:border-indigo-500/40 dark:hover:border-indigo-500/40
                hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.05]
                active:scale-[0.99]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                transition-all duration-150
              "
            >
              <div
                className="
                  w-10 h-10 rounded-full
                  bg-gray-100 dark:bg-white/[0.04]
                  group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/15
                  flex items-center justify-center
                  transition-colors duration-150
                "
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="
                    text-gray-500 dark:text-gray-400
                    group-hover:text-indigo-600 dark:group-hover:text-indigo-400
                    transition-colors duration-150
                  "
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </div>
              <span
                className="
                  text-[13px] font-medium
                  text-gray-600 dark:text-gray-400
                  group-hover:text-indigo-600 dark:group-hover:text-indigo-400
                  transition-colors duration-150
                "
              >
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

      {/* ══════════ MODAL ══════════ */}
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
  <div
    className="
      flex flex-col items-center justify-center
      py-16 px-4 rounded-2xl
      border border-dashed
      border-gray-300 dark:border-white/[0.08]
      bg-white/60 dark:bg-white/[0.02]
    "
  >
    <div
      className="
        w-14 h-14 rounded-full mb-4
        bg-indigo-500/10 dark:bg-indigo-500/15
        flex items-center justify-center
      "
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-indigo-600 dark:text-indigo-400"
      >
        <path
          d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
      No projects yet
    </h3>
    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm leading-relaxed">
      {canCreate
        ? 'A project is where tasks live. Create one to get started.'
        : 'No projects yet. Ask a workspace owner or manager to create one.'}
    </p>

    {canCreate && (
      <button
        type="button"
        onClick={onCreateClick}
        className="
          inline-flex items-center gap-1.5
          px-4 py-2.5 rounded-xl
          bg-indigo-600 hover:bg-indigo-700
          active:scale-[0.98]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          text-white text-[13px] font-medium
          transition-all duration-150
        "
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
        Create your first project
      </button>
    )}
  </div>
);

export default ProjectsSection;