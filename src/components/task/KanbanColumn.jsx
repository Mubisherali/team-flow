// -------------------------------------------------------------
// KanbanColumn - Droppable column in the Kanban board
// -------------------------------------------------------------
//
// PROPS:
//   status       : 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
//   tasks        : array of tasks in this column
//   onOpenTask   : (taskId) => void — open the detail modal
//   onAddTask    : (status) => void — open create modal prefilled
//   activeTaskId : currently dragged task id (to dim its card)
//
// TWO PIECES OF @dnd-kit MAGIC:
//   1. useDroppable — marks this column as a drop target
//   2. SortableContext — tells dnd-kit the sortable order of
//      the tasks inside this column (needed for intra-column
//      reordering with the sortable preset)
// -------------------------------------------------------------

'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import TaskCard from './TaskCard';
import { statusMeta } from '@/lib/task-constants';

const KanbanColumn = ({
  status,
  tasks,
  onOpenTask,
  onAddTask,
  activeTaskId,
}) => {
  const meta = statusMeta(status);

  // Mark this column as droppable. dnd-kit uses `id` to
  // distinguish drop targets — we use the status value.
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  // Task ids feed the sortable context so dnd-kit knows the
  // order of items within this column.
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-full min-w-[260px] max-w-[320px]">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {meta.label}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* ─── Drop area ─── */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 p-2 rounded-xl border-2 transition-colors min-h-[200px] ${
          isOver
            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-transparent bg-gray-50/70 dark:bg-gray-900/40'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              isDragging={activeTaskId === task.id}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              No tasks
            </p>
          </div>
        )}

        {/* Add task button */}
        <button
          type="button"
          onClick={() => onAddTask?.(status)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add task
        </button>
      </div>
    </div>
  );
};

export default KanbanColumn;