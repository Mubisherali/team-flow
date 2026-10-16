// -------------------------------------------------------------
// CreateTaskModal - Create a new task
// -------------------------------------------------------------
//
// WHEN USED:
//   Opened from ProjectTasksSection's "New task" button or a
//   Kanban column's "+" button.
//
// STRUCTURE:
//   Backdrop (animated)
//     - Modal card (animated)
//         - Header (title + close)
//         - Form body:
//             - Error banner
//             - Title
//             - Description
//             - Status + Priority (custom <Select>)
//             - Assignee (<AssigneeSelect>) + Due date
//             - Labels (chip input)
//         - Footer (Cancel / Create task)
//
// POLISH:
//   - Framer Motion entry + exit
//   - Custom glass dropdowns via <Select> + <AssigneeSelect>
//     (matches TaskDetailModal exactly)
//   - Glass error banner
//   - Body scroll lock
//   - Enter-to-submit (footer inside form)
//   - Spinner in submit button
//
// PRESERVED:
//   - All state (form, labelInput, errors, serverError, loading)
//   - Label chip input behavior (Enter/comma to add, Backspace)
//   - Assignee filtering by permission
//   - Zod validation via createTaskSchema
//   - POST /api/projects/[projectId]/tasks
//   - Esc + backdrop close (respect loading)
//   - Auto-focus title on open
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { createTaskSchema } from '@/lib/validators/task';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  fromDateTimeLocal,
} from '@/lib/task-constants';
import Select from '@/components/ui/Select';
import AssigneeSelect from '@/components/ui/AssigneeSelect';

// ─── Shared input styles ───
const inputBase = `
  w-full px-3.5 py-2.5 rounded-xl text-[13px]
  border bg-white dark:bg-white/[0.03]
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-gray-500
  focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
  transition-all duration-200
  disabled:opacity-60 disabled:cursor-not-allowed
`;
const inputNormal =
  'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]';
const inputErrorState =
  'border-red-300 dark:border-red-500/40 focus:ring-red-500/60 focus:border-red-500';

