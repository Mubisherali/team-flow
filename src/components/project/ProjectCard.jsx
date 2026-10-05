// -------------------------------------------------------------
// ProjectCard - Card in the workspace projects grid
// -------------------------------------------------------------
//
// PROPS:
//   project : {
//     id, name, description, color,
//     memberCount, taskCount, isMember,
//     createdAt, updatedAt
//   }
//   workspaceId : string
//
// WHAT IT RENDERS:
//   - Colored avatar (2-letter initials)
//   - Name + description snippet
//   - Member + task count footer
//   - Whole card is a link to /workspaces/[id]/projects/[projectId]
//
// WHY A LINK NOT A BUTTON:
//   - Opens in new tab (middle-click / Ctrl+click) for free
//   - Right-click → "copy link" works
//   - Screen readers announce it correctly
//   - Browser status bar shows the URL on hover
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
      className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 min-h-[160px] hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-md transition-all"
    >
      {/* Header: avatar + name */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
            {project.name}
          </h3>
          {project.description ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">
              No description
            </p>
          )}
        </div>
      </div>

      {/* Spacer — push the footer to the bottom */}
      <div className="flex-1" />

      {/* Footer: counts */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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
            strokeWidth="2"
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