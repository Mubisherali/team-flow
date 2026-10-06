// -------------------------------------------------------------
// TaskCard - Draggable card in a Kanban column
// -------------------------------------------------------------
//
// PROPS:
//   task       : the task object
//   onOpen     : (taskId) => void — open the detail modal
//   isDragging : boolean — true when THIS card is being dragged
//
// DONE TREATMENT:
//   When task.status === 'DONE', the card is visually muted:
//     - opacity reduced
//     - title struck through
//     - priority dot dimmed
//     - due date hidden (irrelevant once complete)
//     - label chips dimmed
//   Still clickable (managers may reopen).
//
// CLICK VS DRAG:
//   dnd-kit uses an activation constraint (set on the parent's
//   PointerSensor). A short press without movement → click.
//   Movement beyond threshold → drag.
// -------------------------------------------------------------

'use client';

import { useDraggable } from '@dnd-kit/core';

import { priorityMeta, dueDateMeta } from '@/lib/task-constants';

const TaskCard = ({ task, onOpen, isDragging }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const priority = priorityMeta(task.priority);
  const due = dueDateMeta(task.dueDate);
  const isDone = task.status === 'DONE';

  const style = {
    opacity: isDragging ? 0.4 : isDone ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen?.(task.id)}
      className={`group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all ${
        isDragging ? 'cursor-grabbing' : ''
      } ${isDone ? 'hover:opacity-80' : ''}`}
    >
      {/* Title — struck through when DONE */}
      <p
        className={`text-sm font-medium leading-snug line-clamp-2 mb-2 ${
          isDone
            ? 'text-gray-400 dark:text-gray-500 line-through'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {task.title}
      </p>

      {/* Labels — dimmed when DONE */}
      {task.labels && task.labels.length > 0 && !isDone && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs">
        {/* Priority dot — dimmed when DONE */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isDone ? 'bg-gray-300 dark:bg-gray-600' : priority.dot
          }`}
          title={isDone ? 'Completed' : `Priority: ${priority.label}`}
        />

        {/* Assignee */}
        {task.assignee ? (
          <Avatar
            name={task.assignee.name}
            email={task.assignee.email}
            image={task.assignee.avatarUrl}
            size="sm"
            muted={isDone}
          />
        ) : (
          <span
            className={`w-5 h-5 rounded-full border border-dashed flex-shrink-0 ${
              isDone
                ? 'border-gray-200 dark:border-gray-700'
                : 'border-gray-300 dark:border-gray-700'
            }`}
            title="Unassigned"
          />
        )}

        {/* Comment count — kept even when DONE (discussion history) */}
        {task.commentCount > 0 && (
          <span
            className={`flex items-center gap-1 ${
              isDone
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            title={`${task.commentCount} comment${
              task.commentCount === 1 ? '' : 's'
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {task.commentCount}
          </span>
        )}

        <span className="flex-1" />

        {/* Due date — hidden when DONE (no longer relevant) */}
        {due && !isDone && (
          <span
            className={`flex items-center gap-1 text-[11px] ${due.className}`}
            title={new Date(task.dueDate).toLocaleDateString()}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            {due.label}
          </span>
        )}

        {/* Completed checkmark for DONE cards */}
        {isDone && (
          <span className="text-[11px] text-green-600 dark:text-green-500 flex items-center gap-1 font-medium">
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
            Done
          </span>
        )}
      </div>
    </div>
  );
};

// =============================================================
// Avatar - small user avatar or initials
// =============================================================
const Avatar = ({ name, email, image, size = 'sm', muted = false }) => {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const mutedClass = muted ? 'opacity-60' : '';

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || 'Assignee'}
        className={`${dim} rounded-full object-cover flex-shrink-0 ${mutedClass}`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full text-white flex items-center justify-center font-semibold flex-shrink-0 ${textSize} ${
        muted ? 'bg-gray-400 dark:bg-gray-600' : 'bg-indigo-600'
      }`}
      title={name || email}
    >
      {initials}
    </div>
  );
};

export default TaskCard;