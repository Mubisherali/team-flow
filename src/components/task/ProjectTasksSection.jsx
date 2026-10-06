// -------------------------------------------------------------
// ProjectTasksSection - Orchestrator for the Kanban board
// -------------------------------------------------------------
//
// PROPS:
//   projectId       : string
//   initialTasks    : array (server-fetched)
//   projectMembers  : array
//   currentUserId   : string
//   workspaceRole   : 'OWNER' | 'MANAGER' | 'MEMBER'
//
// WORKFLOW:
//   Passes currentUserId + workspaceRole down to KanbanBoard,
//   CreateTaskModal, and TaskDetailModal so they can enforce
//   the assignment + workflow rules client-side (server re-checks).
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

  // Task shown in detail modal
  const detailTask = detailTaskId
    ? initialTasks.find((t) => t.id === detailTaskId) || null
    : null;

  // Close detail modal if the task disappears
  useEffect(() => {
    if (detailTaskId && !detailTask) {
      setDetailTaskId(null);
    }
  }, [detailTaskId, detailTask]);

  // Permission for editing a specific task
  const isPrivileged =
    workspaceRole === 'OWNER' || workspaceRole === 'MANAGER';

  const canEditTask = (task) => {
    if (!task) return false;
    if (isPrivileged) return true;
    if (task.assigneeId === currentUserId) return true;
    if (task.createdById === currentUserId) return true;
    return false;
  };

  // Handlers
  const handleOpenTask = (taskId) => setDetailTaskId(taskId);

  const handleOpenCreate = (defaultStatus = 'TODO') =>
    setCreateModal({ isOpen: true, defaultStatus });

  const handleCloseCreate = () =>
    setCreateModal((prev) => ({ ...prev, isOpen: false }));

  const handleTaskDeleted = () => setDetailTaskId(null);

  const totalCount = initialTasks.length;
  const visibleCount = visibleTasks.length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tasks
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              {totalCount}
            </span>
          )}
        </h2>

        <button
          type="button"
          onClick={() => handleOpenCreate('TODO')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New task
        </button>
      </div>

      {/* Filter bar */}
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

      {/* Board / empty states */}
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
          currentUserId={currentUserId}
          currentUserRole={workspaceRole}
        />
      )}

      {/* Create modal */}
      <CreateTaskModal
        isOpen={createModal.isOpen}
        onClose={handleCloseCreate}
        projectId={projectId}
        projectMembers={projectMembers}
        defaultStatus={createModal.defaultStatus}
        currentUserId={currentUserId}
        currentUserRole={workspaceRole}
      />

      {/* Detail modal */}
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
    </>
  );
};

// =============================================================
// EmptyTasks
// =============================================================
const EmptyTasks = ({ onCreateClick }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
      No tasks yet
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
      Break your project into tasks to start tracking progress.
    </p>
    <button
      onClick={onCreateClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
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
  <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-500 dark:text-gray-400"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
      No matching tasks
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
      No tasks match the current filters.
    </p>
    <button
      onClick={onClear}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
    >
      Clear filters
    </button>
  </div>
);

export default ProjectTasksSection;