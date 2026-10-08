// -------------------------------------------------------------
// CommentList - Comments section for a task
// -------------------------------------------------------------
//
// VISUAL:
//   Reads like an inbox — a title bar with count, comments
//   stacked with dividers, and a composer at the bottom.
//
// BEHAVIOR:
//   - Fetches comments on mount and when taskId changes
//   - Add/edit/delete update local state after the API responds
//   - Auto-scrolls to the newest comment on mount + after post
//   - Renders <CommentItem> for each comment
//   - Renders <CommentForm> at the bottom
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

const CommentList = ({
  projectId,
  taskId,
  currentUserId,
  currentUserRole,
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);

  // -----------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/comments`
        );
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || 'Failed to load comments');
          setComments([]);
        } else {
          setComments(data.comments || []);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[COMMENTS_LOAD]', err);
        setError('Network error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, taskId]);

  // -----------------------------------------------------------
  // AUTO-SCROLL on load
  // -----------------------------------------------------------
  useEffect(() => {
    if (!loading && bottomRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
        });
      });
    }
  }, [loading]);

  // -----------------------------------------------------------
  // ADD
  // -----------------------------------------------------------
  const handleAdd = useCallback(
    async (content) => {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }

      setComments((prev) => [...prev, data.comment]);

      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    },
    [projectId, taskId]
  );

  // -----------------------------------------------------------
  // EDIT
  // -----------------------------------------------------------
  const handleEdit = useCallback(
    async (commentId, newContent) => {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update comment');
      }

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? data.comment : c))
      );
    },
    [projectId, taskId]
  );

  // -----------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------
  const handleDelete = useCallback(
    async (commentId) => {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    [projectId, taskId]
  );

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  const count = comments.length;
  const hasComments = count > 0;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* ─── Section header ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-indigo-600 dark:text-indigo-400"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Discussion
          </h3>

          {!loading && hasComments && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {count}
            </span>
          )}
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="m-6 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ─── Body ─── */}
      {loading ? (
        <LoadingComments />
      ) : (
        <>
          {/* Comments */}
          {hasComments ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {comments.map((c) => (
                <div key={c.id} className="px-6 py-5">
                  <CommentItem
                    comment={c}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyComments />
          )}

          {/* Divider before composer */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Composer */}
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
            <CommentForm onSubmit={handleAdd} />
          </div>
        </>
      )}

      {/* Invisible scroll anchor */}
      <div ref={bottomRef} />
    </section>
  );
};

// =============================================================
// LoadingComments
// =============================================================
const LoadingComments = () => (
  <div className="flex items-center justify-center py-12">
    <span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
  </div>
);

// =============================================================
// EmptyComments
// =============================================================
const EmptyComments = () => (
  <div className="py-12 text-center">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-400 dark:text-gray-500"
      >
        <path
          d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
      No comments yet
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Start the discussion below.
    </p>
  </div>
);

export default CommentList;