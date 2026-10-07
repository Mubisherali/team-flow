// -------------------------------------------------------------
// TaskPageClient - Client wrapper for the task detail page
// -------------------------------------------------------------
//
// WHAT IT DOES:
//   - Renders a page-level header (back link, project breadcrumb,
//     status badge)
//   - Renders <TaskFields> (same component as the modal)
//   - Renders a danger zone with delete
//   - Handles #comments hash navigation (from "Ask a question")
//
// WHY A CLIENT WRAPPER:
//   The page itself is a server component that fetches data.
//   This client component handles:
//     - saveState / saveError (top-of-page indicator)
//     - delete confirmation
//     - post-delete redirect
//     - #comments scroll on mount
//
// PROPS:
//   task            : the full task object
//   project         : { id, name }
//   workspace       : { id, name, slug }
//   projectMembers  : array
//   canEdit         : boolean
//   currentUserId   : string
//   currentUserRole : 'OWNER' | 'MANAGER' | 'MEMBER'
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import TaskFields from './TaskFields';
import { statusMeta } from '@/lib/task-constants';

const TaskPageClient = ({
  task,
  project,
  workspace,
  projectMembers,
  canEdit,
  currentUserId,
  currentUserRole,
}) => {
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const router = useRouter();
  const titleRef = useRef(null);
  const savedTimerRef = useRef(null);

  // Clear the "Saved" indicator after a moment
  useEffect(() => {
    if (saveState === 'saved') {
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 1500);
      return () => clearTimeout(savedTimerRef.current);
    }
  }, [saveState]);

  // Handle #comments hash — scroll to comments on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#comments') {
      // Wait for the DOM to settle, then scroll.
      requestAnimationFrame(() => {
        const el = document.getElementById('comments');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, []);

  // -----------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------
  const handleDelete = async () => {
    setIsDeleting(true);
    setSaveError('');

    try {
      const res = await fetch(
        `/api/projects/${project.id}/tasks/${task.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to delete task');
        setIsDeleting(false);
        return;
      }

      // Redirect back to the project board
      router.push(`/workspaces/${workspace.id}/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      console.error('[TASK_DELETE]', err);
      setSaveError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  const statusInfo = statusMeta(task.status);

  return (
    <div className="p-8 max-w-3xl mx-auto">
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

      {/* ─── Header: status + save indicator ─── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {statusInfo.label}
          </span>
          <SaveIndicator state={saveState} />
        </div>
      </div>

      {/* ─── Main content card ─── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8">
        <TaskFields
          task={task}
          projectId={project.id}
          projectMembers={projectMembers}
          canEdit={canEdit}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onUpdated={() => {
            // router.refresh() is called by TaskFields already.
          }}
          saveState={saveState}
          saveError={saveError}
          setSaveState={setSaveState}
          setSaveError={setSaveError}
          titleRef={titleRef}
        />
      </div>

      {/* ─── Danger zone ─── */}
      {canEdit && (
        <section className="mt-10">
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
// SaveIndicator
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
// DeleteConfirmOverlay - full-page centered modal
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

export default TaskPageClient;