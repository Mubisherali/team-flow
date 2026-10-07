// -------------------------------------------------------------
// CommentList - Comments section for a task
// -------------------------------------------------------------
//
// PROPS:
//   projectId       : string
//   taskId          : string
//   currentUserId   : string
//   currentUserRole : 'OWNER' | 'MANAGER' | 'MEMBER'
//
// DATA:
//   Comments are loaded on mount, then kept in local state.
//   Add/edit/delete update local state after the API responds.
//   The parent modal doesn't need to know about comments at all.
//
// AUTO-SCROLL:
//   When the list first loads, scroll to the bottom (newest).
//   After posting a new comment, also scroll to the bottom.
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

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // -----------------------------------------------------------
  // FETCH on mount / when taskId changes
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
  // AUTO-SCROLL to the latest comment when the list loads
  // -----------------------------------------------------------
  useEffect(() => {
    if (!loading && bottomRef.current) {
      // rAF ensures the DOM has settled before scrolling.
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
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

      // Scroll to the new comment
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Comments
          {!loading && comments.length > 0 && (
            <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">
              {comments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <LoadingComments />
      ) : (
        <>
          {/* Thread */}
          <div ref={scrollRef} className="space-y-4 mb-4">
            {comments.length === 0 ? (
              <EmptyComments />
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <CommentForm onSubmit={handleAdd} />
        </>
      )}
    </section>
  );
};

// =============================================================
// Sub-components
// =============================================================
const LoadingComments = () => (
  <div className="flex items-center justify-center py-8">
    <span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
  </div>
);

const EmptyComments = () => (
  <div className="py-8 text-center">
    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
      No comments yet. Start the discussion below.
    </p>
  </div>
);

export default CommentList;