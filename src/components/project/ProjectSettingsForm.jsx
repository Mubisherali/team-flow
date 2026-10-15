// -------------------------------------------------------------
// ProjectSettingsForm - Rename + description + color
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the "General" card on the project
//   settings page.
//
// STRUCTURE:
//   <form>
//     - Status banner (glass success / error, AnimatePresence)
//     - Live preview (avatar + name + color name)
//     - Name field
//     - Description field (with counter)
//     - Color picker (radiogroup with aria-checked)
//     - Footer: dirty indicator + Save button
//
// POLISH:
//   - Glass status banner + auto-dismiss success after 2.5s
//   - Soft indigo focus ring on inputs
//   - Save button gets spinner + active:scale + focus ring
//   - Color picker upgraded to role=radiogroup
//   - Live preview avatar gets inner ring
//   - A11y: aria-invalid, aria-describedby, role=alert
//
// PRESERVED:
//   - Props (workspaceId, projectId, initialName,
//     initialDescription, initialColor)
//   - State (form, errors, status, loading)
//   - isDirty logic
//   - Zod validation via updateProjectSchema
//   - PATCH /api/workspaces/[id]/projects/[projectId]
//   - router.refresh() after success
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { updateProjectSchema } from '@/lib/validators/project';
import { PROJECT_COLORS } from '@/lib/project-colors';

const ProjectSettingsForm = ({
  workspaceId,
  projectId,
  initialName,
  initialDescription,
  initialColor,
}) => {
  const [form, setForm] = useState({
    name: initialName,
    description: initialDescription,
    color: initialColor,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Detect unsaved changes
  const isDirty =
    form.name !== initialName ||
    form.description !== initialDescription ||
    form.color !== initialColor;

  // Auto-dismiss success banner
  useEffect(() => {
    if (status.type !== 'success') return;
    const t = setTimeout(() => setStatus({ type: '', message: '' }), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleColor = (value) => {
    setForm((prev) => ({ ...prev, color: value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: '', message: '' });
    setLoading(true);

    const parsed = updateProjectSchema.safeParse(form);
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
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to save' });
        setLoading(false);
        return;
      }

      setStatus({ type: 'success', message: 'Changes saved' });
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error('[PROJECT_SETTINGS]', err);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  const initials = form.name.trim()
    ? form.name.trim().slice(0, 2).toUpperCase()
    : 'PR';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* ─── Status banner ─── */}
      <AnimatePresence>
        {status.message && (
          <motion.div
            key={status.type}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className={`
              rounded-xl px-3.5 py-3 border
              ${
                status.type === 'success'
                  ? 'bg-emerald-500/[0.07] dark:bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/[0.07] dark:bg-red-500/10 border-red-500/20'
              }
            `}
          >
            <p
              className={`text-[12.5px] ${
                status.type === 'success'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {status.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Preview ─── */}
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
            {form.name || 'Project name'}
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
          htmlFor="name"
          className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
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
          htmlFor="description"
          className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
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

      {/* ─── Save ─── */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {isDirty && !loading && (
          <span className="text-[11.5px] text-gray-500 dark:text-gray-400">
            Unsaved changes
          </span>
        )}
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="
            inline-flex items-center gap-2
            px-3.5 py-2 rounded-xl
            bg-indigo-600 hover:bg-indigo-700
            disabled:bg-gray-200 dark:disabled:bg-white/[0.06]
            disabled:text-gray-400 dark:disabled:text-gray-500
            disabled:cursor-not-allowed
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
            text-white text-[13px] font-medium
            transition-all duration-150
          "
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectSettingsForm;