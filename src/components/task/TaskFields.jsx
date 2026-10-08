// -------------------------------------------------------------
// TaskFields - Auto-save field editor (used by the modal)
// -------------------------------------------------------------
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import { useTaskEditor } from '@/hooks/useTaskEditor';
import { TASK_PRIORITIES } from '@/lib/task-constants';
import CommentList from './CommentList';

const TaskFields = ({
  task,
  projectId,
  projectMembers,
  canEdit,
  currentUserId,
  currentUserRole,
  onUpdated,
  saveError,
  setSaveState,
  setSaveError,
  titleRef,
}) => {
  const internalTitleRef = useRef(null);
  const effectiveTitleRef = titleRef || internalTitleRef;

  const editor = useTaskEditor({
    task,
    projectId,
    projectMembers,
    canEdit,
    currentUserId,
    currentUserRole,
    onUpdated,
  });

  // Mirror the hook's save state to the modal's header.
  // Using useEffect (not useMemo) because this is a side effect.
  useEffect(() => {
    setSaveState?.(editor.saveState);
  }, [editor.saveState, setSaveState]);

  useEffect(() => {
    setSaveError?.(editor.saveError);
  }, [editor.saveError, setSaveError]);

  const assignableMembers = useMemo(() => {
    if (!projectMembers) return [];
    if (editor.isPrivileged) return projectMembers;
    return projectMembers.filter((m) => m.userId === currentUserId);
  }, [editor.isPrivileged, projectMembers, currentUserId]);

  if (!task) return null;

  const {
    title,
    setTitle,
    description,
    setDescription,
    status,
    priority,
    assigneeId,
    dueDate,
    labels,
    labelInput,
    setLabelInput,
    handleTitleBlur,
    handleDescriptionBlur,
    handleSelectChange,
    handleDueDateChange,
    handleAddLabel,
    handleRemoveLabel,
    canMoveToStatus,
    availableStatuses,
    canMoveStatus,
    currentStatusMeta,
    isPrivileged,
  } = editor;

  // Auto-save variants of label handlers
  const handleAddLabelAndSave = () => {
    const next = handleAddLabel();
    if (next && next.length !== labels.length) {
      handleSelectChange('labels', next);
    }
  };

  const handleRemoveLabelAndSave = (label) => {
    const next = handleRemoveLabel(label);
    if (next) {
      handleSelectChange('labels', next);
    }
  };

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
                    onClick={() => handleRemoveLabelAndSave(label)}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                handleAddLabelAndSave();
              } else if (
                e.key === 'Backspace' &&
                !labelInput &&
                labels.length > 0
              ) {
                handleRemoveLabelAndSave(labels[labels.length - 1]);
              }
            }}
            onBlur={handleAddLabelAndSave}
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
// AssigneeSelect
// =============================================================
const AssigneeSelect = ({ value, members, currentUserId, disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

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

  const selected = members.find((m) => m.userId === value);

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