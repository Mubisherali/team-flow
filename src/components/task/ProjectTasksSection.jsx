// -------------------------------------------------------------
// ProjectTasksSection - Orchestrator for the Kanban board
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by the project detail page. Owns filter state,
//   create-task modal, and detail-task modal.
//
// STRUCTURE:
//   Section (aria-labelledby="tasks-heading")
//     - Header (title + count + New task button)
//     - TaskFilterBar (only when tasks exist)
//     - Board / EmptyTasks / NoMatches
//   CreateTaskModal
//   TaskDetailModal
//
// POLISH:
//   - Header typography matches Wave-3 (baseline-aligned count)
//   - Empty + NoMatches cards match EmptyMembers pattern
//   - Primary buttons get active:scale + focus rings
//   - A11y: section landmark, aria-labelledby, aria-hidden
//
// PRESERVED:
//   - Same props
//   - Same state (filters, createModal, detailTaskId)
//   - Same handlers (handleOpenTask, handleOpenCreate,
//     handleCloseCreate, handleTaskDeleted, handleOpenFull,
//     handleAskQuestion)
//   - Same filterTasks call + useMemo
//   - Same canEditTask logic
//   - Same KanbanBoard / modal usages
// -------------------------------------------------------------

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import KanbanBoard from './KanbanBoard';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import TaskFilterBar from './TaskFilterBar';
import { filterTasks } from '@/lib/kanban';

