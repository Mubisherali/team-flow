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
//   - Status + Priority use <Select> (custom glass dropdown)
//   - Assignee uses <AssigneeSelect> (avatars + emails)
//   - Labels are chip input with Enter/Backspace
//   - Gradient divider + meta footer
//   - Glass dark mode + light/dark parity
//
// PRESERVED:
//   - All state and handlers from useTaskEditor
//   - Auto-save on blur
//   - Comments section at the bottom
//   - Error banner behavior
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import { useTaskEditor } from '@/hooks/useTaskEditor';
import { TASK_PRIORITIES } from '@/lib/task-constants';
import Select from '@/components/ui/Select';
import AssigneeSelect from '@/components/ui/AssigneeSelect';
import CommentList from './CommentList';

// ─── Shared input styles (kept for text/textarea consistency) ───
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

  // ─── Status options for <Select> ───
  // Show current status at the top (as current), then the
  // remaining allowed statuses from availableStatuses.
  const statusOptions = useMemo(() => {
    const current = {
      value: status,
      label: currentStatusMeta?.label || status,
      dot: currentStatusMeta?.dot,
    };
    const rest = availableStatuses
      .filter((s) => s.value !== status)
      .map((s) => ({
        value: s.value,
        label: s.label,
        dot: s.dot,
      }));
    return [current, ...rest];
  }, [status, currentStatusMeta, availableStatuses]);

  // ─── Priority options for <Select> ───
  const priorityOptions = useMemo(
    () =>
      TASK_PRIORITIES.map((p) => ({
        value: p.value,
        label: p.label,
        dot: p.dot,
      })),
    []
  );

  return (
    <div className="space-y-6">
      {/* ══════════ ERROR BANNER ══════════ */}
      {saveError && (
        <div
          className="
            flex items-start gap-2.5 p-3 rounded-xl
            bg-red-500/[0.07] dark:bg-red-500/10
            border border-red-500/20
          "
          role="alert"
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
              aria-hidden="true"
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

          <Select
            value={status}
            options={statusOptions}
            onChange={(v) => handleSelectChange('status', v)}
            disabled={!canEdit || !canMoveStatus}
            size="md"
          />

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

          <Select
            value={priority}
            options={priorityOptions}
            onChange={(v) => handleSelectChange('priority', v)}
            disabled={!canEdit}
            size="md"
          />
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
            onChange={(v) => handleSelectChange('assigneeId', v)}
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
                      aria-hidden="true"
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

export default TaskFields;