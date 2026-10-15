// -------------------------------------------------------------
// TaskFilterBar - Client-side filter controls
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by ProjectTasksSection above the Kanban board
//   (only when tasks exist).
//
// STRUCTURE:
//   Row: "Filter:" label · assignee select · priority select ·
//        Clear button (if active) · count (if active)
//
// POLISH:
//   - Selects get soft indigo focus ring (matches form inputs)
//   - Clear button gets active:scale + focus ring
//   - Count uses tabular-nums
//   - Type scale aligned to Wave-3
//   - A11y: aria-labels on selects, aria-hidden on icon
//
// PRESERVED:
//   - Same props (filters, onFiltersChange, projectMembers,
//     currentUserId, totalCount, visibleCount)
//   - Same filter shape
//   - Stateless (filters live in parent)
//   - Same optgroup separation (members excluding "me")
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

  const selectClasses = `
    text-[12px] px-2.5 py-1.5 rounded-lg
    bg-white dark:bg-white/[0.03]
    text-gray-700 dark:text-gray-300
    border border-gray-200 dark:border-white/[0.08]
    focus:outline-none
    focus:ring-2 focus:ring-indigo-500/20
    focus:border-indigo-500 dark:focus:border-indigo-500/60
    transition-all duration-150
  `;

  return (
    <div className="flex flex-wrap items-center gap-2.5 py-3">
      {/* Label */}
      <span className="text-[11.5px] font-medium text-gray-500 dark:text-gray-400">
        Filter:
      </span>

      {/* Assignee */}
      <select
        value={filters.assignee}
        onChange={(e) => update({ assignee: e.target.value })}
        aria-label="Filter by assignee"
        className={selectClasses}
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
        aria-label="Filter by priority"
        className={selectClasses}
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
          className="
            inline-flex items-center gap-1
            px-2.5 py-1.5 rounded-lg
            text-[11.5px] font-medium
            text-gray-500 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-white
            hover:bg-gray-100 dark:hover:bg-white/[0.06]
            active:scale-[0.96]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
            transition-all duration-150
          "
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
          Clear
        </button>
      )}

      {/* Count — only when filtered */}
      {hasActiveFilters && (
        <span className="ml-auto text-[11.5px] text-gray-500 dark:text-gray-400 tabular-nums">
          {visibleCount} of {totalCount} task{totalCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
};

export default TaskFilterBar;