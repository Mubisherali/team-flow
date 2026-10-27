
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

const inputBase =
  'w-full rounded-xl border bg-white/[0.025] px-3.5 py-3 text-[13px] text-white placeholder:text-white/25 outline-none transition duration-200 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/10 disabled:cursor-not-allowed disabled:opacity-50';

const inputNormal =
  'border-white/[0.09] hover:border-white/[0.15]';

const inputErrorState =
  'border-red-400/50 focus:border-red-400/70 focus:ring-red-400/10';

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="mt-1.5 text-[11px] leading-4 text-red-400">
      {children}
    </p>
  );
}

function FieldLabel({ htmlFor, children, optional = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55"
    >
      {children}
      {optional && (
        <span className="ml-1.5 font-normal normal-case tracking-normal text-white/30">
          Optional
        </span>
      )}
    </label>
  );
}

function CloseIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m18 6-12 12M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity=".25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
    currentUserRole === 'OWNER' ||
    currentUserRole === 'MANAGER';

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
  const labelInputRef = useRef(null);
  const openerRef = useRef(null);
  const focusTimerRef = useRef(null);
  const submittingRef = useRef(false);
  const wasOpenRef = useRef(false);

  const router = useRouter();

  // Reset the form and focus the title when the modal opens.
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      openerRef.current = document.activeElement;

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
      submittingRef.current = false;

      focusTimerRef.current = setTimeout(() => {
        titleRef.current?.focus();
      }, 100);
    }

    if (!isOpen && wasOpenRef.current) {
      openerRef.current?.focus?.();
      openerRef.current = null;
    }

    wasOpenRef.current = isOpen;

    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, [isOpen, defaultStatus]);

  // Escape closes the modal unless a task is being created.
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (
        event.key === 'Escape' &&
        !submittingRef.current
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  // Lock background scrolling while the modal is open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Keep the existing permission-based assignee filtering.
  const assignableMembers = useMemo(() => {
    if (!projectMembers) return [];

    if (isPrivileged) return projectMembers;

    return projectMembers.filter(
      (member) => member.userId === currentUserId
    );
  }, [
    isPrivileged,
    projectMembers,
    currentUserId,
  ]);

  const statusOptions = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        value: status.value,
        label: status.label,
        dot: status.dot,
      })),
    []
  );

  const priorityOptions = useMemo(
    () =>
      TASK_PRIORITIES.map((priority) => ({
        value: priority.value,
        label: priority.label,
        dot: priority.dot,
      })),
    []
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => {
      if (!previous[name]) return previous;

      const next = { ...previous };
      delete next[name];
      return next;
    });

    setServerError('');
  }

  function handleSelectChange(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => {
      if (!previous[name]) return previous;

      const next = { ...previous };
      delete next[name];
      return next;
    });

    setServerError('');
  }

  // Validate and add a label without relying on blur events.
  function addLabel(value = labelInput) {
    const normalized = value.trim().toLowerCase();

    if (!normalized) return true;

    if (normalized.length > 24) {
      setErrors((previous) => ({
        ...previous,
        labels: 'Label must be 24 characters or fewer.',
      }));
      return false;
    }

    if (!/^[a-z0-9 _-]+$/.test(normalized)) {
      setErrors((previous) => ({
        ...previous,
        labels:
          'Only letters, numbers, spaces, hyphens, and underscores are allowed.',
      }));
      return false;
    }

    if (form.labels.includes(normalized)) {
      setLabelInput('');
      setErrors((previous) => ({
        ...previous,
        labels: undefined,
      }));
      return true;
    }

    if (form.labels.length >= 8) {
      setErrors((previous) => ({
        ...previous,
        labels: 'A task can have at most 8 labels.',
      }));
      return false;
    }

    setForm((previous) => ({
      ...previous,
      labels: [...previous.labels, normalized],
    }));

    setLabelInput('');

    setErrors((previous) => ({
      ...previous,
      labels: undefined,
    }));

    return true;
  }

  function handleLabelKeyDown(event) {
    if (
      event.key === 'Enter' ||
      event.key === ','
    ) {
      event.preventDefault();
      addLabel();
      return;
    }

    if (
      event.key === 'Backspace' &&
      !labelInput &&
      form.labels.length > 0
    ) {
      setForm((previous) => ({
        ...previous,
        labels: previous.labels.slice(0, -1),
      }));
    }
  }

  function handleRemoveLabel(labelToRemove) {
    setForm((previous) => ({
      ...previous,
      labels: previous.labels.filter(
        (label) => label !== labelToRemove
      ),
    }));

    setErrors((previous) => ({
      ...previous,
      labels: undefined,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current) return;

    setServerError('');
    setErrors({});

    // Include a pending label if the user submits without pressing Enter.
    let finalLabels = [...form.labels];
    const pendingLabel = labelInput.trim().toLowerCase();

    if (pendingLabel) {
      if (
        pendingLabel.length > 24 ||
        !/^[a-z0-9 _-]+$/.test(pendingLabel)
      ) {
        setErrors({
          labels:
            'Finish the label using valid characters before submitting.',
        });
        labelInputRef.current?.focus();
        return;
      }

      if (!finalLabels.includes(pendingLabel)) {
        if (finalLabels.length >= 8) {
          setErrors({
            labels: 'A task can have at most 8 labels.',
          });
          labelInputRef.current?.focus();
          return;
        }

        finalLabels.push(pendingLabel);
      }
    }

    let dueDate;

    if (form.dueDate) {
      try {
        dueDate = fromDateTimeLocal(form.dueDate);

        if (
          dueDate instanceof Date &&
          Number.isNaN(dueDate.getTime())
        ) {
          throw new Error('Invalid date');
        }
      } catch {
        setErrors({
          dueDate: 'Please enter a valid due date.',
        });
        return;
      }
    }

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || undefined,
      dueDate,
      labels: finalLabels,
    };

    const parsed = createTaskSchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }

      setErrors(nextErrors);

      if (nextErrors.title) {
        titleRef.current?.focus();
      }

      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsed.data),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Failed to create task. Please try again.'
        );
      }

      onCreated?.(data?.task);
      router.refresh();
      onClose();
    } catch (error) {
      console.error('[CREATE_TASK]', error);

      setServerError(
        error?.message ||
          'Network error. Please try again.'
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="create-task-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !submittingRef.current
          ) {
            onClose();
          }
        }}
      >
        <motion.section
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-title"
          className="flex max-h-[92dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-white/[0.11] bg-[#0e1014] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-400/[0.09] text-indigo-300">
                  <TaskIcon />
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80">
                    Task management
                  </p>

                  <h2
                    id="create-task-title"
                    className="text-lg font-semibold tracking-[-0.035em] text-[#f5f5f0]"
                  >
                    Create a task
                  </h2>

                  <p className="mt-0.5 text-xs text-white/40">
                    Add work to your project
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !loading && onClose()}
                disabled={loading}
                aria-label="Close create task dialog"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                <CloseIcon />
              </button>
            </header>

            {/* Scrollable form */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3.5"
                  >
                    <svg
                      className="mt-0.5 shrink-0 text-red-300"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 8v5m0 3h.01"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>

                    <p className="flex-1 text-[13px] leading-5 text-red-200">
                      {serverError}
                    </p>

                    <button
                      type="button"
                      onClick={() => setServerError('')}
                      className="text-red-300/60 transition hover:text-red-200"
                      aria-label="Dismiss error"
                    >
                      <CloseIcon size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title */}
              <div>
                <FieldLabel htmlFor="task-title">
                  Task title
                </FieldLabel>

                <input
                  ref={titleRef}
                  id="task-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="What needs to get done?"
                  maxLength={150}
                  disabled={loading}
                  aria-invalid={Boolean(errors.title)}
                  className={`${inputBase} py-3.5 text-sm font-medium ${
                    errors.title
                      ? inputErrorState
                      : inputNormal
                  }`}
                />

                <FieldError>{errors.title}</FieldError>
              </div>

              {/* Description */}
              <div>
                <FieldLabel
                  htmlFor="task-description"
                  optional
                >
                  Description
                </FieldLabel>

                <textarea
                  id="task-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  placeholder="Add context, requirements, or notes..."
                  disabled={loading}
                  className={`${inputBase} min-h-[95px] resize-y leading-6 ${inputNormal}`}
                />
              </div>

              {/* Status and priority */}
              <div>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-white/60">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 7h16M4 12h10M4 17h13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-medium text-white/85">
                      Task details
                    </h3>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      Set status and priority
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Status</FieldLabel>

                    <Select
                      value={form.status}
                      options={statusOptions}
                      onChange={(value) =>
                        handleSelectChange('status', value)
                      }
                      disabled={loading}
                      size="md"
                    />

                    <FieldError>{errors.status}</FieldError>
                  </div>

                  <div>
                    <FieldLabel>Priority</FieldLabel>

                    <Select
                      value={form.priority}
                      options={priorityOptions}
                      onChange={(value) =>
                        handleSelectChange('priority', value)
                      }
                      disabled={loading}
                      size="md"
                    />

                    <FieldError>{errors.priority}</FieldError>
                  </div>
                </div>
              </div>

              {/* Assignee and due date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Assignee</FieldLabel>

                  <AssigneeSelect
                    value={form.assigneeId}
                    members={assignableMembers}
                    currentUserId={currentUserId}
                    disabled={loading}
                    onChange={(value) =>
                      handleSelectChange('assigneeId', value)
                    }
                  />

                  <p className="mt-1.5 text-[10px] leading-4 text-white/30">
                    {isPrivileged
                      ? 'Choose a project member.'
                      : 'You can assign this task to yourself.'}
                  </p>

                  <FieldError>{errors.assigneeId}</FieldError>
                </div>

                <div>
                  <FieldLabel
                    htmlFor="task-due-date"
                    optional
                  >
                    Due date
                  </FieldLabel>

                  <input
                    id="task-due-date"
                    name="dueDate"
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={handleChange}
                    disabled={loading}
                    aria-invalid={Boolean(errors.dueDate)}
                    className={`${inputBase} [color-scheme:dark] ${
                      errors.dueDate
                        ? inputErrorState
                        : inputNormal
                    }`}
                  />

                  <FieldError>{errors.dueDate}</FieldError>
                </div>
              </div>

              {/* Labels */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <FieldLabel optional>Labels</FieldLabel>

                  <span className="text-[10px] tabular-nums text-white/30">
                    {form.labels.length}/8
                  </span>
                </div>

                <div
                  className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] p-2.5 transition focus-within:border-indigo-400/50 focus-within:ring-2 focus-within:ring-indigo-400/10"
                  onClick={() => labelInputRef.current?.focus()}
                >
                  {form.labels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-indigo-300/15 bg-indigo-300/[0.08] px-2.5 py-1.5 text-xs font-medium text-indigo-200"
                    >
                      <span className="truncate">{label}</span>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveLabel(label);
                        }}
                        disabled={loading}
                        aria-label={`Remove ${label} label`}
                        className="shrink-0 text-indigo-200/60 transition hover:text-white"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </span>
                  ))}

                  <input
                    ref={labelInputRef}
                    value={labelInput}
                    onChange={(event) => {
                      setLabelInput(event.target.value);
                      setErrors((previous) => ({
                        ...previous,
                        labels: undefined,
                      }));
                    }}
                    onKeyDown={handleLabelKeyDown}
                    placeholder={
                      form.labels.length
                        ? 'Add another...'
                        : 'Type a label and press Enter'
                    }
                    maxLength={25}
                    disabled={loading || form.labels.length >= 8}
                    aria-label="Add task label"
                    className="min-w-[130px] flex-1 bg-transparent px-1 py-1 text-xs text-white outline-none placeholder:text-white/25 disabled:opacity-40"
                  />

                  {labelInput.trim() && (
                    <button
                      type="button"
                      onClick={() => addLabel()}
                      disabled={loading}
                      aria-label="Add label"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                    >
                      <PlusIcon />
                    </button>
                  )}
                </div>

                <p className="mt-2 text-[10px] text-white/30">
                  Press Enter or comma to add. Backspace removes the last label.
                </p>

                <FieldError>{errors.labels}</FieldError>
              </div>
            </div>

            {/* Footer */}
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] bg-[#0b0d11] px-5 py-4 sm:px-6">
              <p className="hidden text-[10px] text-white/30 sm:block">
                Keep tasks clear and actionable.
              </p>

              <div className="ml-auto flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-[13px] font-medium text-white/65 transition hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_12px_rgba(99,102,241,0.15)] transition hover:bg-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Create task
                    </>
                  )}
                </button>
              </div>
            </footer>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTaskModal;
