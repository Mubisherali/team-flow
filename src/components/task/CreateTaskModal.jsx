// -------------------------------------------------------------
// CreateTaskModal - Create a new task
// -------------------------------------------------------------
//
// PROPS:
//   isOpen         : boolean
//   onClose        : () => void
//   projectId      : string
//   projectMembers : array — [{ userId, name, email, avatarUrl }]
//   defaultStatus  : 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
//   onCreated      : (task) => void — parent refreshes
//
// COMPLEXITY:
//   - Labels: chip input (type + Enter to add)
//   - Assignee: select from project members
//   - Due date: <input type="datetime-local">
//   - Status/priority: preset selects
// -------------------------------------------------------------

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createTaskSchema } from "@/lib/validators/task";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  toDateTimeLocal,
  fromDateTimeLocal,
} from "@/lib/task-constants";

const CreateTaskModal = ({
  isOpen,
  onClose,
  projectId,
  projectMembers,
  defaultStatus = "TODO",
  onCreated,
  currentUserId,
  currentUserRole,
}) => {
  const isPrivileged =
    currentUserRole === "OWNER" || currentUserRole === "MANAGER";
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
    labels: [],
  });

  const [labelInput, setLabelInput] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const titleRef = useRef(null);
  const router = useRouter();

  // Reset + focus on open
  useEffect(() => {
    if (isOpen) {
      setForm({
        title: "",
        description: "",
        status: defaultStatus,
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: "",
        labels: [],
      });
      setLabelInput("");
      setErrors({});
      setServerError("");
      setLoading(false);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, defaultStatus]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, loading, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (serverError) setServerError("");
  };

  // ─── Labels ───
  const handleAddLabel = () => {
    const raw = labelInput.trim().toLowerCase();
    if (!raw) return;

    // Length check
    if (raw.length > 24) {
      setErrors((p) => ({
        ...p,
        labels: "Label must be 24 characters or fewer",
      }));
      return;
    }
    // Duplicate check
    if (form.labels.includes(raw)) {
      setLabelInput("");
      return;
    }
    // Max 8
    if (form.labels.length >= 8) {
      setErrors((p) => ({ ...p, labels: "A task can have at most 8 labels" }));
      return;
    }
    // Basic pattern check
    if (!/^[a-z0-9 _-]+$/.test(raw)) {
      setErrors((p) => ({
        ...p,
        labels: "Only letters, numbers, spaces, hyphens, underscores",
      }));
      return;
    }

    setForm((p) => ({ ...p, labels: [...p.labels, raw] }));
    setLabelInput("");
    setErrors((p) => ({ ...p, labels: undefined }));
  };

  const handleRemoveLabel = (label) => {
    setForm((p) => ({ ...p, labels: p.labels.filter((l) => l !== label) }));
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddLabel();
    } else if (e.key === "Backspace" && !labelInput && form.labels.length > 0) {
      // Backspace on empty input removes the last label
      handleRemoveLabel(form.labels[form.labels.length - 1]);
    }
  };

  // ─── Submit ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setErrors({});
    setLoading(true);

    // Convert dueDate from datetime-local string to ISO
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to create task");
        setLoading(false);
        return;
      }

      onCreated?.(data.task);
      router.refresh();
      onClose();
    } catch (err) {
      console.error("[CREATE_TASK]", err);
      setServerError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create task
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
          noValidate
        >
          {serverError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-300">
                {serverError}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-desc"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="task-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={2000}
              placeholder="Add more details..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Status
              </label>
              <select
                id="task-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-assignee"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Assignee
              </label>
              <select
                id="task-assignee"
                name="assigneeId"
                value={form.assigneeId}
                onChange={handleChange}
                className="..."
              >
                <option value="">Unassigned</option>
                {/* Only show assignable members: privileged users see
      everyone; members see only themselves. */}
                {(isPrivileged
                  ? projectMembers
                  : projectMembers.filter((m) => m.userId === currentUserId)
                ).map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-due"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Due date
              </label>
              <input
                id="task-due"
                name="dueDate"
                type="datetime-local"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Labels
            </label>

            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(label)}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.labels && (
              <p className="text-xs text-red-600 mt-1">{errors.labels}</p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
