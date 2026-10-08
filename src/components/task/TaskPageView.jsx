// -------------------------------------------------------------
// TaskPageView - Task page wrapper with view/edit mode toggle
// -------------------------------------------------------------
//
// PROPS:
//   task            : the full task object
//   project         : { id, name }
//   workspace       : { id, name, slug }
//   projectMembers  : array
//   canEdit         : boolean
//   currentUserId   : string
//   currentUserRole : 'OWNER' | 'MANAGER' | 'MEMBER'
//
// MODES:
//   - view (default): <TaskViewMode> renders read-only
//   - edit:           <TaskEditMode> renders inputs + Save/Cancel
//
// FLOW:
//   1. Click "Edit" → isEditing = true, useTaskEditor begins
//      tracking local changes
//   2. In edit mode, edits stay local (no auto-save)
//   3. Click "Save"  → saveAll() → PATCH → back to view mode
//   4. Click "Cancel" → resetChanges() → back to view mode
//      (with confirm if dirty)
//
// COMMENTS:
//   Always rendered below the fields — live in both modes.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  currentUserId,
  currentUserRole,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const savedTimerRef = useRef(null);

  // ─── Editor hook ───
  // Always mounted — even in view mode. Ensures the local state
  // is ready the instant the user clicks Edit.
  const editor = useTaskEditor({
    task,
    projectId: project.id,
    projectMembers,
    canEdit,
    currentUserId,
    currentUserRole,
    onUpdated: () => {
      // router.refresh() is called inside the hook already.
    },
  });

  // Clear "Saved" indicator after a moment
  useEffect(() => {
    if (editor.saveState === 'saved') {
      savedTimerRef.current = setTimeout(() => editor.setSaveState('idle'), 1500);
      return () => clearTimeout(savedTimerRef.current);
    }
  }, [editor.saveState]);

  // Escape cancels edit mode (with confirm if dirty)
  useEffect(() => {
    if (!isEditing) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isEditing, editor.isDirty]);

  // Warn before closing tab while in edit mode with changes
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
    // If error, stay in edit mode — the hook already set saveError
  };

  const handleCancel = () => {
    if (editor.isDirty) {
      const confirmed = confirm(
        'You have unsaved changes. Discard them?'
      );
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
    <div className="p-8 max-w-4xl mx-auto">
      {/* ─── Breadcrumb ─── */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
        <Link
          href={`/workspaces/${workspace.id}`}
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {workspace.name}
        </Link>
        <span>/</span>
        <Link
          href={`/workspaces/${workspace.id}/projects/${project.id}`}
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {project.name}
        </Link>
      </nav>

      {/* ─── Back link ─── */}
      <Link
        href={`/workspaces/${workspace.id}/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to board
      </Link>

      {/* ─── Top bar: status + actions ─── */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {statusInfo.label}
          </span>

          {editor.saveState === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-2">
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
            </span>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !editor.isDirty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
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
                        strokeWidth="2"
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

      {/* ─── Error banner ─── */}
      {editor.saveError && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">
            {editor.saveError}
          </p>
        </div>
      )}

      {/* ─── Main content card ─── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8 mb-10">
        {isEditing ? (
          <TaskEditMode
            task={task}
            editor={editor}
            projectMembers={projectMembers}
            currentUserId={currentUserId}
            canEdit={canEdit}
          />
        ) : (
          <TaskViewMode task={task} />
        )}
      </div>

      {/* ─── Discussion ─── */}
      <div id="comments" className="scroll-mt-4 mb-10">
        <CommentList
          projectId={project.id}
          taskId={task.id}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>

      {/* ─── Danger zone ─── */}
      {canEdit && (
        <section>
          <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-3">
            Danger zone
          </h2>
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Delete this task
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium transition-colors self-start sm:self-auto"
            >
              Delete task
            </button>
          </div>
        </section>
      )}

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
  );
};

// =============================================================
// DeleteConfirmOverlay
// =============================================================
const DeleteConfirmOverlay = ({ taskTitle, loading, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={() => !loading && onCancel()}
  >
    <div
      className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="text-center">
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
            &ldquo;{taskTitle}&rdquo; will be permanently removed. This cannot
            be undone.
          </p>
        </div>
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
  </div>
);

export default TaskPageView;