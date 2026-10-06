// -------------------------------------------------------------
// TaskFilterBar - Client-side filter controls
// -------------------------------------------------------------
//
// PROPS:
//   filters          : { assignee, priority }
//   onFiltersChange  : (newFilters) => void
//   projectMembers   : array — [{ userId, name, email }]
//   currentUserId    : string
//   totalCount       : number — total tasks (unfiltered)
//   visibleCount     : number — tasks matching the current filters
//
// FILTER SHAPE:
//   assignee : 'all' | 'me' | <userId>
//   priority : 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
//
// STATELESS:
//   Filters live in the parent (ProjectTasksSection). This bar
//   just reflects them + emits changes. Single source of truth.
// -------------------------------------------------------------

'use client';

import { TASK_PRIORITIES } from '@/lib/task-constants';

const TaskFilterBar = ({
  filters,
  onFiltersChange,
  projectMembers,
  currentUserId,
  totalCount,
  visibleCount,
}) => {
  // Is anything filtered right now?
  const hasActiveFilters =
    filters.assignee !== 'all' || filters.priority !== 'ALL';

  const update = (patch) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const clear = () => {
    onFiltersChange({ assignee: 'all', priority: 'ALL' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 px-1">
      {/* Label */}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Filter:
      </span>

      {/* Assignee */}
      <select
        value={filters.assignee}
        onChange={(e) => update({ assignee: e.target.value })}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="all">All assignees</option>
        <option value="me">Assigned to me</option>
        {projectMembers.length > 0 && (
          <optgroup label="Project members">
            {projectMembers
              .filter((m) => m.userId !== currentUserId)
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.email}
                </option>
              ))}
          </optgroup>
        )}
      </select>

      {/* Priority */}
      <select
        value={filters.priority}
        onChange={(e) => update({ priority: e.target.value })}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="ALL">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Clear button — only when filters are active */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
          Clear
        </button>
      )}

      {/* Count — only when filtered */}
      {hasActiveFilters && (
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {visibleCount} of {totalCount} task{totalCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
};

export default TaskFilterBar;