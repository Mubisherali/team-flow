// -------------------------------------------------------------
// TaskEditMode - Batch-save edit form for the task page
// -------------------------------------------------------------
//
// PROPS:
//   task, editor, projectMembers, currentUserId, canEdit
//
// DIFFERENCE FROM TaskFields (modal):
//   TaskFields auto-saves each field on blur/change.
//   TaskEditMode does NOT save — it renders inputs and updates
//   the editor's local state. The parent's Save button commits.
//
// LAYOUT:
//   Same two-column layout as TaskViewMode:
//     Left: title + description (as inputs)
//     Right: metadata panel with inputs
//
// POLISH:
//   - Refined inputs (rounded-xl + hover + smooth focus)
//   - Framed metadata panel (matches TaskViewMode)
//   - Top-level React imports (no more require('react'))
//   - Consistent typography
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import { TASK_PRIORITIES } from '@/lib/task-constants';

// -------------------------------------------------------------
// INPUT STYLES
// -------------------------------------------------------------
const inputBase = `
  w-full px-3.5 py-2.5 rounded-xl text-sm
  border bg-white dark:bg-white/[0.03]
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-gray-500
  focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500
  transition-all duration-200
  disabled:opacity-60 disabled:cursor-not-allowed
`;
const inputNormal =
  'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]';

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

  // Assignable members
  const assignableMembers = useMemo(() => {
    if (!projectMembers) return [];
    if (isPrivileged) return projectMembers;
    return projectMembers.filter((m) => m.userId === currentUserId);
  }, [isPrivileged, projectMembers, currentUserId]);

  // ─── Label handlers (local only — no API) ───
  const onAddLabel = () => handleAddLabel();
  const onRemoveLabel = (label) => handleRemoveLabel(label);

  const onLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onAddLabel();
    } else if (e.key === 'Backspace' && !labelInput && labels.length > 0) {
      onRemoveLabel(labels[labels.length - 1]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 md:gap-12">
      {/* ══════════ MAIN COLUMN ══════════ */}
      <div className="min-w-0">
        {/* Title — clean underline input, larger text */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
          maxLength={150}
          placeholder="Task title"
          autoFocus
          className="
            w-full bg-transparent
            text-[26px] sm:text-3xl font-bold tracking-tight
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-600
            leading-[1.15]
            border-0 border-b-2 border-gray-200 dark:border-white/[0.08]
            focus:border-indigo-500 focus:outline-none focus:ring-0
            transition-colors duration-200
            pb-3 mb-6
            disabled:opacity-70
          "
        />

        {/* Description */}
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-2.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={8}
            maxLength={2000}
            placeholder="Add a description…"
            className={`${inputBase} ${inputNormal} resize-y leading-relaxed`}
          />
        </div>
      </div>

      {/* ══════════ RIGHT RAIL (metadata panel) ══════════ */}
      <aside
        className="
          space-y-5
          rounded-2xl
          border border-gray-200/70 dark:border-white/[0.04]
          bg-gray-50/50 dark:bg-white/[0.015]
          p-5
          h-fit
        "
      >
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
            className={`${inputBase} ${inputNormal}`}
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
              <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1.5 leading-relaxed">
                Move to Review to request approval before Done.
              </p>
            )}
          {!isPrivileged && status === 'REVIEW' && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 leading-relaxed">
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
            className={`${inputBase} ${inputNormal}`}
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
            className={`${inputBase} ${inputNormal}`}
          />
        </EditField>

        {/* Labels */}
        <EditField label="Labels">
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map((label) => (
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
                    onClick={() => onRemoveLabel(label)}
                    className="
                      text-gray-400 hover:text-gray-700 dark:hover:text-white
                      transition-colors
                      focus:outline-none focus:text-gray-700
                    "
                    aria-label={`Remove label ${label}`}
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
            className={`${inputBase} ${inputNormal}`}
          />
        </EditField>

        {/* Divider (gradient) */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.08] to-transparent my-1" />

        {/* Created by (read-only) */}
        <EditField label="Created by">
          <p className="text-[13px] text-gray-900 dark:text-white">
            {task.createdBy?.name || task.createdBy?.email || 'Unknown'}
          </p>
        </EditField>
      </aside>
    </div>
  );
};

// =============================================================
// EditField
// =============================================================
const EditField = ({ label, children }) => (
  <div>
    <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
      {label}
    </p>
    {children}
  </div>
);

// =============================================================
// AssigneeSelect - rich dropdown with avatars
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
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`
          ${inputBase} ${inputNormal}
          flex items-center gap-2 text-left
        `}
      >
        {selected ? (
          <>
            <UserAvatar
              name={selected.name}
              email={selected.email}
              image={selected.avatarUrl}
            />
            <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-white">
              {selected.name || selected.email}
            </span>
            {selected.userId === currentUserId && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 flex-shrink-0">
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

      {/* Menu */}
      {open && (
        <div
          className="
            absolute top-full left-0 right-0 mt-1 z-30
            max-h-64 overflow-y-auto
            rounded-xl
            bg-white dark:bg-[#111318]
            border border-gray-200 dark:border-white/[0.08]
            shadow-xl shadow-black/10 dark:shadow-black/40
            py-1
          "
        >
          {/* Unassigned */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px]
              transition-colors
              ${
                !value
                  ? 'bg-indigo-50 dark:bg-indigo-500/10'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
              }
            `}
          >
            <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">
              Unassigned
            </span>
          </button>

          {members.length > 0 && (
            <div className="border-t border-gray-100 dark:border-white/[0.06] my-1" />
          )}

          {/* Members */}
          {members.map((m) => {
            const isSelected = m.userId === value;
            const isMe = m.userId === currentUserId;
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => handleSelect(m.userId)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 text-left
                  transition-colors
                  ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-500/10'
                      : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }
                `}
              >
                <UserAvatar
                  name={m.name}
                  email={m.email}
                  image={m.avatarUrl}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                    {m.name || m.email}
                  </p>
                  {m.name && m.email && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">
                      {m.email}
                    </p>
                  )}
                </div>
                {isMe && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 flex-shrink-0">
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
const UserAvatar = ({ name, email, image }) => {
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
        title={name || email}
        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold flex-shrink-0 text-[9px]"
      title={name || email}
    >
      {initials}
    </div>
  );
};

export default TaskEditMode;