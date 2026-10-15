// -------------------------------------------------------------
// CreateProjectModal - Create a new project
// -------------------------------------------------------------
//
// WHEN USED:
//   Opened from ProjectsSection's "New project" button or the
//   dashed "Create project" card.
//
// STRUCTURE:
//   Backdrop (animated)
//     - Modal card (animated)
//         - Header (title + close)
//         - Body:
//             - Live preview (avatar + name + color name)
//             - Name field
//             - Description field with counter
//             - Color picker (glass swatches with ring on select)
//             - Actions
//
// POLISH:
//   - Framer Motion entry + exit
//   - Glass error surface
//   - Soft indigo focus ring on inputs
//   - Body scroll lock while open
//   - Color swatches polished with active:scale
//   - Submit button gets spinner + active:scale
//   - A11y: role=dialog, aria-modal, aria-labelledby,
//     role=radiogroup for the color picker, aria-checked
//
// PRESERVED:
//   - Props (isOpen, onClose, workspaceId, onCreated)
//   - State (form, errors, serverError, loading)
//   - Zod validation via createProjectSchema
//   - POST /api/workspaces/[id]/projects
//   - Redirect to /workspaces/[id]/projects/[newProjectId]
//   - Esc + backdrop close (respect loading)
//   - Auto-focus name on open
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { createProjectSchema } from '@/lib/validators/project';
import {
  PROJECT_COLORS,
  DEFAULT_PROJECT_COLOR,
} from '@/lib/project-colors';

const CreateProjectModal = ({
  isOpen,
  onClose,
  workspaceId,
  onCreated,
}) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: DEFAULT_PROJECT_COLOR,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameRef = useRef(null);
  const router = useRouter();

  // ─── Reset + focus when modal opens ───
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', description: '', color: DEFAULT_PROJECT_COLOR });
      setErrors({});
      setServerError('');
      setLoading(false);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ─── Esc closes ───
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleColor = (value) => {
    setForm((prev) => ({ ...prev, color: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    const parsed = createProjectSchema.safeParse(form);
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

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to create project');
        setLoading(false);
        return;
      }

      // Notify parent (optional)
      onCreated?.(data.project);

      // Redirect to the new project detail page
      router.push(`/workspaces/${workspaceId}/projects/${data.project.id}`);
      router.refresh();
    } catch (err) {
      console.error('[CREATE_PROJECT]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // ─── Live preview initials ───
  const initials = form.name.trim()
    ? form.name.trim().slice(0, 2).toUpperCase()
    : 'PR';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-project-root"
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
          aria-labelledby="create-project-title"
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
                id="create-project-title"
                className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Create project
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
              className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1"
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

              {/* ─── Live preview ─── */}
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-12 h-12 rounded-xl flex-shrink-0
                    flex items-center justify-center
                    text-white font-bold text-[13px]
                    ring-1 ring-inset ring-white/20
                    transition-colors duration-200
                  "
                  style={{ backgroundColor: form.color }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                    {form.name.trim() || 'Project preview'}
                  </p>
                  <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
                    {PROJECT_COLORS.find((c) => c.value === form.color)?.name ||
                      'Custom'}
                  </p>
                </div>
              </div>

              {/* ─── Name ─── */}
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Name
                </label>
                <input
                  ref={nameRef}
                  id="project-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="NOVA E-Commerce"
                  maxLength={60}
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
              </div>

              {/* ─── Description ─── */}
              <div>
                <label
                  htmlFor="project-description"
                  className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Description{' '}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="project-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What is this project about?"
                  rows={3}
                  maxLength={300}
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
                  {form.description.length}/300
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

              {/* ─── Color picker ─── */}
              <div>
                <label
                  id="color-picker-label"
                  className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Color
                </label>
                <div
                  role="radiogroup"
                  aria-labelledby="color-picker-label"
                  className="flex flex-wrap gap-2"
                >
                  {PROJECT_COLORS.map((c) => {
                    const isSelected = form.color === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={c.name}
                        onClick={() => handleColor(c.value)}
                        title={c.name}
                        className={`
                          w-8 h-8 rounded-lg
                          flex items-center justify-center
                          active:scale-[0.92]
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                          transition-all duration-150
                          ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0f1115] ring-gray-900 dark:ring-white scale-110'
                              : 'hover:scale-105'
                          }
                        `}
                        style={{ backgroundColor: c.value }}
                      >
                        {isSelected && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            aria-hidden="true"
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
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
                    'Create project'
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

export default CreateProjectModal;