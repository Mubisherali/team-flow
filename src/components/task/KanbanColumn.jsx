
"use client";

// -------------------------------------------------------------
// KanbanColumn - Premium droppable Kanban column
// UI polish only: props, permissions and task interactions retained.
// -------------------------------------------------------------

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import TaskCard from "./TaskCard";
import { statusMeta } from "@/lib/task-constants";

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

  const taskIds = tasks.map((task) => task.id);
  const isEmpty = tasks.length === 0;

  const statusStyles = {
    TODO: {
      accent: "bg-slate-400",
      badge:
        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300",
    },
    IN_PROGRESS: {
      accent: "bg-blue-500",
      badge:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    },
    REVIEW: {
      accent: "bg-amber-500",
      badge:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    },
    DONE: {
      accent: "bg-emerald-500",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
  };

  const style = statusStyles[status] || statusStyles.TODO;

  return (
    <section
      aria-label={`${meta.label} tasks`}
      className="flex w-[270px] shrink-0 flex-col sm:w-[290px] lg:w-[300px]"
    >
      {/* COLUMN HEADER */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm shadow-gray-950/[0.02] dark:border-white/[0.08] dark:bg-[#101116] dark:shadow-black/[0.06]">
        <div className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
          <span
            className={`h-8 w-1 shrink-0 rounded-full ${style.accent}`}
            aria-hidden="true"
          />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
              aria-hidden="true"
            />

            <h3 className="truncate text-[12px] font-bold tracking-tight text-gray-800 dark:text-gray-200 sm:text-[13px]">
              {meta.label}
            </h3>
          </div>

          <span
            aria-label={`${tasks.length} tasks`}
            className={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg border px-1.5 text-[10px] font-bold tabular-nums ${style.badge}`}
          >
            {tasks.length}
          </span>
        </div>

        <div className="h-px bg-gray-100 dark:bg-white/[0.055]" />

        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
            {isEmpty
              ? "No activity yet"
              : `${tasks.length} ${tasks.length === 1 ? "item" : "items"}`}
          </span>

          {status === "DONE" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="m5 12 4 4L19 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Completed
            </span>
          )}
        </div>
      </div>

      {/* DROP AREA */}
      <div
        ref={setNodeRef}
        className={`
          relative flex min-h-[280px] flex-1 flex-col gap-2.5
          overflow-hidden rounded-2xl border p-2.5
          transition-[background-color,border-color,box-shadow] duration-200
          sm:rounded-[22px] sm:p-3
          ${
            isOver
              ? "border-indigo-400 bg-indigo-50/70 shadow-md shadow-indigo-500/[0.07] dark:border-indigo-400/60 dark:bg-indigo-500/[0.07] dark:shadow-indigo-500/[0.04]"
              : "border-gray-200/80 bg-gray-50/70 dark:border-white/[0.065] dark:bg-white/[0.018]"
          }
        `}
      >
        {/* Subtle top highlight when dragging over */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-4 top-0 h-px transition-opacity duration-200 ${
            isOver
              ? "bg-indigo-400 opacity-100 dark:bg-indigo-400"
              : "bg-transparent opacity-0"
          }`}
        />

        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
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

        {/* EMPTY STATE */}
        {isEmpty && (
          <div
            className={`flex min-h-[185px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors duration-200 ${
              isOver
                ? "border-indigo-400/70 bg-indigo-100/50 dark:border-indigo-400/40 dark:bg-indigo-500/[0.07]"
                : "border-gray-200/90 bg-white/50 dark:border-white/[0.065] dark:bg-white/[0.012]"
            }`}
          >
            <div
              className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200 ${
                isOver
                  ? "scale-105 border-indigo-200 bg-indigo-100 text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "border-gray-200 bg-white text-gray-400 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-gray-500"
              }`}
              aria-hidden="true"
            >
              {isOver ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="3"
                  />
                  <path
                    d="M8 9h8M8 13h5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            <p
              className={`text-[12px] font-semibold ${
                isOver
                  ? "text-indigo-700 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {isOver ? "Drop task here" : "Nothing here yet"}
            </p>

            <p className="mt-1 max-w-[180px] text-[10px] leading-5 text-gray-400 dark:text-gray-500">
              {isOver
                ? "Release to move the task into this column."
                : "Tasks will appear here as your workflow progresses."}
            </p>
          </div>
        )}

        {/* ADD TASK — EXISTING PERMISSION RULE */}
        {canAddTask && (
          <button
            type="button"
            onClick={() => onAddTask?.(status)}
            className="group/add mt-auto flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300/90 bg-white/50 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 transition-all duration-200 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.99] dark:border-white/[0.09] dark:bg-white/[0.012] dark:text-gray-400 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/[0.045] dark:hover:text-indigo-300"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all duration-200 group-hover/add:border-indigo-200 group-hover/add:bg-indigo-50 group-hover/add:text-indigo-600 dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-gray-400 dark:group-hover/add:border-indigo-400/20 dark:group-hover/add:bg-indigo-500/10 dark:group-hover/add:text-indigo-300">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover/add:rotate-90"
              >
                <path
                  d="M12 5v14M5 12h14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <span className="flex-1">Add task</span>

            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
              className="opacity-0 transition-all duration-200 group-hover/add:translate-x-0.5 group-hover/add:opacity-100"
            >
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Permission hint for members */}
        {!canAddTask && (
          <div className="mt-auto flex items-center gap-2 px-2 py-2 text-[10px] text-gray-400 dark:text-gray-600">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                strokeLinecap="round"
              />
            </svg>
            <span>Managed by project leads</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default KanbanColumn;
