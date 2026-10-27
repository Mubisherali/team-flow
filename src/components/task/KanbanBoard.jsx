
"use client";

// -------------------------------------------------------------
// KanbanBoard - Premium drag-and-drop Kanban board
// UI polish only: workflow, permissions and API behavior retained.
// -------------------------------------------------------------

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";

import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import { TASK_STATUSES } from "@/lib/task-constants";
import {
  groupTasksByStatus,
  computeReorder,
  applyUpdates,
} from "@/lib/kanban";

const KanbanBoard = ({
  projectId,
  initialTasks,
  onOpenTask,
  onAddTask,
  onOpenFull,
  onAskQuestion,
  currentUserId,
  currentUserRole,
}) => {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks]);

  const isPrivileged =
    currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const grouped = groupTasksByStatus(tasks);

  const activeTask = activeTaskId
    ? tasks.find((task) => task.id === activeTaskId)
    : null;

  // Members can create tasks only in TODO and IN_PROGRESS.
  const canAddTaskIn = (status) => {
    if (isPrivileged) return true;

    return status === "TODO" || status === "IN_PROGRESS";
  };

  // Preserve existing task movement permissions.
  const canMoveTaskTo = (task, newStatus) => {
    if (!task || !newStatus) return false;
    if (newStatus === task.status) return true;

    if (isPrivileged) return true;

    const isMyTask =
      task.assigneeId === currentUserId ||
      task.createdById === currentUserId;

    if (!isMyTask) return false;
    if (newStatus === "DONE") return false;

    return true;
  };

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
    setError("");
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const draggedTaskId = active.id;
    const draggedTask = tasks.find(
      (task) => task.id === draggedTaskId,
    );

    if (!draggedTask) return;

    const overId = over.id;

    let newStatus;
    let newIndex;

    if (
      typeof overId === "string" &&
      overId.startsWith("column-")
    ) {
      newStatus = overId.replace("column-", "");

      const destTasks = grouped[newStatus] || [];

      newIndex = destTasks.filter(
        (task) => task.id !== draggedTaskId,
      ).length;
    } else {
      const targetTask = tasks.find(
        (task) => task.id === overId,
      );

      if (!targetTask) return;

      newStatus = targetTask.status;

      const destTasks = grouped[newStatus] || [];

      newIndex = destTasks.findIndex(
        (task) => task.id === overId,
      );

      const currentIndex = destTasks.findIndex(
        (task) => task.id === draggedTaskId,
      );

      if (
        draggedTask.status === newStatus &&
        currentIndex === newIndex
      ) {
        return;
      }
    }

    if (!canMoveTaskTo(draggedTask, newStatus)) {
      if (newStatus === "DONE") {
        setError(
          "Only managers can move tasks to Done. Move it to Review for approval.",
        );
      } else {
        setError("You can only move your own tasks.");
      }

      setTimeout(() => setError(""), 5000);
      return;
    }

    await performMove(draggedTaskId, newStatus, newIndex);
  };

  const performMove = async (taskId, newStatus, newIndex) => {
    const snapshot = tasks;

    const updates = computeReorder(
      tasks,
      taskId,
      newStatus,
      newIndex,
    );

    if (updates.length === 0) return;

    const next = applyUpdates(tasks, updates);
    setTasks(next);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            newStatus,
            newIndex,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        setTasks(snapshot);
        setError(data.error || "Failed to move task");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      console.error("[REORDER_FETCH]", err);

      setTasks(snapshot);
      setError("Network error. Please try again.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "DONE",
  ).length;

  const completionPercent =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <div className="min-w-0 space-y-5">
      {/* BOARD SUMMARY */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm shadow-gray-950/[0.02] dark:border-white/[0.08] dark:bg-[#101116] dark:shadow-black/[0.08] sm:rounded-[22px] sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-indigo-500/[0.07] blur-3xl dark:bg-indigo-400/[0.08]"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-gray-200">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="5" height="16" rx="1.5" />
                <rect x="10" y="4" width="5" height="11" rx="1.5" />
                <rect x="17" y="4" width="4" height="14" rx="1.5" />
              </svg>
            </div>

            <div className="min-w-0">
              <h3 className="text-[13px] font-bold tracking-tight text-gray-900 dark:text-white">
                Board overview
              </h3>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Organize work across your workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-right">
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                Total tasks
              </p>
              <p className="mt-1 text-lg font-bold leading-none tracking-tight text-gray-950 dark:text-white">
                {totalTasks}
              </p>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-white/[0.09]" />

            <div className="text-right">
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                Completed
              </p>
              <p className="mt-1 text-lg font-bold leading-none tracking-tight text-gray-950 dark:text-white">
                {completionPercent}%
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.07]">
          <motion.div
            className="h-full rounded-full bg-indigo-500"
            initial={false}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ERROR / PERMISSION NOTICE */}
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="kanban-error"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.08]">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="M12 8v4m0 4h.01"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <p className="flex-1 pt-1 text-[12px] leading-5 text-amber-900 dark:text-amber-200">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:text-amber-300 dark:hover:bg-amber-500/15"
                aria-label="Dismiss error"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    d="m18 6-12 12M6 6l12 12"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KANBAN COLUMNS */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative">
          <div
            className="-mx-2 flex items-stretch gap-3 overflow-x-auto px-2 pb-4 pt-1 sm:gap-4 sm:pb-5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(156,163,175,.4) transparent",
            }}
          >
            {TASK_STATUSES.map((status) => (
              <KanbanColumn
                key={status.value}
                status={status.value}
                tasks={grouped[status.value] || []}
                onOpenTask={onOpenTask}
                onAddTask={onAddTask}
                onOpenFull={onOpenFull}
                onAskQuestion={onAskQuestion}
                activeTaskId={activeTaskId}
                canAddTask={canAddTaskIn(status.value)}
              />
            ))}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-white/50 to-transparent dark:from-[#0a0c10]/30"
          />
        </div>

        {/* DRAG OVERLAY */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <motion.div
              initial={{ scale: 1.02, rotate: -1 }}
              animate={{ scale: 1.03, rotate: -1 }}
              className="w-[260px] cursor-grabbing opacity-95 shadow-2xl shadow-gray-950/20 sm:w-[280px] dark:shadow-black/50"
            >
              <div className="pointer-events-none rounded-2xl ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-white dark:ring-offset-[#101116]">
                <TaskCard
                  task={activeTask}
                  onOpen={null}
                  onOpenFull={null}
                  onAskQuestion={null}
                  isDragging={false}
                />
              </div>
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* BOARD FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5">
        <p className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-500">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path
              d="M12 3v18m-9-9h18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Drag tasks between columns to update their status.
        </p>

        <span className="text-[10px] tabular-nums text-gray-400 dark:text-gray-600">
          {completedTasks} / {totalTasks} completed
        </span>
      </div>
    </div>
  );
};

export default KanbanBoard;
