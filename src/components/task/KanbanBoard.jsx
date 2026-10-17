// -------------------------------------------------------------
// KanbanBoard - Full drag-and-drop Kanban board
// -------------------------------------------------------------
//
// (header preserved + note below)
//
// CAN ADD TASK (per column):
//   - TODO, IN_PROGRESS → everyone
//   - REVIEW, DONE      → owners/managers only
//   Matches the workflow rule (members can't move to DONE).
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';

import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { TASK_STATUSES } from '@/lib/task-constants';
import {
  groupTasksByStatus,
  computeReorder,
  applyUpdates,
} from '@/lib/kanban';

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
  const [error, setError] = useState('');

  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks]);

  const isPrivileged =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const grouped = groupTasksByStatus(tasks);

  const activeTask = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId)
    : null;

  // ─── Which columns can this user create in? ───
  const canAddTaskIn = (status) => {
    if (isPrivileged) return true;
    // Members: only Todo + In Progress. Review/Done are
    // destinations, not starting points.
    return status === 'TODO' || status === 'IN_PROGRESS';
  };

  // ─── Permission check (for drag) ───
  const canMoveTaskTo = (task, newStatus) => {
    if (!task || !newStatus) return false;
    if (newStatus === task.status) return true;

    if (isPrivileged) return true;

    const isMyTask =
      task.assigneeId === currentUserId ||
      task.createdById === currentUserId;
    if (!isMyTask) return false;

    if (newStatus === 'DONE') return false;

    return true;
  };

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
    setError('');
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

    let newStatus;
    let newIndex;

    if (typeof overId === 'string' && overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '');
      const destTasks = grouped[newStatus] || [];
      newIndex = destTasks.filter((t) => t.id !== draggedTaskId).length;
    } else {
      const targetTask = tasks.find((t) => t.id === overId);
      if (!targetTask) return;

      newStatus = targetTask.status;
      const destTasks = grouped[newStatus] || [];
      newIndex = destTasks.findIndex((t) => t.id === overId);

      const currentIndex = destTasks.findIndex((t) => t.id === draggedTaskId);
      if (currentIndex === newIndex) return;
    }

    if (!canMoveTaskTo(draggedTask, newStatus)) {
      if (newStatus === 'DONE') {
        setError(
          'Only managers can move tasks to Done. Move it to Review for approval.'
        );
      } else {
        setError('You can only move your own tasks.');
      }
      setTimeout(() => setError(''), 5000);
      return;
    }

    await performMove(draggedTaskId, newStatus, newIndex);
  };

  const performMove = async (taskId, newStatus, newIndex) => {
    const snapshot = tasks;

    const updates = computeReorder(tasks, taskId, newStatus, newIndex);
    if (updates.length === 0) return;

    const next = applyUpdates(tasks, updates);
    setTasks(next);

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newStatus, newIndex }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTasks(snapshot);
        setError(data.error || 'Failed to move task');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('[REORDER_FETCH]', err);
      setTasks(snapshot);
      setError('Network error. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 0 }}
            exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="
                flex items-start gap-2.5
                p-3 rounded-xl
                bg-amber-50 dark:bg-amber-500/10
                border border-amber-200 dark:border-amber-500/20
              "
            >
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
              <p className="text-[13px] text-amber-800 dark:text-amber-200 flex-1">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 flex-shrink-0 transition-colors"
                aria-label="Dismiss error"
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
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="-mx-1 px-1 flex gap-3 sm:gap-4 overflow-x-auto pb-3">
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

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <motion.div
              initial={{ scale: 1.02, rotate: -1.5 }}
              animate={{ scale: 1.02, rotate: -1.5 }}
              className="
                w-[260px] sm:w-[280px]
                cursor-grabbing
                rotate-1
                opacity-95
                shadow-2xl shadow-black/20 dark:shadow-black/50
              "
            >
              <TaskCard
                task={activeTask}
                onOpen={null}
                onOpenFull={null}
                onAskQuestion={null}
                isDragging={false}
              />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;