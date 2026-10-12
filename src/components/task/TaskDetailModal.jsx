// -------------------------------------------------------------
// TaskDetailModal - Compact modal editor for a task
// -------------------------------------------------------------
//
// WHEN USED:
//   Click a Kanban card → opens this modal.
//   Full task editing lives on the task page (via the ⋯ menu).
//
// STRUCTURE:
//   Backdrop (animated) → Modal card (animated)
//     - Header (status + save indicator + delete + close)
//     - Body (<TaskFields>)
//     - Delete confirmation overlay (animated)
//
// POLISH:
//   - Framer Motion entry + exit
//   - Softer backdrop with heavier blur
//   - Body scroll lock while open
//   - Refined header spacing
//   - Glass dark mode
//   - Responsive padding
//
// PRESERVED:
//   - Same props
//   - Same state (saveState/saveError/isDeleting/showDeleteConfirm)
//   - Escape key closes
//   - TaskFields is still the field editor
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  const isVisible = isOpen && !!task;

  // ─── Reset transient state when the task changes ───
  useEffect(() => {
    if (!task) return;
    setSaveState('idle');
    setSaveError('');
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [task?.id]);

  // ─── Clear the "Saved" indicator after a moment ───
  useEffect(() => {
    if (saveState === 'saved') {
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 1500);
      return () => clearTimeout(savedTimerRef.current);
    }
  }, [saveState]);

  // ─── Escape closes ───
  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && saveState !== 'saving' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVisible, saveState, isDeleting, onClose]);

  // ─── Lock body scroll while modal is open ───
  useEffect(() => {
    if (!isVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

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

  const statusInfo = task ? statusMeta(task.status) : null;

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            p-3 sm:p-4
            bg-black/50 dark:bg-black/70
            backdrop-blur-sm
          "
          onClick={() => !isDeleting && onClose()}
          role="dialog"
          aria-modal="true"
        >
          {/* ─── Modal card ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="
              relative w-full max-w-2xl
              bg-white dark:bg-[#0f1115]
              rounded-2xl
              border border-gray-200 dark:border-white/[0.08]
              shadow-2xl shadow-black/20 dark:shadow-black/60
              max-h-[92vh]
              flex flex-col
              overflow-hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* ══════════ HEADER ══════════ */}
            <div
              className="
                flex items-center justify-between
                px-5 py-4
                border-b border-gray-200 dark:border-white/[0.06]
              "
            >
              {/* Left: status + save indicator */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`}
                />
                <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400 truncate">
                  {statusInfo.label}
                </span>
                <SaveIndicator state={saveState} />
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="
                      p-2 rounded-lg
                      text-gray-400
                      hover:text-red-600 dark:hover:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-500/10
                      active:scale-[0.96]
                      disabled:opacity-50
                      transition-all duration-150
                    "
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
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
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="
                    p-2 rounded-lg
                    text-gray-400
                    hover:text-gray-900 dark:hover:text-white
                    hover:bg-gray-100 dark:hover:bg-white/[0.06]
                    active:scale-[0.96]
                    disabled:opacity-50
                    transition-all duration-150
                  "
                  aria-label="Close"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* ══════════ BODY ══════════ */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
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

            {/* ══════════ DELETE CONFIRM OVERLAY ══════════ */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <DeleteConfirmOverlay
                  key="delete-overlay"
                  taskTitle={task.title}
                  loading={isDeleting}
                  onCancel={() => setShowDeleteConfirm(false)}
                  onConfirm={handleDelete}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================================
// SaveIndicator - small "Saving..." / "Saved" text
// =============================================================
const SaveIndicator = ({ state }) => {
  if (state === 'idle') return null;

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 ml-1">
      {state === 'saving' && (
        <>
          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
          Saving…
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
      {state === 'error' && (
        <span className="text-red-500 font-medium">Save failed</span>
      )}
    </span>
  );
};

// =============================================================
// DeleteConfirmOverlay - full-modal overlay with animation
// =============================================================
const DeleteConfirmOverlay = ({
  taskTitle,
  loading,
  onCancel,
  onConfirm,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    className="
      absolute inset-0 z-10
      rounded-2xl
      bg-white/95 dark:bg-[#0f1115]/95
      backdrop-blur-sm
      flex items-center justify-center p-6
    "
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="text-center max-w-sm"
    >
      {/* Warning icon */}
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
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
      <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
        &ldquo;{taskTitle}&rdquo; will be permanently removed. This cannot be
        undone.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="
            flex-1 py-2.5 rounded-xl
            border border-gray-300 dark:border-white/[0.08]
            text-gray-700 dark:text-gray-300
            text-[13px] font-medium
            hover:bg-gray-50 dark:hover:bg-white/[0.04]
            active:scale-[0.98]
            disabled:opacity-50
            transition-all duration-150
          "
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="
            flex-1 py-2.5 rounded-xl
            bg-red-600 hover:bg-red-700
            disabled:bg-red-400 disabled:cursor-not-allowed
            active:scale-[0.98]
            text-white text-[13px] font-medium
            transition-all duration-150
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Deleting…
            </>
          ) : (
            'Delete'
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default TaskDetailModal;