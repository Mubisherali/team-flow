// -------------------------------------------------------------
// TaskFields - Shared field editor for a task
// -------------------------------------------------------------
//
// USED BY:
//   - TaskDetailModal (compact layout)
//   - TaskPageClient  (spacious layout)
//
// RENDERS:
//   - Error banner (top)
//   - Title
//   - Description
//   - Status + Priority (2-col)
//   - Assignee (rich) + Due date (2-col)
//   - Labels
//   - Meta footer (created by / last updated)
//   - Comments (CommentList)
//
// PROPS:
//   task            : the task object
//   projectId       : string
//   projectMembers  : array
//   canEdit         : boolean
//   currentUserId   : string
//   currentUserRole : 'OWNER' | 'MANAGER' | 'MEMBER'
//   onUpdated       : (task) => void  (called on every successful PATCH)
//   saveState       : 'idle' | 'saving' | 'saved' | 'error'
//   saveError       : string
//   setSaveState    : (state) => void
//   setSaveError    : (msg) => void
//   titleRef        : ref for autofocus on mount (optional)
//
// WHY STATE IS PASSED IN:
//   The modal shows a "Saving..." indicator in its header. The
//   page shows it inline. Both need access to saveState/saveError,
//   so this component receives them as props rather than
//   owning them. Parents control the save UX; this component
//   just does the actual work.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { updateTaskSchema } from '@/lib/validators/task';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  statusMeta,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '@/lib/task-constants';
import CommentList from './CommentList';

const TaskFields = ({
  task,
  projectId,
  projectMembers,
  canEdit,
  currentUserId,
  currentUserRole,
  onUpdated,
  saveState,
  saveError,
  setSaveState,
  setSaveError,
  titleRef,
}) => {
  // ─── Local editable state ───
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState([]);

  const [labelInput, setLabelInput] = useState('');

  const router = useRouter();
  const internalTitleRef = useRef(null);

  // Prefer the passed-in ref (modal autofocuses on open) but
  // fall back to our own.
  const effectiveTitleRef = titleRef || internalTitleRef;

  const isPrivileged =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  // ─── Sync from task whenever the id changes ───
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
  }, [task?.id]);

  // -----------------------------------------------------------
  // WORKFLOW
  // -----------------------------------------------------------
  const canMoveToStatus = (targetStatus) => {
    if (!task) return false;
    if (targetStatus === task.status) return true;
    if (!canEdit) return false;
    if (isPrivileged) return true;

    const isMyTask =
      task.assigneeId === currentUserId ||
      task.createdById === currentUserId;
    if (!isMyTask) return false;
    if (targetStatus === 'DONE') return false;
    return true;
  };

  const availableStatuses = TASK_STATUSES.filter((s) =>
    canMoveToStatus(s.value)
  );
  const canMoveStatus = availableStatuses.length > 1;

  const assignableMembers = useMemo(() => {
    if (isPrivileged) return projectMembers;
    return projectMembers.filter((m) => m.userId === currentUserId);
  }, [isPrivileged, projectMembers, currentUserId]);

  const currentStatusMeta = TASK_STATUSES.find((s) => s.value === status);

  // -----------------------------------------------------------
  // PATCH
  // -----------------------------------------------------------
  const patchTask = async (partial) => {
    if (!task) return;

    setSaveState?.('saving');
    setSaveError?.('');

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
        setSaveState?.('error');
        setSaveError?.(data.error || 'Failed to save');
        return;
      }

      setSaveState?.('saved');
      onUpdated?.(data.task);
      router.refresh();
    } catch (err) {
      console.error('[TASK_PATCH]', err);
      setSaveState?.('error');
      setSaveError?.('Network error. Please try again.');
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
      setSaveError?.(parsed.error.issues[0].message);
      setSaveState?.('error');
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

  const handleAddLabel = () => {
    const raw = labelInput.trim().toLowerCase();
    if (!raw) return;
    if (labels.includes(raw)) {
      setLabelInput('');
      return;
    }
    if (labels.length >= 8) {
      setSaveError?.('A task can have at most 8 labels');
      setSaveState?.('error');
      return;
    }
    if (!/^[a-z0-9 _-]+$/.test(raw)) {
      setSaveError?.(
        'Label can only contain letters, numbers, spaces, hyphens, underscores'
      );
      setSaveState?.('error');
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

  if (!task) return null;

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Error banner */}
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
          ref={effectiveTitleRef}
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
            <option value={status}>
              {currentStatusMeta?.label || status}
            </option>
            {availableStatuses
              .filter((s) => s.value !== status)
              .map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
          </select>
          {!isPrivileged &&
            status !== 'DONE' &&
            canMoveToStatus('REVIEW') &&
            status !== 'REVIEW' && (
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
          <AssigneeSelect
            value={assigneeId}
            members={assignableMembers}
            currentUserId={currentUserId}
            disabled={!canEdit}
            onChange={(value) => handleSelectChange('assigneeId', value)}
          />
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

      {/* Comments */}
      <div
        id="comments"
        className="pt-4 border-t border-gray-200 dark:border-gray-800 scroll-mt-4"
      >
        <CommentList
          projectId={projectId}
          taskId={task.id}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
};

// =============================================================
// AssigneeSelect - rich dropdown with avatars + names + emails
// =============================================================
const AssigneeSelect = ({ value, members, currentUserId, disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = members.find((m) => m.userId === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (userId) => {
    onChange(userId);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-left text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
      >
        {selected ? (
          <>
            <UserAvatar
              name={selected.name}
              email={selected.email}
              image={selected.avatarUrl}
              size="sm"
            />
            <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-white">
              {selected.name || selected.email}
            </span>
            {selected.userId === currentUserId && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">
                YOU
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0" />
            <span className="flex-1 min-w-0 truncate text-gray-500 dark:text-gray-400">
              Unassigned
            </span>
          </>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-400 flex-shrink-0"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
              !value
                ? 'bg-indigo-50 dark:bg-indigo-950'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">
              Unassigned
            </span>
          </button>

          {members.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-800" />
          )}

          {members.map((m) => {
            const isSelected = m.userId === value;
            const isMe = m.userId === currentUserId;
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => handleSelect(m.userId)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <UserAvatar
                  name={m.name}
                  email={m.email}
                  image={m.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {m.name || m.email}
                  </p>
                  {m.name && m.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {m.email}
                    </p>
                  )}
                </div>
                {isMe && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">
                    YOU
                  </span>
                )}
                {isSelected && !isMe && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
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
      )}
    </div>
  );
};

// =============================================================
// UserAvatar
// =============================================================
const UserAvatar = ({ name, email, image, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || 'User'}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold flex-shrink-0 ${textSize}`}
    >
      {initials}
    </div>
  );
};

export default TaskFields;