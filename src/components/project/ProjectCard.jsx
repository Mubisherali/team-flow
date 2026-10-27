
// -------------------------------------------------------------
// ProjectCard - Card in the workspace projects grid
// -------------------------------------------------------------
//
// PRESERVED:
//   - Same props (project, workspaceId)
//   - Same project navigation URL
//   - Initials and color fallback
//   - Member/task counts and pluralization
//   - Semantic Link behavior
//   - Minimum card height for grid alignment
//
// POLISH:
//   - Premium dark/light surfaces
//   - Subtle gradient and indigo hover treatment
//   - Refined project avatar
//   - Project status-style decorative indicator
//   - Improved spacing and typography
//   - Accessible focus-visible and active states
//   - Responsive text handling
// -------------------------------------------------------------

import Link from "next/link";

const ProjectCard = ({ project, workspaceId }) => {
  const initials = project.name.trim().slice(0, 2).toUpperCase();
  const color = project.color || "#6366f1";

  const memberCount = project.memberCount ?? 0;
  const taskCount = project.taskCount ?? 0;

  return (
    <Link
      href={`/workspaces/${workspaceId}/projects/${project.id}`}
      aria-label={`Open project ${project.name}`}
      className="
        group relative isolate flex min-h-[168px] flex-col
        overflow-hidden rounded-2xl border
        border-gray-200/80 bg-white p-5
        transition-all duration-200 ease-out
        hover:-translate-y-1
        hover:border-indigo-400/50
        hover:shadow-xl hover:shadow-indigo-500/[0.06]
        active:scale-[0.99]
        focus:outline-none
        focus-visible:ring-2 focus-visible:ring-indigo-500
        focus-visible:ring-offset-2
        focus-visible:ring-offset-white
        dark:border-white/[0.08]
        dark:bg-[#0f1115]
        dark:hover:border-indigo-400/40
        dark:hover:shadow-black/30
        dark:focus-visible:ring-offset-[#0a0a0a]
      "
    >
      {/* Subtle hover glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -right-12 -top-12 -z-10
          h-32 w-32 rounded-full opacity-0 blur-3xl
          transition-opacity duration-300
          group-hover:opacity-20
        "
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="mb-4 flex items-start gap-3.5">
        {/* Project avatar */}
        <div
          aria-hidden="true"
          className="
            relative flex h-11 w-11 shrink-0 items-center
            justify-center overflow-hidden rounded-xl
            text-xs font-bold tracking-wide text-white
            shadow-sm ring-1 ring-inset ring-white/15
            transition-transform duration-200
            group-hover:scale-[1.04]
          "
          style={{ backgroundColor: color }}
        >
          <span className="relative z-10">{initials}</span>

          <span
            className="
              pointer-events-none absolute inset-0
              bg-gradient-to-br from-white/20
              via-transparent to-black/10
            "
          />
        </div>

        {/* Project information */}
        <div className="min-w-0 flex-1 pt-0.5">
          <h3
            className="
              truncate text-sm font-semibold tracking-[-0.02em]
              text-gray-900 transition-colors duration-200
              group-hover:text-indigo-600
              dark:text-gray-100
              dark:group-hover:text-indigo-300
            "
          >
            {project.name}
          </h3>

          {project.description ? (
            <p
              className="
                mt-1.5 line-clamp-2 text-xs leading-[1.65]
                text-gray-500 dark:text-gray-400
              "
            >
              {project.description}
            </p>
          ) : (
            <p className="mt-1.5 text-xs italic text-gray-400 dark:text-gray-500">
              No description added
            </p>
          )}
        </div>

        {/* Navigation indicator */}
        <span
          aria-hidden="true"
          className="
            flex h-7 w-7 shrink-0 items-center justify-center
            rounded-lg border border-transparent
            text-gray-400 opacity-70
            transition-all duration-200
            group-hover:translate-x-0.5
            group-hover:border-indigo-500/15
            group-hover:bg-indigo-500/[0.06]
            group-hover:text-indigo-500
            group-hover:opacity-100
            dark:text-gray-500
            dark:group-hover:text-indigo-300
          "
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </span>
      </div>

      {/* Push metadata to the bottom */}
      <div className="flex-1" />

      {/* Footer */}
      <div
        className="
          flex flex-wrap items-center gap-x-5 gap-y-2
          border-t border-gray-100 pt-3.5
          text-[11px] font-medium text-gray-500
          dark:border-white/[0.07]
          dark:text-gray-400
        "
      >
        {/* Members */}
        <div className="flex items-center gap-2">
          <span
            className="
              flex h-7 w-7 items-center justify-center
              rounded-lg bg-gray-100 text-gray-500
              transition-colors duration-200
              group-hover:bg-indigo-50 group-hover:text-indigo-600
              dark:bg-white/[0.045] dark:text-gray-400
              dark:group-hover:bg-indigo-500/10
              dark:group-hover:text-indigo-300
            "
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>

          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {memberCount}
            </span>{" "}
            {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        {/* Tasks */}
        <div className="flex items-center gap-2">
          <span
            className="
              flex h-7 w-7 items-center justify-center
              rounded-lg bg-gray-100 text-gray-500
              transition-colors duration-200
              group-hover:bg-indigo-50 group-hover:text-indigo-600
              dark:bg-white/[0.045] dark:text-gray-400
              dark:group-hover:bg-indigo-500/10
              dark:group-hover:text-indigo-300
            "
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" />
              <path d="m8 15 2 2 4-4" />
            </svg>
          </span>

          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {taskCount}
            </span>{" "}
            {taskCount === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;