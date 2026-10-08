// -------------------------------------------------------------
// TaskEditMode - Batch-save edit form for the task page
// -------------------------------------------------------------
//
// PROPS:
//   editor        : the object returned by useTaskEditor (owned by TaskPageView)
//   projectMembers: array — for the assignee dropdown
//   currentUserId : string
//   canEdit       : boolean
//
// DIFFERENCE FROM TaskFields (modal):
//   TaskFields auto-saves each field on blur/change.
//   TaskEditMode does NOT save — it just renders inputs and
//   updates the editor's local state. The parent's Save button
//   commits everything at once.
//
//   Both use the SAME editor object, so validation and workflow
//   rules are identical.
//
// LAYOUT:
//   Same two-column layout as TaskViewMode.
//   Left: title + description (as inputs)
//   Right: status / priority / assignee / due date / labels
// -------------------------------------------------------------

'use client';

import { useMemo } from 'react';

import { TASK_PRIORITIES } from '@/lib/task-constants';

const TaskEditMode = ({
  task,
  editor,
  projectMembers,
  currentUserId,
  canEdit,
}) => {
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
    handleSelectChange,
    handleDueDateChange,
    handleAddLabel,
    handleRemoveLabel,
    availableStatuses,
    canMoveStatus,
    currentStatusMeta,
    isPrivileged,
  } = editor;

  // Assignees the current user can pick from
  const assignableMembers = useMemo(() => {
    if (!projectMembers) return [];
    if (isPrivileged) return projectMembers;
    return projectMembers.filter((m) => m.userId === currentUserId);
  }, [isPrivileged, projectMembers, currentUserId]);

  // Local-only label handlers — no API call
  const onAddLabel = () => {
    handleAddLabel();
  };

  const onRemoveLabel = (label) => {
    handleRemoveLabel(label);
  };

  const onLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onAddLabel();
    } else if (e.key === 'Backspace' && !labelInput && labels.length > 0) {
      onRemoveLabel(labels[labels.length - 1]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 md:gap-12">
      {/* ─── Main column ─── */}
      <div className="min-w-0 space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            maxLength={150}
            placeholder="Task title"
            autoFocus
            className="w-full px-0 py-1 bg-transparent text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white placeholder-gray-400 border-0 border-b-2 border-gray-200 dark:border-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-0 transition-colors disabled:opacity-70"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={8}
            maxLength={2000}
            placeholder="Add a description..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y text-sm leading-relaxed disabled:opacity-70"
          />
        </div>
      </div>

      {/* ─── Right rail ─── */}
      <aside className="space-y-5 md:pt-1">
        {/* Status */}
        <EditField label="Status">
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
            availableStatuses.some((s) => s.value === 'REVIEW') &&
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
        </EditField>

        {/* Priority */}
        <EditField label="Priority">
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
        </EditField>

        {/* Assignee */}
        <EditField label="Assignee">
          <AssigneeSelect
            value={assigneeId}
            members={assignableMembers}
            currentUserId={currentUserId}
            disabled={!canEdit}
            onChange={(value) => handleSelectChange('assigneeId', value)}
          />
        </EditField>

        {/* Due date */}
        <EditField label="Due date">
          <input
            type="datetime-local"
            value={dueDate}
            onChange={handleDueDateChange}
            disabled={!canEdit}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
          />
        </EditField>

        {/* Labels */}
        <EditField label="Labels">
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => onRemoveLabel(label)}
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
            onKeyDown={onLabelKeyDown}
            onBlur={onAddLabel}
            placeholder="Type and press Enter to add"
            maxLength={24}
            disabled={!canEdit}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-70"
          />
        </EditField>

        {/* Meta (read-only info, still visible in edit mode) */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800" />

        <EditField label="Created by">
          <p className="text-sm text-gray-900 dark:text-white">
            {task.createdBy?.name || task.createdBy?.email || 'Unknown'}
          </p>
        </EditField>
      </aside>
    </div>
  );
};

// =============================================================
// EditField - label + input pair
// =============================================================
const EditField = ({ label, children }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-1.5">
      {label}
    </p>
    {children}
  </div>
);

// =============================================================
// AssigneeSelect - rich dropdown with avatars
// =============================================================
const AssigneeSelect = ({ value, members, currentUserId, disabled, onChange }) => {
  const [open, setOpen] = require('react').useState(false);
  const wrapRef = require('react').useRef(null);

  require('react').useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  require('react').useEffect(() => {
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

export default TaskEditMode;