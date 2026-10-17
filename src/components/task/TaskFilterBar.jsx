// -------------------------------------------------------------
// TaskFilterBar - Client-side filter controls
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by ProjectTasksSection above the Kanban board
//   (only when tasks exist).
//
// STRUCTURE:
//   Row: "Filter:" label · assignee Select · priority Select ·
//        Clear button (if active) · count (if active)
//
// POLISH:
//   - Uses <Select> component (glass dropdown, keyboard nav,
//     color dots, dark mode compatible)
//   - All native <select> elements removed
//   - Priority options show colored dots
//   - Assignee options flattened (no optgroup)
//
// PRESERVED:
//   - Same props (filters, onFiltersChange, projectMembers,
//     currentUserId, totalCount, visibleCount)
//   - Same filter shape
//   - Stateless (filters live in parent)
//   - Same optgroup separation → now flattened:
//       "All assignees" → "Assigned to me" → project members
// -------------------------------------------------------------

'use client';

import { useMemo } from 'react';

import Select from '@/components/ui/Select';
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

  // ─── Assignee options ───
  // Flattened: "All assignees" → "Assigned to me" → members
  // (excluding current user — they already appear as "me").
  const assigneeOptions = useMemo(() => {
    const others = (projectMembers || []).filter(
      (m) => m.userId !== currentUserId
    );

    return [
      { value: 'all', label: 'All assignees' },
      { value: 'me', label: 'Assigned to me' },
      ...others.map((m) => ({
        value: m.userId,
        label: m.name || m.email,
      })),
    ];
  }, [projectMembers, currentUserId]);

  // ─── Priority options ───
  const priorityOptions = useMemo(
    () => [
      { value: 'ALL', label: 'All priorities' },
      ...TASK_PRIORITIES.map((p) => ({
        value: p.value,
        label: p.label,
        dot: p.dot,
      })),
    ],
    []
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5 py-3">
      {/* Label */}
      <span className="text-[11.5px] font-medium text-gray-500 dark:text-gray-400">
        Filter:
      </span>

      {/* Assignee */}
      <div className="w-[160px]">
        <Select
          value={filters.assignee}
          options={assigneeOptions}
          onChange={(v) => update({ assignee: v })}
          size="sm"
          menuAlign="left"
        />
      </div>

      {/* Priority */}
      <div className="w-[140px]">
        <Select
          value={filters.priority}
          options={priorityOptions}
          onChange={(v) => update({ priority: v })}
          size="sm"
          menuAlign="left"
        />
      </div>

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