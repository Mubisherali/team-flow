'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import TaskViewMode from './TaskViewMode';
import TaskEditMode from './TaskEditMode';
import CommentList from './CommentList';
import { useTaskEditor } from '@/hooks/useTaskEditor';
import { statusMeta } from '@/lib/task-constants';

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function ArrowLeftIcon() {
  return (
    <svg {...iconProps}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg {...iconProps}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
      <path d="M10 11v5m4-5v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function Spinner({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current ${className}`}
    />
  );
}

const buttonBase =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0b0c10] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  `${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.07]`;

const primaryButton =
  `${buttonBase} bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800`;

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
  const deleteButtonRef = useRef(null);

  const editor = useTaskEditor({
    task,
    projectId: project.id,
    projectMembers,
    canEdit,
    currentUserId,
    currentUserRole,
    onUpdated: () => {},
  });

  const isSaving = editor.saveState === 'saving';

  // Clear the saved indicator after a short delay.
  useEffect(() => {
    if (editor.saveState !== 'saved') return;

    savedTimerRef.current = setTimeout(() => {
      editor.setSaveState('idle');
    }, 1800);

    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, [editor.saveState, editor.setSaveState]);

  // Escape cancels editing, unless a save is in progress.
  const handleCancel = useCallback(() => {
    if (isSaving) return;

    if (editor.isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Discard them?'
      );

      if (!confirmed) return;
    }

    editor.resetChanges();
    editor.setSaveError('');
    setIsEditing(false);
  }, [
    editor.isDirty,
    editor.resetChanges,
    editor.setSaveError,
    isSaving,
  ]);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, handleCancel]);

  // Warn before leaving the browser tab with unsaved edits.
  useEffect(() => {
    if (!isEditing || !editor.isDirty) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, editor.isDirty]);

  // Restore focus after closing the confirmation dialog.
  useEffect(() => {
    if (showDeleteConfirm) return;

    deleteButtonRef.current?.focus();
  }, [showDeleteConfirm]);

  const handleStartEdit = () => {
    if (!canEdit) return;

    editor.setSaveError('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!canEdit || isSaving) return;

    const result = await editor.saveAll();

    if (result?.ok) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    // Client-side guard for accidental invocation.
    // The API must independently enforce the same permissions.
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    editor.setSaveError('');

    try {
      const response = await fetch(
        `/api/projects/${project.id}/tasks/${task.id}`,
        { method: 'DELETE' }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        editor.setSaveError(
          data.error || 'Unable to delete this task. Please try again.'
        );
        setIsDeleting(false);
        return;
      }

      setShowDeleteConfirm(false);

      router.push(
        `/workspaces/${workspace.id}/projects/${project.id}`
      );
      router.refresh();
    } catch (error) {
      console.error('[TASK_DELETE]', error);

      editor.setSaveError(
        'A network error occurred. Check your connection and try again.'
      );

      setIsDeleting(false);
    }
  };

  const statusInfo = statusMeta(task.status);

  const projectUrl =
    `/workspaces/${workspace.id}/projects/${project.id}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-500"
      >
        <Link
          href={`/workspaces/${workspace.id}`}
          className="max-w-[180px] truncate transition-colors hover:text-gray-950 dark:hover:text-white"
        >
          {workspace.name}
        </Link>

        <span aria-hidden="true" className="text-gray-300 dark:text-gray-700">
          /
        </span>

        <Link
          href={projectUrl}
          className="max-w-[180px] truncate transition-colors hover:text-gray-950 dark:hover:text-white"
        >
          {project.name}
        </Link>

        <span aria-hidden="true" className="text-gray-300 dark:text-gray-700">
          /
        </span>

        <span className="font-medium text-gray-800 dark:text-gray-200">
          Task details
        </span>
      </nav>

      {/* Back navigation */}
      <Link
        href={projectUrl}
        className="group mb-7 inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-1">
          <ArrowLeftIcon />
        </span>
        Back to board
      </Link>

      {/* Page header */}
      <header className="mb-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300">
                <span
                  className={`h-2 w-2 rounded-full ${statusInfo.dot}`}
                />
                {statusInfo.label}
              </span>

              <AnimatePresence mode="wait">
                {editor.saveState === 'saved' && (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    role="status"
                  >
                    <CheckIcon />
                    All changes saved
                  </motion.span>
                )}

                {isSaving && (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                    role="status"
                  >
                    <Spinner />
                    Saving changes…
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Task overview
            </p>

            <h1 className="break-words text-2xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
              {task.title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              View task details, manage updates, and follow the discussion
              in one place.
            </p>
          </div>

          {canEdit && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className={secondaryButton}
                >
                  <EditIcon />
                  Edit task
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className={secondaryButton}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !editor.isDirty}
                    className={primaryButton}
                  >
                    {isSaving ? (
                      <>
                        <Spinner />
                        Saving…
                      </>
                    ) : (
                      <>
                        <SaveIcon />
                        Save changes
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Save/delete errors */}
      <AnimatePresence initial={false}>
        {editor.saveError && (
          <motion.div
            key="task-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/[0.07]"
            role="alert"
          >
            <span className="mt-0.5 text-red-600 dark:text-red-400">
              <AlertIcon />
            </span>

            <p className="flex-1 text-sm leading-5 text-red-700 dark:text-red-300">
              {editor.saveError}
            </p>

            <button
              type="button"
              onClick={() => editor.setSaveError('')}
              aria-label="Dismiss error message"
              className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              <svg {...iconProps} width={14} height={14}>
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main task content */}
      <section
        aria-label="Task details"
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-950/[0.02] dark:border-white/[0.07] dark:bg-[#0c0e12] dark:shadow-black/10"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.06] sm:px-7">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Details
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEditing
                ? 'Make your changes, then save when you are ready.'
                : 'Task information and assignment.'}
            </p>
          </div>

          {isEditing && editor.isDirty && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-300">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="p-5 sm:p-7">
          <AnimatePresence mode="wait" initial={false}>
            {isEditing ? (
              <motion.div
                key="task-edit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
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
                key="task-view"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <TaskViewMode task={task} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Discussion */}
      <section
        id="comments"
        aria-label="Task discussion"
        className="mt-9 scroll-mt-6"
      >
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            Collaboration
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
            Discussion
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Keep updates and decisions connected to this task.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.07] dark:bg-[#0c0e12] sm:p-6">
          <CommentList
            projectId={project.id}
            taskId={task.id}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      </section>

      {/* Destructive actions: owner and manager only */}
      {canDelete && (
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-red-500 dark:text-red-400">
              <TrashIcon />
            </span>

            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Danger zone
            </h2>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-red-200/80 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/[0.035] sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Delete this task
              </p>
              <p className="mt-1 max-w-lg text-xs leading-5 text-gray-600 dark:text-gray-400">
                Permanently remove this task and its associated information.
                This action cannot be undone.
              </p>
            </div>

            <button
              ref={deleteButtonRef}
              type="button"
              onClick={() => {
                if (canDelete && !isDeleting) {
                  editor.setSaveError('');
                  setShowDeleteConfirm(true);
                }
              }}
              disabled={isDeleting}
              className={`${buttonBase} shrink-0 border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-500/25 dark:bg-red-500/[0.06] dark:text-red-300 dark:hover:bg-red-500/[0.12]`}
            >
              <TrashIcon />
              Delete task
            </button>
          </div>
        </section>
      )}

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && canDelete && (
          <DeleteConfirmModal
            key="delete-confirm"
            taskTitle={task.title}
            loading={isDeleting}
            onCancel={() => {
              if (!isDeleting) setShowDeleteConfirm(false);
            }}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

function DeleteConfirmModal({
  taskTitle,
  loading,
  onCancel,
  onConfirm,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 5 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20 dark:border-white/[0.09] dark:bg-[#101116] dark:shadow-black/60"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-task-title"
        aria-describedby="delete-task-description"
      >
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/[0.1] dark:text-red-400">
            <TrashIcon />
          </div>

          <h3
            id="delete-task-title"
            className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white"
          >
            Delete this task?
          </h3>

          <p
            id="delete-task-description"
            className="mt-2 break-words text-sm leading-6 text-gray-600 dark:text-gray-400"
          >
            You are about to permanently delete{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-200">
              &ldquo;{taskTitle}&rdquo;
            </span>
            . This action cannot be undone.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={secondaryButton}
            >
              Keep task
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`${buttonBase} bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-900`}
            >
              {loading ? (
                <>
                  <Spinner />
                  Deleting…
                </>
              ) : (
                <>
                  <TrashIcon />
                  Delete permanently
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TaskPageView;