const ProjectTasksSection = ({
  projectId,
  workspaceId,
  initialTasks,
  projectMembers,
  currentUserId,
  workspaceRole,
}) => {
  const [filters, setFilters] = useState({
    assignee: 'all',
    priority: 'ALL',
  });

  const [createModal, setCreateModal] = useState({
    isOpen: false,
    defaultStatus: 'TODO',
  });
  const [detailTaskId, setDetailTaskId] = useState(null);

  const router = useRouter();

  // Filtered tasks
  const visibleTasks = useMemo(
    () => filterTasks(initialTasks, filters, currentUserId),
    [initialTasks, filters, currentUserId]
  );

  const detailTask = detailTaskId
    ? initialTasks.find((t) => t.id === detailTaskId) || null
    : null;

  useEffect(() => {
    if (detailTaskId && !detailTask) {
      setDetailTaskId(null);
    }
  }, [detailTaskId, detailTask]);

  const isPrivileged =
    workspaceRole === 'OWNER' || workspaceRole === 'MANAGER';

  const canEditTask = (task) => {
    if (!task) return false;
    if (isPrivileged) return true;
    if (task.assigneeId === currentUserId) return true;
    if (task.createdById === currentUserId) return true;
    return false;
  };

  // ─── Handlers ───
  const handleOpenTask = (taskId) => setDetailTaskId(taskId);

  const handleOpenCreate = (defaultStatus = 'TODO') =>
    setCreateModal({ isOpen: true, defaultStatus });

  const handleCloseCreate = () =>
    setCreateModal((prev) => ({ ...prev, isOpen: false }));

  const handleTaskDeleted = () => setDetailTaskId(null);

  // Navigate to the full task page
  const handleOpenFull = (taskId) => {
    router.push(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
    );
  };

  // Navigate to the task page + scroll to comments
  const handleAskQuestion = (taskId) => {
    router.push(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}#comments`
    );
  };

  const totalCount = initialTasks.length;
  const visibleCount = visibleTasks.length;

  return (
    <section aria-labelledby="tasks-heading">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2
            id="tasks-heading"
            className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white truncate"
          >
            Tasks
          </h2>
          {totalCount > 0 && (
            <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
              {totalCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate('TODO')}
          className="
            inline-flex items-center gap-1.5 flex-shrink-0
            px-3.5 py-2 rounded-lg
            bg-indigo-600 hover:bg-indigo-700
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
            text-white text-[13px] font-medium
            transition-all duration-150
          "
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New task
        </button>
      </div>

      {/* ══════════ FILTER BAR ══════════ */}
      {totalCount > 0 && (
        <TaskFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          projectMembers={projectMembers}
          currentUserId={currentUserId}
          totalCount={totalCount}
          visibleCount={visibleCount}
        />
      )}

      {/* ══════════ BOARD / EMPTY / NO MATCHES ══════════ */}
      {totalCount === 0 ? (
        <EmptyTasks onCreateClick={() => handleOpenCreate('TODO')} />
      ) : visibleCount === 0 ? (
        <NoMatches
          onClear={() => setFilters({ assignee: 'all', priority: 'ALL' })}
        />
      ) : (
        <KanbanBoard
          projectId={projectId}
          initialTasks={visibleTasks}
          onOpenTask={handleOpenTask}
          onAddTask={handleOpenCreate}
          onOpenFull={handleOpenFull}
          onAskQuestion={handleAskQuestion}
          currentUserId={currentUserId}
          currentUserRole={workspaceRole}
        />
      )}

      {/* ══════════ MODALS ══════════ */}
      <CreateTaskModal
        isOpen={createModal.isOpen}
        onClose={handleCloseCreate}
        projectId={projectId}
        projectMembers={projectMembers}
        defaultStatus={createModal.defaultStatus}
        currentUserId={currentUserId}
        currentUserRole={workspaceRole}
      />

      <TaskDetailModal
        isOpen={!!detailTask}
        onClose={() => setDetailTaskId(null)}
        projectId={projectId}
        task={detailTask}
        projectMembers={projectMembers}
        canEdit={canEditTask(detailTask)}
        currentUserId={currentUserId}
        currentUserRole={workspaceRole}
        onUpdated={() => {}}
        onDeleted={handleTaskDeleted}
      />
    </section>
  );
};

// =============================================================
// EmptyTasks
// =============================================================
const EmptyTasks = ({ onCreateClick }) => (
  <div
    className="
      flex flex-col items-center justify-center
      py-16 px-4 rounded-2xl
      border border-dashed
      border-gray-300 dark:border-white/[0.08]
      bg-white/60 dark:bg-white/[0.02]
    "
  >
    <div
      className="
        w-14 h-14 rounded-full mb-4
        bg-indigo-500/10 dark:bg-indigo-500/15
        flex items-center justify-center
      "
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-indigo-600 dark:text-indigo-400"
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
    </div>

    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
      No tasks yet
    </h3>
    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm leading-relaxed">
      Break your project into tasks to start tracking progress.
    </p>

    <button
      type="button"
      onClick={onCreateClick}
      className="
        inline-flex items-center gap-1.5
        px-4 py-2.5 rounded-xl
        bg-indigo-600 hover:bg-indigo-700
        active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
        text-white text-[13px] font-medium
        transition-all duration-150
      "
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
      Create your first task
    </button>
  </div>
);

// =============================================================
// NoMatches
// =============================================================
const NoMatches = ({ onClear }) => (
  <div
    className="
      flex flex-col items-center justify-center
      py-16 px-4 rounded-2xl
      border border-dashed
      border-gray-300 dark:border-white/[0.08]
      bg-white/60 dark:bg-white/[0.02]
    "
  >
    <div
      className="
        w-14 h-14 rounded-full mb-4
        bg-gray-100 dark:bg-white/[0.04]
        flex items-center justify-center
      "
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-gray-500 dark:text-gray-400"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    </div>

    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
      No matching tasks
    </h3>
    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm leading-relaxed">
      No tasks match the current filters.
    </p>

    <button
      type="button"
      onClick={onClear}
      className="
        text-[13px] font-medium
        text-indigo-600 hover:text-indigo-700
        dark:text-indigo-400 dark:hover:text-indigo-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
        rounded
        transition-colors duration-150
      "
    >
      Clear filters
    </button>
  </div>
);

export default ProjectTasksSection;