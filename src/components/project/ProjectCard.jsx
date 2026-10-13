// -------------------------------------------------------------
// ProjectCard - Card in the workspace projects grid
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by <ProjectsSection> for every visible project.
//
// STRUCTURE:
//   <Link>
//     - Header (colored avatar + name + description snippet)
//     - Spacer
//     - Footer (member count · task count)
//
// POLISH:
//   - Card surface matches TaskDetailModal (dark #0f1115)
//   - Soft indigo hover: border tint + subtle shadow + tiny lift
//   - Focus-visible ring for keyboard users
//   - Active scale for tactile press
//   - Avatar reacts to card hover (subtle scale)
//   - A11y: aria-hidden on decorative SVGs
//
// PRESERVED:
//   - Same props (project, workspaceId)
//   - <Link> (not a button — middle-click, right-click, SR)
//   - Initials / color fallback / pluralization logic
//   - min-h-[160px] for grid alignment
// -------------------------------------------------------------

import Link from 'next/link';

const ProjectCard = ({ project, workspaceId }) => {
  // 2-letter initials for the avatar
  const initials = project.name.trim().slice(0, 2).toUpperCase();

  // Fallback color if the project somehow has none.
  const color = project.color || '#6366f1';

  return (
    <Link
      href={`/workspaces/${workspaceId}/projects/${project.id}`}
      className="
        group flex flex-col
        rounded-2xl p-5 min-h-[160px]
        border border-gray-200 dark:border-white/[0.08]
        bg-white dark:bg-[#0f1115]
        hover:border-indigo-500/40 dark:hover:border-indigo-500/40
        hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-black/30
        hover:-translate-y-0.5
        active:scale-[0.99]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
        transition-all duration-150
      "
    >
      {/* ─── Header: avatar + name ─── */}
      <div className="flex items-start gap-3.5 mb-3">
        <div
          className="
            w-10 h-10 rounded-xl flex-shrink-0
            flex items-center justify-center
            text-[11px] font-bold tracking-wide text-white
            ring-1 ring-inset ring-white/15
            transition-transform duration-200
            group-hover:scale-105
          "
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="
              text-[13px] font-semibold text-gray-900 dark:text-white
              group-hover:text-indigo-600 dark:group-hover:text-indigo-400
              truncate
              transition-colors duration-150
            "
          >
            {project.name}
          </h3>
          {project.description ? (
            <p className="text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-[11.5px] text-gray-400 dark:text-gray-500 italic mt-1">
              No description
            </p>
          )}
        </div>
      </div>

      {/* ─── Spacer — push the footer to the bottom ─── */}
      <div className="flex-1" />

      {/* ─── Footer: counts ─── */}
      <div
        className="
          flex items-center gap-4 pt-3
          border-t border-gray-100 dark:border-white/[0.06]
          text-[11.5px] text-gray-600 dark:text-gray-400
        "
      >
        <div className="flex items-center gap-1.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
              strokeLinecap="round"
            />
            <circle cx="9" cy="7" r="4" />
            <path
              d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              strokeLinecap="round"
            />
          </svg>
          <span>
            {project.memberCount}{' '}
            {project.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M9 11l3 3L22 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            {project.taskCount}{' '}
            {project.taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;