const CreateTaskModal = ({
  isOpen,
  onClose,
  projectId,
  projectMembers,
  defaultStatus = 'TODO',
  onCreated,
  currentUserId,
  currentUserRole,
}) => {
  const isPrivileged =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    labels: [],
  });

  const [labelInput, setLabelInput] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const titleRef = useRef(null);
  const router = useRouter();

  // ─── Reset + focus on open ───
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'MEDIUM',
      assigneeId: '',
      dueDate: '',
      labels: [],
    });
    setLabelInput('');
    setErrors({});
    setServerError('');
    setLoading(false);
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [isOpen, defaultStatus]);

  // ─── Escape closes ───
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (serverError) setServerError('');
  };

  // ─── Assignable members (filtered by permission) ───
  const assignableMembers = useMemo(() => {
    if (!projectMembers) return [];
    if (isPrivileged) return projectMembers;
    return projectMembers.filter((m) => m.userId === currentUserId);
  }, [isPrivileged, projectMembers, currentUserId]);

  // ─── Dropdown options ───
  const statusOptions = useMemo(
    () =>
      TASK_STATUSES.map((s) => ({
        value: s.value,
        label: s.label,
        dot: s.dot,
      })),
    []
  );

  const priorityOptions = useMemo(
    () =>
      TASK_PRIORITIES.map((p) => ({
        value: p.value,
        label: p.label,
        dot: p.dot,
      })),
    []
  );

  // ─── Labels ───
  const handleAddLabel = () => {
    const raw = labelInput.trim().toLowerCase();
    if (!raw) return;

    if (raw.length > 24) {
      setErrors((p) => ({
        ...p,
        labels: 'Label must be 24 characters or fewer',
      }));
      return;
    }
    if (form.labels.includes(raw)) {
      setLabelInput('');
      return;
    }
    if (form.labels.length >= 8) {
      setErrors((p) => ({ ...p, labels: 'A task can have at most 8 labels' }));
      return;
    }
    if (!/^[a-z0-9 _-]+$/.test(raw)) {
      setErrors((p) => ({
        ...p,
        labels: 'Only letters, numbers, spaces, hyphens, underscores',
      }));
      return;
    }

    setForm((p) => ({ ...p, labels: [...p.labels, raw] }));
    setLabelInput('');
    setErrors((p) => ({ ...p, labels: undefined }));
  };

  const handleRemoveLabel = (label) => {
    setForm((p) => ({ ...p, labels: p.labels.filter((l) => l !== label) }));
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddLabel();
    } else if (e.key === 'Backspace' && !labelInput && form.labels.length > 0) {
      handleRemoveLabel(form.labels[form.labels.length - 1]);
    }
  };

  // ─── Submit ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || undefined,
      dueDate: form.dueDate ? fromDateTimeLocal(form.dueDate) : undefined,
      labels: form.labels,
    };

    const parsed = createTaskSchema.safeParse(payload);
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
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to create task');
        setLoading(false);
        return;
      }

      onCreated?.(data.task);
      router.refresh();
      onClose();
    } catch (err) {
      console.error('[CREATE_TASK]', err);
      setServerError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // ─── Render ───
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-task-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            p-3 sm:p-4
            bg-black/50 dark:bg-black/70
            backdrop-blur-sm
          "
          onClick={() => !loading && onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="
              relative w-full max-w-lg
              bg-white dark:bg-[#0f1115]
              rounded-2xl
              border border-gray-200 dark:border-white/[0.08]
              shadow-2xl shadow-black/20 dark:shadow-black/60
              max-h-[92vh]
              flex flex-col
              overflow-hidden
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* ══════════ HEADER ══════════ */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/[0.06]">
              <h2
                id="create-task-title"
                className="text-[15px] font-semibold text-gray-900 dark:text-white"
              >
                Create task
              </h2>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="
                  p-2 rounded-lg
                  text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  active:scale-[0.96]
                  disabled:opacity-50
                  transition-all duration-150
                "
                aria-label="Close"
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

            {/* ══════════ FORM ══════════ */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
              noValidate
            >
              {/* Body (scrollable) */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
                {/* ─── Error banner ─── */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div
                        role="alert"
                        className="
                          flex items-start gap-2.5 p-3 rounded-xl
                          bg-red-500/[0.07] dark:bg-red-500/10
                          border border-red-500/20
                        "
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                        </svg>
                        <p className="text-[13px] text-red-700 dark:text-red-300 flex-1">
                          {serverError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setServerError('')}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                          aria-label="Dismiss error"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            aria-hidden="true"
                          >
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Title ─── */}
                <div>
                  <label
                    htmlFor="task-title"
                    className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Title
                  </label>
                  <input
                    ref={titleRef}
                    id="task-title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="What needs to be done?"
                    maxLength={150}
                    disabled={loading}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                    className={`${inputBase} ${
                      errors.title ? inputErrorState : inputNormal
                    }`}
                  />
                  {errors.title && (
                    <p
                      id="title-error"
                      className="text-[11px] text-red-600 dark:text-red-400 mt-1.5"
                    >
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* ─── Description ─── */}
                <div>
                  <label
                    htmlFor="task-desc"
                    className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Description{' '}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="task-desc"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    maxLength={2000}
                    placeholder="Add more details…"
                    disabled={loading}
                    className={`${inputBase} resize-none`}
                  />
                </div>

                {/* ─── Status + Priority ─── */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Status
                    </label>
                    <Select
                      value={form.status}
                      options={statusOptions}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, status: v }))
                      }
                      disabled={loading}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Priority
                    </label>
                    <Select
                      value={form.priority}
                      options={priorityOptions}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, priority: v }))
                      }
                      disabled={loading}
                      size="md"
                    />
                  </div>
                </div>

                {/* ─── Assignee + Due date ─── */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Assignee
                    </label>
                    <AssigneeSelect
                      value={form.assigneeId}
                      members={assignableMembers}
                      currentUserId={currentUserId}
                      disabled={loading}
                      onChange={(v) =>
                        setForm((prev) => ({ ...prev, assigneeId: v }))
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="task-due"
                      className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      Due date
                    </label>
                    <input
                      id="task-due"
                      name="dueDate"
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={handleChange}
                      disabled={loading}
                      className={`${inputBase} ${inputNormal}`}
                    />
                  </div>
                </div>

                {/* ─── Labels ─── */}
                <div>
                  <label className="block text-[12.5px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Labels
                  </label>

                  {form.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.labels.map((label) => (
                        <span
                          key={label}
                          className="
                            inline-flex items-center gap-1
                            text-[11px] font-medium
                            px-2 py-0.5 rounded-md
                            bg-white dark:bg-white/[0.06]
                            border border-gray-200/70 dark:border-white/[0.05]
                            text-gray-700 dark:text-gray-300
                          "
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => handleRemoveLabel(label)}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                            aria-label={`Remove label ${label}`}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              aria-hidden="true"
                            >
                              <path
                                d="M18 6L6 18M6 6l12 12"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={handleLabelKeyDown}
                    onBlur={handleAddLabel}
                    placeholder="Type and press Enter to add"
                    maxLength={24}
                    disabled={loading}
                    className={`${inputBase} ${
                      errors.labels ? inputErrorState : inputNormal
                    }`}
                  />
                  {errors.labels && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1.5">
                      {errors.labels}
                    </p>
                  )}
                </div>
              </div>

              {/* ══════════ FOOTER ══════════ */}
              <div className="px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-white/[0.06] flex gap-3 bg-gray-50/50 dark:bg-white/[0.01]">
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
                    'Create task'
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

export default CreateTaskModal;