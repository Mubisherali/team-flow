// -------------------------------------------------------------
// CommentItem - Single comment in a task's thread
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by <CommentList> for every comment in the thread.
//
// STRUCTURE:
//   Avatar | Body
//            - Header (name · relative time · (edited) · actions)
//            - Content bubble (view mode)  OR
//              Edit textarea (edit mode)   OR
//              Delete confirm swap (delete mode)
//
// POLISH:
//   - Framer Motion crossfade between view/edit modes
//   - Inline delete confirm (no native confirm())
//   - Icon buttons match TaskDetailModal style
//   - Actions fade in on hover (desktop) and stay visible
//     on touch (mobile) via group-focus-within
//   - Refined avatar with subtle ring
//   - A11y labels on all icon buttons
//
// PRESERVED:
//   - Same props
//   - Same state machine (editing / saving / deleting)
//   - Ctrl/Cmd+Enter saves, Esc cancels
//   - Custom formatRelative helper (no date-fns drift)
//   - Permission logic (isAuthor / isPrivileged)
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_LENGTH = 2000;

const CommentItem = ({
  comment,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const textareaRef = useRef(null);

  const isAuthor = comment.userId === currentUserId;
  const isPrivileged =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';
  const canEdit = isAuthor;
  const canDelete = isAuthor || isPrivileged;

  // Keep draft in sync when not editing
  useEffect(() => {
    if (!editing) setDraft(comment.content);
  }, [comment.content, editing]);

  // Autofocus the textarea in edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      // Place cursor at end
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editing]);

  const initials = (comment.user.name || comment.user.email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const displayName = comment.user.name || comment.user.email;

  // -----------------------------------------------------------
  // EDIT
  // -----------------------------------------------------------
  const handleStartEdit = () => {
    setDraft(comment.content);
    setEditing(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setDraft(comment.content);
    setError('');
  };

  const handleSaveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Comment cannot be empty');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Comment must be ${MAX_LENGTH} characters or fewer`);
      return;
    }
    if (trimmed === comment.content.trim()) {
      handleCancelEdit();
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onEdit(comment.id, trimmed);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update comment');
    } finally {
      setSaving(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleEditAutoSize = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  // -----------------------------------------------------------
  // DELETE — inline confirm (no native confirm())
  // -----------------------------------------------------------
  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onDelete(comment.id);
      // Parent removes this item — no need to reset deleting.
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setConfirmingDelete(false);
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  const showActions = !editing && !confirmingDelete && (canEdit || canDelete);

  return (
    <div className="group flex gap-3.5 items-start">
      {/* ─── Avatar ─── */}
      <div className="flex-shrink-0 pt-0.5">
        {comment.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.user.avatarUrl}
            alt={displayName}
            className="
              w-9 h-9 rounded-full object-cover
              ring-1 ring-gray-200 dark:ring-white/[0.08]
            "
          />
        ) : (
          <div
            className="
              w-9 h-9 rounded-full
              bg-indigo-600 text-white
              flex items-center justify-center
              text-xs font-semibold
              ring-1 ring-indigo-500/20
            "
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 min-w-0">
        {/* Header line: name · time · (edited) · actions */}
        <div className="flex items-center gap-2 mb-1.5 min-h-[20px]">
          <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </span>

          <span
            className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0"
            title={new Date(comment.createdAt).toLocaleString()}
          >
            {formatRelative(comment.createdAt)}
          </span>

          {comment.isEdited && (
            <span
              className="text-[10px] italic flex-shrink-0 text-gray-400 dark:text-gray-500"
              title={`Edited ${new Date(comment.updatedAt).toLocaleString()}`}
            >
              (edited)
            </span>
          )}

          <span className="flex-1" />

          {/* Actions — fade in on hover (desktop) / focus-within (kbd).
              On touch devices there's no hover, so we keep them
              always visible below sm via `sm:opacity-0`. */}
          {showActions && (
            <div
              className="
                flex items-center gap-0.5 flex-shrink-0
                opacity-100 sm:opacity-0
                sm:group-hover:opacity-100
                sm:group-focus-within:opacity-100
                transition-opacity duration-150
              "
            >
              {canEdit && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={deleting}
                  aria-label="Edit comment"
                  title="Edit comment"
                  className="
                    p-2 rounded-lg
                    text-gray-400
                    hover:text-gray-900 dark:hover:text-white
                    hover:bg-gray-100 dark:hover:bg-white/[0.06]
                    active:scale-[0.96]
                    disabled:opacity-40
                    transition-all duration-150
                  "
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
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={deleting}
                  aria-label="Delete comment"
                  title="Delete comment"
                  className="
                    p-2 rounded-lg
                    text-gray-400
                    hover:text-red-600 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-500/10
                    active:scale-[0.96]
                    disabled:opacity-40
                    transition-all duration-150
                  "
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
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Content area (view / edit / delete-confirm) ─── */}
        <AnimatePresence mode="wait" initial={false}>
          {/* VIEW MODE */}
          {!editing && !confirmingDelete && (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <div
                className="
                  rounded-xl px-3.5 py-2.5
                  bg-gray-50 dark:bg-white/[0.03]
                  border border-gray-100 dark:border-white/[0.06]
                "
              >
                <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                  {comment.content}
                </p>
                {error && (
                  <p className="text-[11px] mt-2 text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* EDIT MODE */}
          {editing && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div
                className="
                  rounded-xl p-3
                  bg-white dark:bg-white/[0.04]
                  border border-indigo-300 dark:border-indigo-500/40
                  focus-within:ring-2 focus-within:ring-indigo-500/30
                  transition-shadow
                "
              >
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={handleEditKeyDown}
                  onInput={handleEditAutoSize}
                  disabled={saving}
                  rows={2}
                  maxLength={MAX_LENGTH}
                  aria-label="Edit comment"
                  className="
                    w-full bg-transparent
                    text-[13px] text-gray-900 dark:text-white
                    placeholder-gray-400
                    focus:outline-none resize-none
                    disabled:opacity-60
                  "
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-[10px] font-mono">
                      Ctrl
                    </kbd>
                    {' + '}
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-[10px] font-mono">
                      Enter
                    </kbd>
                    {' to save · Esc to cancel'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="
                        px-2.5 py-1 rounded-md
                        text-[12px] font-medium
                        text-gray-600 dark:text-gray-400
                        hover:bg-gray-100 dark:hover:bg-white/[0.06]
                        disabled:opacity-50
                        transition-colors duration-150
                      "
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="
                        px-3 py-1 rounded-md
                        text-[12px] font-medium
                        bg-indigo-600 hover:bg-indigo-700
                        disabled:bg-indigo-400 dark:disabled:bg-indigo-800
                        active:scale-[0.98]
                        text-white
                        transition-all duration-150
                        inline-flex items-center gap-1.5
                      "
                    >
                      {saving ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p
                    className="text-[11px] mt-1 text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* DELETE CONFIRM — inline, matches the modal's
              confirm philosophy but scoped to this comment. */}
          {confirmingDelete && (
            <motion.div
              key="delete"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div
                className="
                  rounded-xl px-3.5 py-3
                  bg-red-500/[0.06] dark:bg-red-500/10
                  border border-red-500/20
                  flex flex-wrap items-center justify-between gap-3
                "
                role="alertdialog"
                aria-label="Confirm comment deletion"
              >
                <p className="text-[12.5px] text-gray-700 dark:text-gray-300">
                  Delete this comment?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={deleting}
                    className="
                      px-2.5 py-1 rounded-md
                      text-[12px] font-medium
                      text-gray-600 dark:text-gray-400
                      hover:bg-gray-100 dark:hover:bg-white/[0.06]
                      disabled:opacity-50
                      transition-colors duration-150
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="
                      px-3 py-1 rounded-md
                      text-[12px] font-medium
                      bg-red-600 hover:bg-red-700
                      disabled:bg-red-400 dark:disabled:bg-red-900
                      active:scale-[0.98]
                      text-white
                      transition-all duration-150
                      inline-flex items-center gap-1.5
                    "
                  >
                    {deleting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// =============================================================
// formatRelative - human-friendly relative timestamp
// (custom helper — keeping this instead of date-fns per project
// convention. Kept inline because only this file uses it.)
// =============================================================
function formatRelative(isoString) {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default CommentItem;