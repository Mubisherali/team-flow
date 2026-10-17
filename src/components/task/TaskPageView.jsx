// -------------------------------------------------------------
// TaskPageView - Task page wrapper with view/edit mode toggle
// -------------------------------------------------------------
//
// PROPS:
//   task / project / workspace / projectMembers
//   canEdit / canDelete / currentUserId / currentUserRole
//
//   canEdit   — assignee OR creator OR privileged
//   canDelete — privileged ONLY (owner/manager)
//
// (rest of header preserved)
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import TaskViewMode from './TaskViewMode';
import TaskEditMode from './TaskEditMode';
import CommentList from './CommentList';
import { useTaskEditor } from '@/hooks/useTaskEditor';
import { statusMeta } from '@/lib/task-constants';

const TaskPageView = ({
  task,
  project,
  workspace,
  projectMembers,
  canEdit,
  canDelete,
  currentUserId,
  currentUserRole,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const savedTimerRef = useRef(null);

  // ─── Editor hook ───
  const editor = useTaskEditor({
    task,
    projectId: project.id,
    projectMembers,
    canEdit,
    currentUserId,
    currentUserRole,
    onUpdated: () => {},
  });

  // ─── Clear "Saved" indicator after a moment ───
  useEffect(() => {
    if (editor.saveState === 'saved') {
      savedTimerRef.current = setTimeout(
        () => editor.setSaveState('idle'),
        1500
      );
      return () => clearTimeout(savedTimerRef.current);
    }
  }, [editor.saveState]);

  // ─── Escape cancels edit mode ───
  useEffect(() => {
    if (!isEditing) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isEditing, editor.isDirty]);

  // ─── Warn before closing tab while dirty ───
  useEffect(() => {
    if (!isEditing || !editor.isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditing, editor.isDirty]);

  // ─── Mode handlers ───
  const handleStartEdit = () => {
    editor.setSaveError('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const result = await editor.saveAll();
    if (result.ok) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (editor.isDirty) {
      const confirmed = confirm('You have unsaved changes. Discard them?');
      if (!confirmed) return;
    }
    editor.resetChanges();
    setIsEditing(false);
  };

  // ─── Delete ───
  const handleDelete = async () => {
    setIsDeleting(true);
    editor.setSaveError('');

    try {
      const res = await fetch(
        `/api/projects/${project.id}/tasks/${task.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        editor.setSaveError(data.error || 'Failed to delete task');
        setIsDeleting(false);
        return;
      }

      router.push(`/workspaces/${workspace.id}/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      console.error('[TASK_DELETE]', err);
      editor.setSaveError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  const statusInfo = statusMeta(task.status);
  const isSaving = editor.saveState === 'saving';

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      {/* ══════════ BREADCRUMB + BACK ══════════ */}
      <nav className="flex items-center gap-2 text-[12.5px] text-gray-500 dark:text-gray-500 mb-4 flex-wrap">
        <Link
          href={`/workspaces/${workspace.id}`}
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {workspace.name}
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <Link
          href={`/workspaces/${workspace.id}/projects/${project.id}`}
          className="hover:text-gray-900 dark:hover:text-white transition-colors truncate max-w-[160px] sm:max-w-none"
        >
          {project.name}
        </Link>
      </nav>

      <Link
        href={`/workspaces/${workspace.id}/projects/${project.id}`}
        className="group inline-flex items-center gap-1.5 text-[12.5px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="transition-transform duration-150 group-hover:-translate-x-0.5"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to board
      </Link>

      {/* ══════════ TOP BAR: STATUS + ACTIONS ══════════ */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          <span className="text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
            {statusInfo.label}
          </span>

          <AnimatePresence>
            {editor.saveState === 'saved' && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-500 ml-1"
              >
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
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="
                  inline-flex items-center gap-1.5
                  px-3.5 py-2 rounded-xl
                  border border-gray-200 dark:border-white/[0.08]
                  text-[13px] font-medium
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-white/[0.04]
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
                  strokeWidth="1.8"
                >
                  <path
                    d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="
                    px-3.5 py-2 rounded-xl
                    border border-gray-200 dark:border-white/[0.08]
                    text-[13px] font-medium
                    text-gray-700 dark:text-gray-300
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
                  onClick={handleSave}
                  disabled={isSaving || !editor.isDirty}
                  className="
                    inline-flex items-center gap-1.5
                    px-3.5 py-2 rounded-xl
                    bg-indigo-600 hover:bg-indigo-700
                    disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
                    active:scale-[0.98]
                    text-white text-[13px] font-medium
                    transition-all duration-150
                  "
                >
                  {isSaving ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M17 21v-8H7v8M7 3v5h8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════ ERROR BANNER ══════════ */}
      <AnimatePresence>
        {editor.saveError && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <p className="text-[13px] text-red-700 dark:text-red-300 flex-1">
                {editor.saveError}
              </p>
              <button
                type="button"
                onClick={() => editor.setSaveError('')}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 transition-colors"
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

      {/* ══════════ MAIN CONTENT CARD ══════════ */}
      <div
        className="
          rounded-2xl
          border border-gray-200 dark:border-white/[0.06]
          bg-white dark:bg-white/[0.02]
          p-6 md:p-8
          mb-8
        "
      >
        <AnimatePresence mode="wait" initial={false}>
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <TaskEditMode
                task={task}
                editor={editor}
                projectMembers={projectMembers}
                currentUserId={currentUserId}
                canEdit={canEdit}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <TaskViewMode task={task} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ DISCUSSION ══════════ */}
      <div id="comments" className="scroll-mt-4 mb-10">
        <CommentList
          projectId={project.id}
          taskId={task.id}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>

      {/* ══════════ DANGER ZONE (privileged only) ══════════ */}
      {canDelete && (
        <section>
          <h2 className="text-[15px] font-semibold text-red-600 dark:text-red-400 mb-3">
            Danger zone
          </h2>
          <div
            className="
              rounded-2xl
              border border-red-200 dark:border-red-500/20
              bg-red-50/50 dark:bg-red-500/[0.04]
              p-5
              flex flex-col sm:flex-row sm:items-center sm:justify-between
              gap-4
            "
          >
            <div>
              <p className="text-[13.5px] font-medium text-gray-900 dark:text-white">
                Delete this task
              </p>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="
                px-4 py-2 rounded-xl
                bg-red-600 hover:bg-red-700
                disabled:bg-red-400 disabled:cursor-not-allowed
                active:scale-[0.98]
                text-white text-[13px] font-medium
                transition-all duration-150
                self-start sm:self-auto
              "
            >
              Delete task
            </button>
          </div>
        </section>
      )}

      {/* ══════════ DELETE CONFIRM MODAL ══════════ */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            key="delete-confirm"
            taskTitle={task.title}
            loading={isDeleting}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================
// DeleteConfirmModal (unchanged)
// =============================================================
const DeleteConfirmModal = ({
  taskTitle,
  loading,
  onCancel,
  onConfirm,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="
      fixed inset-0 z-50
      flex items-center justify-center p-4
      bg-black/50 dark:bg-black/70 backdrop-blur-sm
    "
    onClick={() => !loading && onCancel()}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="
        w-full max-w-sm
        bg-white dark:bg-[#0f1115]
        rounded-2xl
        border border-gray-200 dark:border-white/[0.08]
        shadow-2xl shadow-black/20 dark:shadow-black/60
      "
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="p-6">
        <div className="text-center">
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
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            Delete this task?
          </h3>
          <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            &ldquo;{taskTitle}&rdquo; will be permanently removed. This cannot
            be undone.
          </p>
        </div>

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
      </div>
    </motion.div>
  </motion.div>
);

export default TaskPageView;