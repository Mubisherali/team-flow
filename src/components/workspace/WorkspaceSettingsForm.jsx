// -------------------------------------------------------------
// WorkspaceSettingsForm - Rename + description form
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the "General" card on the workspace
//   settings page.
//
// STRUCTURE:
//   <form>
//     - Status banner (glass success / error, AnimatePresence)
//     - Name field
//     - Description field (with counter)
//     - Footer: dirty indicator + Save button
//
// POLISH:
//   - Glass status banner (matches TaskDetailModal surfaces)
//   - Soft indigo focus ring (matches InviteMemberModal inputs)
//   - Save button gets spinner + active:scale + focus ring
//   - Success banner auto-dismisses after 2.5s
//   - Motion on banner enter/exit
//   - aria-live on the status banner for screen readers
//
// PRESERVED:
//   - Props (workspaceId, initialName, initialDescription)
//   - State (form, errors, status, loading)
//   - isDirty logic
//   - Zod validation via updateWorkspaceSchema
//   - PATCH /api/workspaces/:id
//   - router.refresh() after success
// -------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { updateWorkspaceSchema } from '@/lib/validators/workspace';

const WorkspaceSettingsForm = ({
  workspaceId,
  initialName,
  initialDescription,
}) => {
  const [form, setForm] = useState({
    name: initialName,
    description: initialDescription,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Detect if there are unsaved changes (nice UX).
  const isDirty =
    form.name !== initialName ||
    form.description !== initialDescription;

  // Auto-dismiss success banner after 2.5s.
  useEffect(() => {
    if (status.type !== 'success') return;
    const t = setTimeout(() => setStatus({ type: '', message: '' }), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: '', message: '' });
    setLoading(true);

    // Client-side validation
    const parsed = updateWorkspaceSchema.safeParse(form);
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
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to save changes',
        });
        setLoading(false);
        return;
      }

      setStatus({ type: 'success', message: 'Changes saved' });
      setLoading(false);

      // Refresh server data so the layout/sidebar reflect the new name.
      router.refresh();
    } catch (err) {
      console.error('[SETTINGS_FORM]', err);
      setStatus({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      setLoading(false);
    }
  };

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
              rounded-xl px-3.5 py-3
              border
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
          maxLength={200}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
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

      {/* ─── Footer ─── */}
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

export default WorkspaceSettingsForm;