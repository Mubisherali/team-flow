// -------------------------------------------------------------
// TaskDetailModal - Compact modal editor for a task
// -------------------------------------------------------------
//
// When to use:
//   Quick edits from the Kanban board. Click a card → opens
//   this modal. Full task editing lives on the task page.
//
// STRUCTURE:
//   Header (status dot + SaveIndicator + delete + close)
//   Body   (<TaskFields> — everything else)
//   Overlay (delete confirmation)
//
// STATE OWNERSHIP:
//   The modal owns:
//     - saveState / saveError (drives the header indicator)
//     - isDeleting / showDeleteConfirm (delete flow)
//   Field-level state lives inside <TaskFields>.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import TaskFields from './TaskFields';
import { statusMeta } from '@/lib/task-constants';

const TaskDetailModal = ({
  isOpen,
  onClose,
  projectId,
  task,
  projectMembers,
  canEdit,
  currentUserId,
  currentUserRole,
  onUpdated,
  onDeleted,
}) => {
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const router = useRouter();
  const titleRef = useRef(null);
  const savedTimerRef = useRef(null);

  // Reset transient state when the task changes
  useEffect(() => {
    if (!task) return;
    setSaveState('idle');
    setSaveError('');
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [task?.id]);

  // Clear the "Saved" indicator after a moment
  useEffect(() => {
    if (saveState === 'saved') {
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 1500);
      return () => clearTimeout(savedTimerRef.current);
    }
  }, [saveState]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && saveState !== 'saving' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, saveState, isDeleting, onClose]);

  // -----------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------
  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    setSaveError('');

    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to delete task');
        setIsDeleting(false);
        return;
      }

      onDeleted?.(task.id);
      router.refresh();
      onClose();
    } catch (err) {
      console.error('[TASK_DELETE]', err);
      setSaveError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !task) return null;

  const statusInfo = statusMeta(task.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !isDeleting && onClose()}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {statusInfo.label}
            </span>
            <SaveIndicator state={saveState} />
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                title="Delete task"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex-1 overflow-y-auto p-6">
          <TaskFields
            task={task}
            projectId={projectId}
            projectMembers={projectMembers}
            canEdit={canEdit}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onUpdated={onUpdated}
            saveState={saveState}
            saveError={saveError}
            setSaveState={setSaveState}
            setSaveError={setSaveError}
            titleRef={titleRef}
          />
        </div>

        {/* ─── Delete confirmation overlay ─── */}
        {showDeleteConfirm && (
          <DeleteConfirmOverlay
            taskTitle={task.title}
            loading={isDeleting}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

// =============================================================
// SaveIndicator - small "Saving..." / "Saved" text
// =============================================================
const SaveIndicator = ({ state }) => {
  if (state === 'idle') return null;

  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-2">
      {state === 'saving' && (
        <>
          <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
          Saving...
        </>
      )}
      {state === 'saved' && (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Saved
        </>
      )}
      {state === 'error' && <span className="text-red-500">Save failed</span>}
    </span>
  );
};

// =============================================================
// DeleteConfirmOverlay
// =============================================================
const DeleteConfirmOverlay = ({ taskTitle, loading, onCancel, onConfirm }) => (
  <div className="absolute inset-0 rounded-2xl bg-white/95 dark:bg-gray-900/95 flex items-center justify-center p-6">
    <div className="text-center max-w-sm">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-red-600 dark:text-red-400"
        >
          <path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        Delete this task?
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        &ldquo;{taskTitle}&rdquo; will be permanently removed. This cannot be
        undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium transition-colors"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

export default TaskDetailModal;