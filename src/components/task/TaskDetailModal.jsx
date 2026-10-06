// -------------------------------------------------------------
// TaskDetailModal - Full editor for a single task
// -------------------------------------------------------------
//
// PROPS:
//   isOpen          : boolean
//   onClose         : () => void
//   projectId       : string
//   task            : the task object (or null)
//   projectMembers  : array
//   canEdit         : boolean — can this user edit this task at all?
//   currentUserId   : string
//   currentUserRole : 'OWNER' | 'MANAGER' | 'MEMBER'
//   onUpdated       : (task) => void
//   onDeleted       : (taskId) => void
//
// WORKFLOW:
//   The status dropdown only lists statuses this user can move
//   to. Members won't see DONE. If they can't move at all,
//   status is locked with an explanatory tooltip.
//
// AUTO-SAVE:
//   Text fields save on blur. Selects save immediately on change.
//   A small "Saving..." / "Saved" indicator shows in the header.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { updateTaskSchema } from '@/lib/validators/task';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  statusMeta,
  priorityMeta,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '@/lib/task-constants';

const TaskDetailModal = ({
  isOpen,
  onClose,
  projectId,
  task,
  projectMembers,
  canEdit,
  currentUserId,
  currentUserRole,
  onUpdated,
  onDeleted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState([]);

  const [labelInput, setLabelInput] = useState('');
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const router = useRouter();
  const titleRef = useRef(null);
  const savedTimerRef = useRef(null);

  const isPrivileged =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  // Sync local state when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title || '');
    setDescription(task.description || '');
    setStatus(task.status || 'TODO');
    setPriority(task.priority || 'MEDIUM');
    setAssigneeId(task.assigneeId || '');
    setDueDate(task.dueDate ? toDateTimeLocal(task.dueDate) : '');
    setLabels(task.labels || []);
    setLabelInput('');
    setSaveState('idle');
    setSaveError('');
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [task?.id]);

  // Clear "Saved" indicator
  useEffect(() => {
    if (saveState === 'saved') {
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 1500);
      return () => clearTimeout(savedTimerRef.current);
    }
  }, [saveState]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && saveState !== 'saving' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, saveState, isDeleting, onClose]);

  // -----------------------------------------------------------
  // WORKFLOW: which statuses can this user move to?
  // -----------------------------------------------------------
  // Mirrors canMoveTaskTo on the server.
  const canMoveToStatus = (targetStatus) => {
    if (!task) return false;
    if (targetStatus === task.status) return true; // current status always shown
    if (!canEdit) return false;
    if (isPrivileged) return true;

    const isMyTask =
      task.assigneeId === currentUserId ||
      task.createdById === currentUserId;
    if (!isMyTask) return false;
    if (targetStatus === 'DONE') return false;
    return true;
  };

  // Statuses visible in the dropdown
  const availableStatuses = TASK_STATUSES.filter((s) =>
    canMoveToStatus(s.value)
  );

  // Can this user move the task at all?
  const canMoveStatus = availableStatuses.length > 1;

  // -----------------------------------------------------------
  // PATCH HELPER
  // -----------------------------------------------------------
  const patchTask = async (partial) => {
    if (!task) return;

    setSaveState('saving');
    setSaveError('');

    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partial),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setSaveState('error');
        setSaveError(data.error || 'Failed to save');
        return;
      }

      setSaveState('saved');
      onUpdated?.(data.task);
      router.refresh();
    } catch (err) {
      console.error('[TASK_PATCH]', err);
      setSaveState('error');
      setSaveError('Network error. Please try again.');
    }
  };

  // -----------------------------------------------------------
  // FIELD HANDLERS
  // -----------------------------------------------------------
  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (!task || trimmed === (task.title || '').trim()) return;

    const parsed = updateTaskSchema.safeParse({ title: trimmed });
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0].message);
      setSaveState('error');
      return;
    }
    patchTask({ title: trimmed });
  };

  const handleDescriptionBlur = () => {
    const trimmed = description.trim();
    if (!task || trimmed === (task.description || '').trim()) return;
    patchTask({ description: trimmed });
  };

  const handleSelectChange = (field, value) => {
    if (field === 'status') setStatus(value);
    if (field === 'priority') setPriority(value);
    if (field === 'assigneeId') setAssigneeId(value);
    patchTask({ [field]: value });
  };

  const handleDueDateChange = (e) => {
    const localVal = e.target.value;
    setDueDate(localVal);
    const iso = localVal ? fromDateTimeLocal(localVal) : null;
    patchTask({ dueDate: iso });
  };

  // Labels
  const handleAddLabel = () => {
    const raw = labelInput.trim().toLowerCase();
    if (!raw) return;
    if (labels.includes(raw)) {
      setLabelInput('');
      return;
    }
    if (labels.length >= 8) {
      setSaveError('A task can have at most 8 labels');
      setSaveState('error');
      return;
    }
    if (!/^[a-z0-9 _-]+$/.test(raw)) {
      setSaveError(
        'Label can only contain letters, numbers, spaces, hyphens, underscores'
      );
      setSaveState('error');
      return;
    }
    const next = [...labels, raw];
    setLabels(next);
    setLabelInput('');
    patchTask({ labels: next });
  };

  const handleRemoveLabel = (label) => {
    const next = labels.filter((l) => l !== label);
    setLabels(next);
    patchTask({ labels: next });
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddLabel();
    } else if (e.key === 'Backspace' && !labelInput && labels.length > 0) {
      handleRemoveLabel(labels[labels.length - 1]);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    setSaveError('');

    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to delete task');
        setIsDeleting(false);
        return;
      }

      onDeleted?.(task.id);
      router.refresh();
      onClose();
    } catch (err) {
      console.error('[TASK_DELETE]', err);
      setSaveError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !task) return null;

  const statusInfo = statusMeta(status);
  const currentStatusMeta = TASK_STATUSES.find((s) => s.value === status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !isDeleting && onClose()}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {statusInfo.label}
            </span>
            <SaveIndicator state={saveState} />
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                title="Delete task"
              >
                <svg
                  width="16"
                  height="16"
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
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-300">
                {saveError}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              disabled={!canEdit}
              maxLength={150}
              placeholder="Task title"
              className="w-full px-0 py-1 bg-transparent text-xl font-semibold text-gray-900 dark:text-white placeholder-gray-400 border-0 border-b-2 border-transparent focus:border-indigo-500 focus:outline-none focus:ring-0 transition-colors disabled:opacity-70"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              disabled={!canEdit}
              rows={4}
              maxLength={2000}
              placeholder="Add a description..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm disabled:opacity-70"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                disabled={!canEdit || !canMoveStatus}
                title={
                  !canMoveStatus
                    ? 'You cannot change the status of this task'
                    : undefined
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {/* Current status always shown */}
                <option value={status}>{currentStatusMeta?.label || status}</option>
                {/* Other statuses the user can move to */}
                {availableStatuses
                  .filter((s) => s.value !== status)
                  .map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
              </select>
              {/* Hint for non-privileged users moving to REVIEW */}
              {!isPrivileged && status !== 'DONE' && canMoveToStatus('REVIEW') && status !== 'REVIEW' && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Move to Review to request approval before Done.
                </p>
              )}
              {!isPrivileged && status === 'REVIEW' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Awaiting manager approval.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => handleSelectChange('priority', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
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
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => handleSelectChange('assigneeId', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                <option value="">Unassigned</option>
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
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                Due date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={handleDueDateChange}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Labels
            </label>

            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {label}
                    {canEdit && (
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
                    )}
                  </span>
                ))}
              </div>
            )}

            {canEdit && (
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                onBlur={handleAddLabel}
                placeholder="Type and press Enter to add"
                maxLength={24}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            )}

            {!canEdit && labels.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No labels
              </p>
            )}
          </div>

          {/* Meta footer */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              Created by{' '}
              <strong className="text-gray-700 dark:text-gray-300">
                {task.createdBy?.name || task.createdBy?.email}
              </strong>{' '}
              · {new Date(task.createdAt).toLocaleDateString()}
            </p>
            {task.updatedAt !== task.createdAt && (
              <p>Last updated {new Date(task.updatedAt).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <DeleteConfirmOverlay
            taskTitle={task.title}
            loading={isDeleting}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

// =============================================================
// SaveIndicator
// =============================================================
const SaveIndicator = ({ state }) => {
  if (state === 'idle') return null;

  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-2">
      {state === 'saving' && (
        <>
          <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
          Saving...
        </>
      )}
      {state === 'saved' && (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Saved
        </>
      )}
      {state === 'error' && <span className="text-red-500">Save failed</span>}
    </span>
  );
};

// =============================================================
// DeleteConfirmOverlay
// =============================================================
const DeleteConfirmOverlay = ({ taskTitle, loading, onCancel, onConfirm }) => (
  <div className="absolute inset-0 rounded-2xl bg-white/95 dark:bg-gray-900/95 flex items-center justify-center p-6">
    <div className="text-center max-w-sm">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-red-600 dark:text-red-400"
        >
          <path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        Delete this task?
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        &ldquo;{taskTitle}&rdquo; will be permanently removed. This cannot be
        undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium transition-colors"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

export default TaskDetailModal;