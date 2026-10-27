"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CreateProjectModal from "./CreateProjectModal";
import ProjectCard from "./ProjectCard";

const ProjectsSection = ({
  workspaceId,
  initialProjects = [],
  canCreate,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shouldOpenCreate = searchParams.get("new") === "true";

  const [isModalOpen, setIsModalOpen] = useState(shouldOpenCreate);

  const hasProjects = initialProjects.length > 0;

  useEffect(() => {
    const handleOpen = () => {
      if (canCreate) {
        setIsModalOpen(true);
      }
    };

    window.addEventListener("open-create-project", handleOpen);

    return () => {
      window.removeEventListener("open-create-project", handleOpen);
    };
  }, [canCreate]);

  useEffect(() => {
    if (shouldOpenCreate) {
      if (canCreate) {
        setIsModalOpen(true);
      }

      router.replace(`/workspaces/${workspaceId}`, {
        scroll: false,
      });
    }
  }, [shouldOpenCreate, canCreate, router, workspaceId]);

  const handleCreated = () => {
    router.refresh();
  };

  return (
    <>
      {/* Section header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h2
              id="projects-heading"
              className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white"
            >
              Projects
            </h2>

            <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
              {initialProjects.length}
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasProjects
              ? "Your workspace projects, all in one place."
              : "Create a project to start organizing your team's work."}
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-600/10 transition duration-150 hover:bg-indigo-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
          >
            <PlusIcon />
            New project
          </button>
        )}
      </div>

      {/* Project grid */}
      {hasProjects ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {initialProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              workspaceId={workspaceId}
            />
          ))}

          {canCreate && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="group flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-center transition duration-200 hover:border-indigo-400 hover:bg-indigo-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-white/[0.1] dark:bg-white/[0.015] dark:hover:border-indigo-400/50 dark:hover:bg-indigo-400/[0.04]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition duration-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-400 dark:group-hover:border-indigo-400/20 dark:group-hover:bg-indigo-400/[0.1] dark:group-hover:text-indigo-300">
                <PlusIcon size={21} />
              </div>

              <span className="mt-4 text-sm font-semibold text-gray-800 transition-colors group-hover:text-indigo-600 dark:text-gray-200 dark:group-hover:text-indigo-300">
                Create another project
              </span>

              <span className="mt-1.5 max-w-[220px] text-xs leading-5 text-gray-500 dark:text-gray-400">
                Start a new project and organize tasks with your team.
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

      {/* Modal */}
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
// Empty state
// =============================================================

function EmptyProjects({ canCreate, onCreateClick }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-gray-300 bg-white/60 px-5 py-14 dark:border-white/[0.1] dark:bg-white/[0.015] sm:px-8 sm:py-16">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-indigo-500/[0.07] blur-3xl" />

      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-400/15 dark:bg-indigo-400/[0.08] dark:text-indigo-300">
          <ProjectsIcon />
        </div>

        <span className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          Your workspace starts here
        </span>

        <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-950 dark:text-white">
          No projects yet
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {canCreate
            ? "Create your first project to bring tasks, teammates, and progress together in one organized space."
            : "There are no projects available yet. Ask a workspace owner or manager to create one."}
        </p>

        {canCreate && (
          <button
            type="button"
            onClick={onCreateClick}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
          >
            <PlusIcon />
            Create your first project
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================
// Inline icons
// =============================================================

function PlusIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18M8 4v5" />
    </svg>
  );
}

export default ProjectsSection;
