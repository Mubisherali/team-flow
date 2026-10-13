// -------------------------------------------------------------
// CommentList - Comments section for a task
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside <TaskDetailModal> (below the task fields)
//   and on the full task page.
//
// STRUCTURE:
//   Section card
//     - Header (icon + "Discussion" + count)
//     - Body (loading | error | list | empty)
//     - Composer footer (<CommentForm>)
//
// POLISH:
//   - Framer Motion entry on section
//   - Newly-added comments fade in (initial load is instant)
//   - Semantic <ul>/<li> for the thread
//   - Glass red error surface
//   - Count badge reserves space (no layout shift)
//   - aria-labelledby for screen readers
//
// PRESERVED:
//   - Same props
//   - Same fetch + cancel pattern
//   - Same handlers (add / edit / delete)
//   - Auto-scroll to newest on mount + after post
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // IDs of comments that were added *after* the initial load.
  // Only these get a Framer Motion entrance — the first paint
  // of the thread is instant (calm, no stagger on 50 comments).
  const [animatedIds, setAnimatedIds] = useState(() => new Set());

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
  // AUTO-SCROLL on initial load
  // -----------------------------------------------------------
  useEffect(() => {
    if (!loading && bottomRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
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

      const newComment = data.comment;

      // Mark this id as "animate on enter" before rendering it.
      setAnimatedIds((prev) => {
        const next = new Set(prev);
        next.add(newComment.id);
        return next;
      });

      setComments((prev) => [...prev, newComment]);

      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
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
      const data = await res.json().catch(() => ({}));

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
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-labelledby="comments-heading"
      className="
        rounded-2xl overflow-hidden
        border border-gray-200 dark:border-white/[0.08]
        bg-white dark:bg-[#0f1115]
      "
    >
      {/* ══════════ HEADER ══════════ */}
      <div
        className="
          flex items-center justify-between
          px-5 py-4
          border-b border-gray-200 dark:border-white/[0.06]
        "
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="
              w-7 h-7 rounded-lg flex-shrink-0
              bg-indigo-50 dark:bg-indigo-500/10
              flex items-center justify-center
            "
          >
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

          <h3
            id="comments-heading"
            className="text-[13px] font-semibold text-gray-900 dark:text-white truncate"
          >
            Discussion
          </h3>

          {/* Count badge — always rendered (opacity toggles) so
              the header doesn't shift when loading → loaded. */}
          <span
            aria-hidden={!hasComments || loading}
            className={`
              text-[11px] font-medium px-1.5 py-0.5 rounded-md
              bg-gray-100 dark:bg-white/[0.06]
              text-gray-600 dark:text-gray-400
              transition-opacity duration-150
              ${!loading && hasComments ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {count}
          </span>
        </div>
      </div>

      {/* ══════════ ERROR ══════════ */}
      {error && (
        <div className="m-4 sm:m-5">
          <div
            className="
              rounded-xl px-3.5 py-3
              bg-red-500/[0.07] dark:bg-red-500/10
              border border-red-500/20
            "
            role="alert"
          >
            <p className="text-[12.5px] text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ══════════ BODY ══════════ */}
      {loading ? (
        <LoadingComments />
      ) : (
        <>
          {hasComments ? (
            <ul role="list" className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              <AnimatePresence initial={false}>
                {comments.map((c) => {
                  const shouldAnimate = animatedIds.has(c.id);
                  return (
                    <li key={c.id}>
                      {shouldAnimate ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="px-5 py-4"
                        >
                          <CommentItem
                            comment={c}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </motion.div>
                      ) : (
                        <div className="px-5 py-4">
                          <CommentItem
                            comment={c}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </AnimatePresence>
            </ul>
          ) : (
            <EmptyComments />
          )}

          {/* Composer */}
          <div
            className="
              p-5
              border-t border-gray-200 dark:border-white/[0.06]
              bg-gray-50/60 dark:bg-white/[0.015]
            "
          >
            <CommentForm onSubmit={handleAdd} />
          </div>
        </>
      )}

      {/* Invisible scroll anchor */}
      <div ref={bottomRef} />
    </motion.section>
  );
};

// =============================================================
// LoadingComments
// =============================================================
const LoadingComments = () => (
  <div className="flex items-center justify-center py-12">
    <span
      className="
        w-5 h-5 rounded-full animate-spin
        border-2 border-gray-300 dark:border-white/10
        border-t-gray-500 dark:border-t-gray-400
      "
    />
  </div>
);

// =============================================================
// EmptyComments
// =============================================================
const EmptyComments = () => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="py-12 text-center"
  >
    <div
      className="
        w-12 h-12 mx-auto mb-3 rounded-full
        bg-gray-100 dark:bg-white/[0.04]
        flex items-center justify-center
      "
    >
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
    <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-1">
      No comments yet
    </p>
    <p className="text-[12px] text-gray-500 dark:text-gray-400">
      Start the discussion below.
    </p>
  </motion.div>
);

export default CommentList;