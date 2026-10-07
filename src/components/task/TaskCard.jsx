// -------------------------------------------------------------
// TaskCard - Draggable card in a Kanban column
// -------------------------------------------------------------
//
// PROPS:
//   task            : the task object
//   onOpen          : (taskId) => void — open the detail modal
//   onOpenFull      : (taskId) => void — navigate to task page
//   onAskQuestion   : (taskId) => void — navigate to task page #comments
//   isDragging      : boolean — true when THIS card is being dragged
//
// INTERACTIONS:
//   - Click card (no movement)     → onOpen (modal)
//   - Drag card                    → dnd-kit handles it
//   - Click ⋯ button (top-right)   → opens the card menu
//   - Menu: "Open full task"       → onOpenFull
//   - Menu: "Ask a question"       → onAskQuestion
//   - Click outside / Escape       → closes the menu
//
// DONE TREATMENT:
//   Faded, strikethrough title, gray priority dot, no due date.
//
// CLICK VS DRAG:
//   dnd-kit's activationConstraint handles this on the parent.
//   A click without movement fires onClick; a drag doesn't.
//   The ⋯ button calls stopPropagation so clicking it never
//   triggers the card's onClick.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';

import { priorityMeta, dueDateMeta } from '@/lib/task-constants';

const TaskCard = ({
  task,
  onOpen,
  onOpenFull,
  onAskQuestion,
  isDragging,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const priority = priorityMeta(task.priority);
  const due = dueDateMeta(task.dueDate);
  const isDone = task.status === 'DONE';

  // Close the menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const handleCardClick = () => {
    // Don't open the modal while the menu is open
    if (menuOpen) return;
    onOpen?.(task.id);
  };

  const handleMenuButtonClick = (e) => {
    // Critical: don't let the card's onClick fire
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  const handleOpenFull = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onOpenFull?.(task.id);
  };

  const handleAskQuestion = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onAskQuestion?.(task.id);
  };

  const style = {
    opacity: isDragging ? 0.4 : isDone ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleCardClick}
      className={`relative group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all ${
        isDragging ? 'cursor-grabbing' : ''
      } ${isDone ? 'hover:opacity-80' : ''}`}
    >
      {/* Title row + menu trigger */}
      <div className="flex items-start gap-2 mb-2">
        <p
          className={`flex-1 text-sm font-medium leading-snug line-clamp-2 ${
            isDone
              ? 'text-gray-400 dark:text-gray-500 line-through'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {task.title}
        </p>

        {/* ⋯ Menu trigger — appears on hover */}
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={handleMenuButtonClick}
            onPointerDown={(e) => e.stopPropagation()}
            className={`p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity ${
              menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="More actions"
            aria-label="More actions"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>

          {/* Menu */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-30 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleOpenFull}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Open full task
              </button>

              <button
                type="button"
                onClick={handleAskQuestion}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
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
                Ask a question
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Labels — dimmed/hidden when DONE */}
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
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isDone ? 'bg-gray-300 dark:bg-gray-600' : priority.dot
          }`}
          title={isDone ? 'Completed' : `Priority: ${priority.label}`}
        />

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
// Avatar
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