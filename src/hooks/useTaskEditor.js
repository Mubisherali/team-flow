// -------------------------------------------------------------
// useTaskEditor - Shared task field-editing logic
// -------------------------------------------------------------
//
// USED BY:
//   - TaskFields.jsx      (modal — auto-save per field)
//   - TaskEditMode.jsx    (page edit — batch save)
//
// PROVIDES:
//   - Local mirrored state for every editable field
//   - Handlers for each field
//   - Workflow helpers (canMoveToStatus, assignableMembers, etc.)
//   - saveState / saveError for the caller's indicator
//   - saveAll() for batch save (page edit mode)
//   - isDirty computed from diffing local state vs. task
//
// WHY A HOOK:
//   Logic shared between two visual layouts. Extract once, use
//   twice. No duplication of validation, API calls, or workflow
//   rules.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { updateTaskSchema } from '@/lib/validators/task';
import {
  TASK_STATUSES,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '@/lib/task-constants';

export function useTaskEditor({
  task,
  projectId,
  canEdit,
  currentUserId,
  currentUserRole,
  onUpdated,
}) {
  // ─── Field state ───
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState(''); // datetime-local string
  const [labels, setLabels] = useState([]);
  const [labelInput, setLabelInput] = useState('');

  // ─── Save state ───
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState('');

  const router = useRouter();

  const isPrivileged =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  // ─── Sync local state when the task changes ───
  // Fires on task id change only, so we don't clobber in-progress
  // edits on every parent re-render.
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
    // Don't reset saveState/saveError here — callers may want
    // to show a "Saved" indicator after a task prop update.
  }, [task?.id]);

  // Clear the "Saved" indicator after a moment.
  useEffect(() => {
    if (saveState === 'saved') {
      const t = setTimeout(() => setSaveState('idle'), 1500);
      return () => clearTimeout(t);
    }
  }, [saveState]);

  // ─── Dirty detection ───
  const isDirty = useMemo(() => {
    if (!task) return false;
    const t = (s) => (s || '').trim();
    if (t(title) !== t(task.title)) return true;
    if (t(description) !== t(task.description)) return true;
    if (status !== task.status) return true;
    if (priority !== task.priority) return true;
    if ((assigneeId || '') !== (task.assigneeId || '')) return true;

    // Compare due dates as datetime-local strings
    const taskDueLocal = task.dueDate ? toDateTimeLocal(task.dueDate) : '';
    if (dueDate !== taskDueLocal) return true;

    // Compare labels
    const a = [...(labels || [])].sort().join(',');
    const b = [...(task.labels || [])].sort().join(',');
    if (a !== b) return true;

    return false;
  }, [
    task,
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    labels,
  ]);

  // -----------------------------------------------------------
  // WORKFLOW HELPERS
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
  const currentStatusMeta = TASK_STATUSES.find((s) => s.value === status);

  const assignableMembers = useMemo(() => {
    const members = arguments.length > 0 ? undefined : undefined; // no-op
    return null;
  }, []);

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
  // FIELD HANDLERS (auto-save — used by modal)
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

  // -----------------------------------------------------------
  // LABELS
  // -----------------------------------------------------------
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

    // In edit-mode (page), labels are saved with the batch.
    // In auto-save (modal), we save immediately.
    // The caller decides — we expose addLabelLocally too.
    return next;
  };

  const handleRemoveLabel = (label) => {
    const next = labels.filter((l) => l !== label);
    setLabels(next);
    return next;
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddLabel();
    } else if (e.key === 'Backspace' && !labelInput && labels.length > 0) {
      handleRemoveLabel(labels[labels.length - 1]);
    }
  };

  // -----------------------------------------------------------
  // BATCH SAVE (used by page edit mode)
  // -----------------------------------------------------------
  const saveAll = async () => {
    if (!task) return { ok: false };

    // Build the payload from current local state
    const payload = {};

    const trimmedTitle = title.trim();
    if (trimmedTitle !== (task.title || '').trim()) {
      payload.title = trimmedTitle;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc !== (task.description || '').trim()) {
      payload.description = trimmedDesc || null;
    }

    if (status !== task.status) payload.status = status;
    if (priority !== task.priority) payload.priority = priority;

    const nextAssignee = assigneeId || null;
    const currentAssignee = task.assigneeId || null;
    if (nextAssignee !== currentAssignee) {
      payload.assigneeId = nextAssignee || '';
    }

    const taskDueLocal = task.dueDate ? toDateTimeLocal(task.dueDate) : '';
    if (dueDate !== taskDueLocal) {
      payload.dueDate = dueDate ? fromDateTimeLocal(dueDate) : null;
    }

    const a = [...(labels || [])].sort().join(',');
    const b = [...(task.labels || [])].sort().join(',');
    if (a !== b) payload.labels = labels;

    if (Object.keys(payload).length === 0) {
      // Nothing to save
      return { ok: true, noChanges: true };
    }

    const parsed = updateTaskSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      setSaveError(msg);
      setSaveState('error');
      return { ok: false, error: msg };
    }

    setSaveState('saving');
    setSaveError('');

    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setSaveState('error');
        setSaveError(data.error || 'Failed to save');
        return { ok: false, error: data.error };
      }

      setSaveState('saved');
      onUpdated?.(data.task);
      router.refresh();
      return { ok: true };
    } catch (err) {
      console.error('[TASK_SAVE_ALL]', err);
      setSaveState('error');
      setSaveError('Network error. Please try again.');
      return { ok: false, error: 'Network error' };
    }
  };

  // -----------------------------------------------------------
  // RESET (used by page edit mode — discard changes)
  // -----------------------------------------------------------
  const resetChanges = () => {
    if (!task) return;
    setTitle(task.title || '');
    setDescription(task.description || '');
    setStatus(task.status || 'TODO');
    setPriority(task.priority || 'MEDIUM');
    setAssigneeId(task.assigneeId || '');
    setDueDate(task.dueDate ? toDateTimeLocal(task.dueDate) : '');
    setLabels(task.labels || []);
    setLabelInput('');
    setSaveError('');
    setSaveState('idle');
  };

  // -----------------------------------------------------------
  // RETURN
  // -----------------------------------------------------------
  return {
    // Field values + setters
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    priority,
    setPriority,
    assigneeId,
    setAssigneeId,
    dueDate,
    setDueDate,
    labels,
    setLabels,
    labelInput,
    setLabelInput,

    // Field handlers (auto-save)
    handleTitleBlur,
    handleDescriptionBlur,
    handleSelectChange,
    handleDueDateChange,
    handleAddLabel,
    handleRemoveLabel,
    handleLabelKeyDown,

    // Workflow helpers
    canMoveToStatus,
    availableStatuses,
    canMoveStatus,
    currentStatusMeta,
    isPrivileged,

    // Save state
    saveState,
    saveError,
    setSaveState,
    setSaveError,
    isDirty,

    // Batch save + reset
    saveAll,
    resetChanges,
  };
}