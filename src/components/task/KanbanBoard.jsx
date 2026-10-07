// -------------------------------------------------------------
// KanbanBoard - Full drag-and-drop Kanban board
// -------------------------------------------------------------
//
// PROPS:
//   projectId        : string
//   initialTasks     : array (server-fetched, filtered by parent)
//   onOpenTask       : (taskId) => void
//   onAddTask        : (status) => void
//   currentUserId    : string
//   currentUserRole  : 'OWNER' | 'MANAGER' | 'MEMBER'
//
// WORKFLOW ENFORCEMENT:
//   Before applying an optimistic move, we check whether the
//   current user is allowed to move this task to the target
//   status. If not → block + show a message. Same rules as the
//   server (see canMoveTaskTo in lib/permissions).
//
// OPTIMISTIC STRATEGY:
//   1. onDragEnd: check permission first
//   2. If allowed → compute new order, update state, PATCH API
//   3. If blocked → show error, don't move anything
//   4. On API error → revert to snapshot + show error
// -------------------------------------------------------------

"use client";

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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import { TASK_STATUSES } from "@/lib/task-constants";
import { groupTasksByStatus, computeReorder, applyUpdates } from "@/lib/kanban";

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

  // Sync when the parent re-fetches
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
    ? tasks.find((t) => t.id === activeTaskId)
    : null;

  // -----------------------------------------------------------
  // PERMISSION CHECK — mirrors canMoveTaskTo on the server
  // -----------------------------------------------------------
  const canMoveTaskTo = (task, newStatus) => {
    if (!task || !newStatus) return false;
    if (newStatus === task.status) return true; // no-op reorders always fine

    // Privileged: any move.
    if (isPrivileged) return true;

    // Members can only move their own tasks.
    const isMyTask =
      task.assigneeId === currentUserId || task.createdById === currentUserId;
    if (!isMyTask) return false;

    // Members can never move to DONE.
    if (newStatus === "DONE") return false;

    return true;
  };

  // -----------------------------------------------------------
  // DRAG HANDLERS
  // -----------------------------------------------------------
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
    const draggedTask = tasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    const overId = over.id;

    // ── Resolve the destination column + index ──
    let newStatus;
    let newIndex;

    if (typeof overId === "string" && overId.startsWith("column-")) {
      // Dropped on column whitespace
      newStatus = overId.replace("column-", "");
      const destTasks = grouped[newStatus] || [];
      newIndex = destTasks.filter((t) => t.id !== draggedTaskId).length;
    } else {
      // Dropped on another task card
      const targetTask = tasks.find((t) => t.id === overId);
      if (!targetTask) return;

      newStatus = targetTask.status;
      const destTasks = grouped[newStatus] || [];
      newIndex = destTasks.findIndex((t) => t.id === overId);

      // If the task is already in the target column and the drop
      // is a same-position no-op, skip.
      const currentIndex = destTasks.findIndex((t) => t.id === draggedTaskId);
      if (currentIndex === newIndex) return;
    }

    // ── Permission check BEFORE optimistic update ──
    if (!canMoveTaskTo(draggedTask, newStatus)) {
      if (newStatus === "DONE") {
        setError(
          "Only managers can move tasks to Done. Move it to Review for approval.",
        );
      } else {
        setError("You can only move your own tasks.");
      }
      // Auto-clear after a few seconds
      setTimeout(() => setError(""), 5000);
      return;
    }

    await performMove(draggedTaskId, newStatus, newIndex);
  };

  // -----------------------------------------------------------
  // PERFORM MOVE (optimistic + API)
  // -----------------------------------------------------------
  const performMove = async (taskId, newStatus, newIndex) => {
    const snapshot = tasks;

    const updates = computeReorder(tasks, taskId, newStatus, newIndex);
    if (updates.length === 0) return;

    const next = applyUpdates(tasks, updates);
    setTasks(next);

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, newStatus, newIndex }),
      });

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

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 flex items-start gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
            {error}
          </p>
          <button
            onClick={() => setError("")}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            aria-label="Dismiss"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-3">
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
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-2 opacity-95 shadow-xl">
              <TaskCard
                task={activeTask}
                onOpen={null}
                onOpenFull={null}
                onAskQuestion={null}
                isDragging={false}
              />{" "}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
