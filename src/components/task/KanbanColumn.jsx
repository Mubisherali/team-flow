// -------------------------------------------------------------
// KanbanColumn - Droppable column in the Kanban board
// -------------------------------------------------------------
//
// (header preserved + note below)
//
// CAN ADD TASK:
//   Passed by KanbanBoard. False for Review/Done when the
//   current user is a member (matches server-side workflow).
//   When false, the "+ Add task" button is hidden.
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
  onOpenFull,
  onAskQuestion,
  activeTaskId,
  canAddTask = true,
}) => {
  const meta = statusMeta(status);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const taskIds = tasks.map((t) => t.id);
  const isEmpty = tasks.length === 0;

  return (
    <div className="flex flex-col w-full min-w-[240px] sm:min-w-[260px] max-w-[320px]">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex items-center gap-2 px-2.5 mb-2.5">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot} ring-2 ring-white dark:ring-[#0a0c10]`}
        />

        <h3 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 truncate">
          {meta.label}
        </h3>

        <span
          className="
            ml-0.5 inline-flex items-center justify-center
            min-w-[20px] h-5 px-1.5
            rounded-md
            text-[10.5px] font-semibold
            bg-gray-100 dark:bg-white/[0.05]
            text-gray-500 dark:text-gray-400
          "
        >
          {tasks.length}
        </span>
      </div>

      {/* ══════════ DROP AREA ══════════ */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col gap-2
          p-2.5
          rounded-2xl
          border
          transition-all duration-200
          min-h-[200px]
          ${
            isOver
              ? 'border-indigo-400 dark:border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-500/[0.06] shadow-sm shadow-indigo-500/10'
              : 'border-gray-200/60 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.015]'
          }
        `}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onOpenFull={onOpenFull}
              onAskQuestion={onAskQuestion}
              isDragging={activeTaskId === task.id}
            />
          ))}
        </SortableContext>

        {/* ─── Empty state ─── */}
        {isEmpty && (
          <div
            className={`
              flex-1 flex flex-col items-center justify-center
              py-8 px-3
              transition-colors duration-200
            `}
          >
            {isOver ? (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-indigo-600 dark:text-indigo-400"
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
                <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  Drop here
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="w-7 h-7 rounded-md bg-gray-100/80 dark:bg-white/[0.03] flex items-center justify-center">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="text-gray-400 dark:text-gray-600"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 12h6" strokeLinecap="round" />
                  </svg>
                </span>
                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                  No tasks
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Add task button (hidden when canAddTask is false) ─── */}
        {canAddTask && (
          <button
            type="button"
            onClick={() => onAddTask?.(status)}
            className="
              group/add flex items-center gap-1.5
              px-2.5 py-2 mt-auto
              rounded-lg
              text-[12px] font-medium
              text-gray-500 dark:text-gray-500
              hover:text-indigo-600 dark:hover:text-indigo-400
              hover:bg-white dark:hover:bg-white/[0.04]
              active:scale-[0.98]
              transition-all duration-150
            "
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform duration-150 group-hover/add:rotate-90"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;