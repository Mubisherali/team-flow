// -------------------------------------------------------------
// CreateWorkspaceModal - Form to create a new workspace
// -------------------------------------------------------------
//
// WHEN USED:
//   Opened from the workspace list page. Only one flow —
//   fill name + optional description → POST → parent handles
//   the redirect.
//
// STRUCTURE:
//   Backdrop (animated)
//     - Modal card (animated)
//         - Header (title + close)
//         - Body (form: server error, name + slug preview,
//           description + counter, actions)
//
// POLISH:
//   - Framer Motion entry + exit (backdrop + card)
//   - Glass surfaces for error
//   - Soft indigo focus ring on inputs
//   - Body scroll lock while open
//   - Live slug preview styled as a chip
//   - Submit button gets spinner + active:scale
//   - A11y: role=dialog, aria-modal, aria-labelledby,
//     aria-describedby, aria-invalid, role=alert
//
// PRESERVED:
//   - Same props (isOpen, onClose, onCreated)
//   - Same state (form, errors, serverError, loading)
//   - previewSlug local helper (browser-safe copy)
//   - Zod validation via createWorkspaceSchema
//   - POST /api/workspaces
//   - Esc closes (respects loading)
//   - Backdrop click closes (respects loading)
//   - Auto-focus name on open
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { createWorkspaceSchema } from '@/lib/validators/workspace';

// -------------------------------------------------------------
// LOCAL slugify - tiny copy for live preview
// -------------------------------------------------------------
// We don't import from lib/slug because that file pulls in
// Prisma (which can't run in the browser). This is a
// lightweight duplicate used ONLY for UI preview.
function previewSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

const CreateWorkspaceModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameInputRef = useRef(null);

  // ─── Reset form + focus when the modal opens ───
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', description: '' });
      setErrors({});
      setServerError('');
      setLoading(false);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ─── Esc closes ───
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // ─── Body scroll lock ───
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ─── Input handler ───
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  // ─── Submit ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    // Client-side validation
    const parsed = createWorkspaceSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    // POST to API
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to create workspace');
        setLoading(false);
        return;
      }

      // Success → notify parent
      onCreated(data.workspace);
      setLoading(false);
    } catch (err) {
      console.error('[CREATE_WORKSPACE]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // ─── Render ───
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-workspace-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={() => !loading && onClose()}
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            p-3 sm:p-4
            bg-black/50 dark:bg-black/70
            backdrop-blur-sm
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-workspace-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative w-full max-w-md
              bg-white dark:bg-[#0f1115]
              rounded-2xl
              border border-gray-200 dark:border-white/[0.08]
              shadow-2xl shadow-black/20 dark:shadow-black/60
              max-h-[92vh]
              flex flex-col
              overflow-hidden
            "
          >
            {/* ══════════ HEADER ══════════ */}
            <div
              className="
                flex items-center justify-between flex-shrink-0
                px-5 py-4
                border-b border-gray-200 dark:border-white/[0.06]
              "
            >
              <h2
                id="create-workspace-title"
                className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Create a workspace
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
                className="
                  p-2 rounded-lg
                  text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  active:scale-[0.96]
                  disabled:opacity-50
                  transition-all duration-150
                "
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ══════════ BODY ══════════ */}
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1"
              noValidate
            >
              {serverError && (
                <div
                  role="alert"
                  className="
                    rounded-xl px-3.5 py-3
                    bg-red-500/[0.07] dark:bg-red-500/10
                    border border-red-500/20
                  "
                >
                  <p className="text-[12.5px] text-red-700 dark:text-red-300">
                    {serverError}
                  </p>
                </div>
              )}

              {/* ─── Name field ─── */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Workspace name
                </label>
                <input
                  ref={nameInputRef}
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="NOVA TECH"
                  maxLength={50}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`
                    w-full px-3 py-2.5 rounded-xl
                    text-[13px]
                    bg-white dark:bg-white/[0.03]
                    text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    border transition-all duration-150
                    focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/20
                    ${
                      errors.name
                        ? 'border-red-300 dark:border-red-500/40'
                        : 'border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-500/60'
                    }
                  `}
                />
                {errors.name && (
                  <p
                    id="name-error"
                    className="text-[11px] text-red-600 dark:text-red-400 mt-1.5"
                  >
                    {errors.name}
                  </p>
                )}

                {/* Live slug preview */}
                {form.name.trim().length >= 2 && (
                  <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-2">
                    URL:{' '}
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06]">
                      /workspaces/{previewSlug(form.name)}
                    </span>
                  </p>
                )}
              </div>

              {/* ─── Description field ─── */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Description{' '}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What is this workspace for?"
                  rows={3}
                  maxLength={200}
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description ? 'description-error' : undefined
                  }
                  className={`
                    w-full px-3 py-2.5 rounded-xl
                    text-[13px]
                    bg-white dark:bg-white/[0.03]
                    text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    border transition-all duration-150
                    focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/20
                    resize-none
                    ${
                      errors.description
                        ? 'border-red-300 dark:border-red-500/40'
                        : 'border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-500/60'
                    }
                  `}
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 text-right tabular-nums">
                  {form.description.length}/200
                </p>
                {errors.description && (
                  <p
                    id="description-error"
                    className="text-[11px] text-red-600 dark:text-red-400 mt-1"
                  >
                    {errors.description}
                  </p>
                )}
              </div>

              {/* ─── Actions ─── */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="
                    flex-1 py-2.5 rounded-xl
                    border border-gray-300 dark:border-white/[0.08]
                    text-gray-700 dark:text-gray-300
                    text-[13px] font-medium
                    hover:bg-gray-50 dark:hover:bg-white/[0.04]
                    active:scale-[0.98]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    flex-1 py-2.5 rounded-xl
                    bg-indigo-600 hover:bg-indigo-700
                    disabled:bg-indigo-400 dark:disabled:bg-indigo-800
                    disabled:cursor-not-allowed
                    active:scale-[0.98]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                    text-white text-[13px] font-medium
                    transition-all duration-150
                    inline-flex items-center justify-center gap-2
                  "
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;