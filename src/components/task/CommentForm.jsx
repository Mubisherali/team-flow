// -------------------------------------------------------------
// CommentForm - Compose a new comment on a task
// -------------------------------------------------------------
//
// PROPS:
//   onSubmit : (content) => Promise<void>
//   disabled : boolean — parent may lock the form while another
//              request is in flight (rarely used)
//
// BEHAVIOR:
//   - Auto-growing textarea (1 → 6 rows)
//   - Post button disabled while empty or saving
//   - Ctrl/Cmd + Enter submits
//   - Clears on success
//
// AUTOSAVE MODEL:
//   Unlike task fields (save on blur), comments save on Submit.
//   A comment is a discrete action, not a field being tuned.
// -------------------------------------------------------------

'use client';

import { useState, useRef } from 'react';

const MAX_LENGTH = 2000;

const CommentForm = ({ onSubmit, disabled }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const textareaRef = useRef(null);

  const trimmedLength = content.trim().length;
  const canSubmit = trimmedLength > 0 && !submitting && !disabled;

  // Auto-size the textarea to fit content (capped at ~6 rows visually)
  const autoSize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    // Cap at 200px ≈ 6 rows
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    autoSize(e.target);
    if (error) setError('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text) return;
    if (submitting || disabled) return;

    setSubmitting(true);
    setError('');

    try {
      await onSubmit(text);
      // Success — clear
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_LENGTH - content.length;
  const overLimit = remaining < 0;

  return (
    <div className="space-y-2">
      <div
        className={`rounded-xl border transition-colors ${
          error
            ? 'border-red-300 dark:border-red-900'
            : 'border-gray-300 dark:border-gray-700 focus-within:border-indigo-500 dark:focus-within:border-indigo-600'
        } bg-white dark:bg-gray-800`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={MAX_LENGTH + 100 /* soft cap for over-typing */}
          placeholder="Write a comment…"
          disabled={submitting || disabled}
          className="w-full px-3 py-2.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 rounded-xl focus:outline-none resize-none disabled:opacity-60"
        />
      </div>

      {/* Footer: hint left, actions right */}
      <div className="flex items-center justify-between gap-2 min-h-[28px]">
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : overLimit ? (
            <span className="text-red-600 dark:text-red-400">
              {Math.abs(remaining)} over limit
            </span>
          ) : (
            <>
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono">
                Ctrl
              </kbd>
              {' + '}
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono">
                Enter
              </kbd>
              {' to post'}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {content.length > 0 && remaining <= 200 && !overLimit && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {remaining} left
            </span>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || overLimit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            {submitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;