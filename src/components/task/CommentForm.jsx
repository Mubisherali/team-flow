// -------------------------------------------------------------
// CommentForm - Compose a new comment on a task
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered at the bottom of <CommentList>. One instance per
//   task thread.
//
// STRUCTURE:
//   Bordered composer
//     - Auto-growing textarea
//     - Footer (hint / counter left, submit button right)
//
// POLISH:
//   - Focus ring matches TaskDetailModal (indigo, soft glow)
//   - Auto-grow preserved (1 → ~6 rows)
//   - Ctrl/Cmd+Enter submits
//   - Live character counter near limit (≤200)
//   - Screen-reader live region for errors
//   - Submit button mirrors modal's primary button style
//   - Send icon matches Wave-2 stroke weight
//
// PRESERVED:
//   - Same props (onSubmit, disabled)
//   - Same MAX_LENGTH (2000)
//   - Same soft over-typing cap (MAX + 100)
//   - Same save-on-submit model
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

  // -----------------------------------------------------------
  // AUTO-GROW
  // -----------------------------------------------------------
  const autoSize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    // Cap at 200px ≈ 6 rows
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------
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
  const nearLimit = content.length > 0 && remaining <= 200 && !overLimit;

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="space-y-2">
      {/* ─── Composer surface ─── */}
      <div
        className={`
          rounded-xl border transition-all duration-150
          bg-white dark:bg-white/[0.03]
          ${
            error || overLimit
              ? 'border-red-300 dark:border-red-500/40'
              : 'border-gray-200 dark:border-white/[0.08] focus-within:border-indigo-500 dark:focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20'
          }
        `}
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
          aria-label="Write a comment"
          className="
            w-full px-3.5 py-3
            bg-transparent
            text-[13px] text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            rounded-xl
            focus:outline-none
            resize-none
            disabled:opacity-60
          "
        />
      </div>

      {/* ─── Footer: hint left, actions right ─── */}
      <div className="flex items-center justify-between gap-2 min-h-[28px]">
        {/* Left: hint / error / counter */}
        <div className="text-[11px] text-gray-500 dark:text-gray-400 min-w-0 truncate">
          {error ? (
            <span
              className="text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {error}
            </span>
          ) : overLimit ? (
            <span
              className="text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {Math.abs(remaining)} over limit
            </span>
          ) : (
            <>
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-[10px] font-mono">
                Ctrl
              </kbd>
              {' + '}
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-[10px] font-mono">
                Enter
              </kbd>
              {' to post'}
            </>
          )}
        </div>

        {/* Right: counter + submit */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {nearLimit && (
            <span
              className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums"
              aria-live="polite"
            >
              {remaining} left
            </span>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || overLimit}
            className="
              inline-flex items-center gap-1.5
              px-3.5 py-1.5 rounded-lg
              bg-indigo-600 hover:bg-indigo-700
              disabled:bg-gray-200 dark:disabled:bg-white/[0.06]
              disabled:text-gray-400 dark:disabled:text-gray-500
              disabled:cursor-not-allowed
              active:scale-[0.98]
              text-white text-[12px] font-medium
              transition-all duration-150
            "
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
                  aria-hidden="true"
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