// -------------------------------------------------------------
// TaskFields - Auto-save field editor (used by the modal)
// -------------------------------------------------------------
//
// USED BY:
//   TaskDetailModal (compact modal on the Kanban board)
//
// BEHAVIOR:
//   Every field saves on blur or change. No Save button — the
//   modal is for quick edits, so persistence is immediate.
//
// LOGIC:
//   All state and handlers come from useTaskEditor.
//   This file only handles layout.
//
// POLISH:
//   - Shared input styling (matches auth + create/edit)
//   - Labels: rounded-md chips with borders
//   - Gradient dividers
//   - Animated error banner
//   - Glass dark mode
// -------------------------------------------------------------

'use client';

import { useState,useEffect, useRef, useMemo } from 'react';

import { useTaskEditor } from '@/hooks/useTaskEditor';
import { TASK_PRIORITIES } from '@/lib/task-constants';
import CommentList from './CommentList';

// ─── Shared input styles ───
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

  // ─── Mirror the hook's save state to the modal's header ───
  useEffect(() => {
    setSaveState?.(editor.saveState);
  }, [editor.saveState, setSaveState]);

  useEffect(() => {
    setSaveError?.(editor.saveError);
  }, [editor.saveError, setSaveError]);

  // ─── Assignable members ───
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

  // ─── Auto-save label handlers ───
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
      {/* ══════════ ERROR BANNER ══════════ */}
      {saveError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p className="text-[13px] text-red-700 dark:text-red-300 flex-1">
            {saveError}
          </p>
          <button
            type="button"
            onClick={() => setSaveError?.('')}
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
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ══════════ TITLE ══════════ */}
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
          className="
            w-full px-0 py-1 bg-transparent
            text-[20px] font-semibold tracking-tight
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-600
            border-0 border-b-2 border-transparent
            focus:border-indigo-500
            focus:outline-none focus:ring-0
            transition-colors duration-200
            disabled:opacity-70
          "
        />
      </div>

      {/* ══════════ DESCRIPTION ══════════ */}
      <div>
        <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          disabled={!canEdit}
          rows={4}
          maxLength={2000}
          placeholder="Add a description…"
          className={`${inputBase} ${inputNormal} resize-none`}
        />
      </div>

      {/* ══════════ STATUS + PRIORITY ══════════ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
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
            canMoveToStatus('REVIEW') &&
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
        </div>

        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
            Priority
          </label>
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
        </div>
      </div>

      {/* ══════════ ASSIGNEE + DUE DATE ══════════ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
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
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
            Due date
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={handleDueDateChange}
            disabled={!canEdit}
            className={`${inputBase} ${inputNormal}`}
          />
        </div>
      </div>

      {/* ══════════ LABELS ══════════ */}
      <div>
        <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 mb-1.5">
          Labels
        </label>

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
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLabelAndSave(label)}
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
            className={`${inputBase} ${inputNormal}`}
          />
        )}

        {!canEdit && labels.length === 0 && (
          <p className="text-[13px] text-gray-400 dark:text-gray-600 italic">
            No labels
          </p>
        )}
      </div>

      {/* ══════════ META FOOTER ══════════ */}
      <div className="pt-4 mt-2 space-y-1">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.08] to-transparent mb-4" />
        <p className="text-[11.5px] text-gray-500 dark:text-gray-500">
          Created by{' '}
          <strong className="text-gray-700 dark:text-gray-300 font-medium">
            {task.createdBy?.name || task.createdBy?.email}
          </strong>{' '}
          · {new Date(task.createdAt).toLocaleDateString()}
        </p>
        {task.updatedAt !== task.createdAt && (
          <p className="text-[11.5px] text-gray-500 dark:text-gray-500">
            Last updated {new Date(task.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* ══════════ COMMENTS ══════════ */}
      <div id="comments" className="scroll-mt-4">
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
const AssigneeSelect = ({
  value,
  members,
  currentUserId,
  disabled,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
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

  // Close on Escape
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
        className={`${inputBase} ${inputNormal} flex items-center gap-2 text-left`}
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
            absolute top-full left-0 right-0 mt-1 z-50
            max-h-64 overflow-y-auto
            rounded-xl
            bg-white dark:bg-[#111318]
            border border-gray-200 dark:border-white/[0.08]
            shadow-xl shadow-black/10 dark:shadow-black/40
            py-1
          "
        >
          {/* Unassigned option */}
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

export default TaskFields;