// -------------------------------------------------------------
// CommentItem - Single comment in a task's thread
// -------------------------------------------------------------
//
// PROPS:
//   comment         : { id, user, content, createdAt, updatedAt, isEdited }
//   currentUserId   : string
//   currentUserRole : 'OWNER' | 'MANAGER' | 'MEMBER'
//   onEdit          : (commentId, newContent) => Promise<void>
//   onDelete        : (commentId) => Promise<void>
//
// VISUAL STYLE:
//   Not a chat bubble. A "document" comment — avatar + header
//   line + body text. Matches Linear / GitHub Issues.
//
// INTERACTIONS:
//   - Edit: inline textarea replaces the body, save on Ctrl+Enter
//     or clicking "Save". Cancel reverts.
//   - Delete: inline confirmation (click trash → small confirm).
//   - Actions appear on hover (or always on touch devices).
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';

const MAX_LENGTH = 2000;

const CommentItem = ({
  comment,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
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

  // Keep draft in sync if the comment changes externally
  // (e.g. after a refresh).
  useEffect(() => {
    if (!editing) setDraft(comment.content);
  }, [comment.content, editing]);

  // Focus + auto-size the textarea when entering edit mode.
  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
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
      // No change → just close
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
  // DELETE
  // -----------------------------------------------------------
  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;

    setDeleting(true);
    setError('');
    try {
      await onDelete(comment.id);
      // Parent removes it from the list; nothing more to do here.
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
      setDeleting(false);
    }
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="flex gap-3 group">
      {/* Avatar (persistent across view/edit) */}
      {comment.user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.user.avatarUrl}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
          {initials}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Header line: name + timestamp + (edited) */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </span>
          <span
            className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
            title={new Date(comment.createdAt).toLocaleString()}
          >
            {formatRelative(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span
              className="text-[10px] text-gray-400 dark:text-gray-500 italic flex-shrink-0"
              title={`Edited ${new Date(comment.updatedAt).toLocaleString()}`}
            >
              (edited)
            </span>
          )}

          {/* Spacer */}
          <span className="flex-1" />

          {/* Actions (hover or when no edit) */}
          {!editing && (canEdit || canDelete) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={deleting}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  title="Edit comment"
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
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 transition-colors"
                  title="Delete comment"
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

        {/* Content — view mode */}
        {!editing && (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>
        )}

        {/* Content — edit mode */}
        {editing && (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onInput={handleEditAutoSize}
              disabled={saving}
              rows={2}
              maxLength={MAX_LENGTH}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Ctrl+Enter to save · Esc to cancel
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local error (edit/delete) */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================
// formatRelative - "just now", "5m ago", "2h ago", "Yesterday",
// or a short date for older comments.
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

  // Older: return a short date
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default CommentItem;