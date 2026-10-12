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
// POLISH:
//   - Left priority accent bar (replaces the tiny dot)
//   - Hover lift (2px) with smooth transitions
//   - Menu button: hidden on desktop-until-hover, always visible on mobile
//   - Menu fades in
//   - Focus-visible ring for keyboard users
//   - Better dark-mode colors (glass effect)
//
// PRESERVED:
//   - dnd-kit listeners/attributes on the outer div
//   - Menu button stops propagation (so drag doesn't start)
//   - Menu items stop propagation (so card onClick doesn't fire)
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

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

  // ─── Menu: close on outside click ───
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

  // ─── Menu: close on Escape ───
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const handleCardClick = () => {
    if (menuOpen) return;
    onOpen?.(task.id);
  };

  const handleMenuButtonClick = (e) => {
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

  // ─── Overall opacity (dragging beats done) ───
  const style = {
    opacity: isDragging ? 0.35 : isDone ? 0.7 : 1,
  };

  // ─── Left accent bar color (priority) ───
  const accentBarClass = isDone
    ? 'bg-emerald-500/60'
    : priority.dot; // e.g. 'bg-gray-400' | 'bg-blue-500' | 'bg-amber-500' | 'bg-red-500'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleCardClick}
      title={task.title}
            className={`
        group relative
        rounded-xl
        border border-gray-200 dark:border-white/[0.06]
        bg-white dark:bg-white/[0.02]
        cursor-pointer
        transition-all duration-200
        hover:border-indigo-300 dark:hover:border-indigo-500/30
        hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30
        hover:-translate-y-0.5
        focus-within:ring-2 focus-within:ring-indigo-500/60
        ${isDragging ? 'cursor-grabbing' : ''}
      `}
    >
      {/* Priority accent bar */}
          <span
        aria-hidden="true"
        className={`
          absolute left-0 top-0 bottom-0 w-1
          rounded-l-xl
          ${accentBarClass}
          ${isDone ? 'opacity-60' : ''}
        `}
      />

      {/* Body */}
      <div className="pl-3.5 pr-2.5 py-2.5">
        {/* Title row + menu trigger */}
        <div className="flex items-start gap-2 mb-2">
          <p
            className={`
              flex-1 text-[13.5px] font-medium leading-snug line-clamp-2
              ${
                isDone
                  ? 'text-gray-400 dark:text-gray-500 line-through'
                  : 'text-gray-900 dark:text-white'
              }
            `}
          >
            {task.title}
          </p>

          {/* ⋯ Menu trigger */}
          <div ref={menuRef} className="relative flex-shrink-0 -mr-1">
            <button
              type="button"
              onClick={handleMenuButtonClick}
              onPointerDown={(e) => e.stopPropagation()}
              className={`
                p-1 rounded-md
                text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                hover:bg-gray-100 dark:hover:bg-white/[0.06]
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-indigo-500/60
                ${
                  menuOpen
                    ? 'opacity-100 bg-gray-100 dark:bg-white/[0.06]'
                    : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                }
                md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100
                max-md:opacity-100
              `}
              title="More actions"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
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
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="
                    absolute right-0 top-0 mt-1.5 z-50
                    w-48
                    rounded-xl overflow-hidden
                    bg-white dark:bg-[#111318]
                    border border-gray-200 dark:border-white/[0.08]
                    shadow-xl shadow-black/10 dark:shadow-black/40
                    py-1
                    
                  "
                  onClick={(e) => e.stopPropagation()}
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={handleOpenFull}
                    className="
                      w-full flex items-center gap-2.5
                      px-3 py-2
                      text-left text-[13px]
                      text-gray-700 dark:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-white/[0.05]
                      transition-colors
                    "
                    role="menuitem"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="text-gray-400"
                    >
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2v6h6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Open full task
                  </button>

                  <button
                    type="button"
                    onClick={handleAskQuestion}
                    className="
                      w-full flex items-center gap-2.5
                      px-3 py-2
                      text-left text-[13px]
                      text-gray-700 dark:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-white/[0.05]
                      transition-colors
                    "
                    role="menuitem"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="text-gray-400"
                    >
                      <path
                        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Ask a question
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Labels — hidden when DONE */}
        {task.labels && task.labels.length > 0 && !isDone && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {task.labels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="
                  text-[10px] font-medium
                  px-1.5 py-0.5
                  rounded-md
                  bg-gray-100 dark:bg-white/[0.06]
                  text-gray-600 dark:text-gray-400
                "
              >
                {label}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span
                className="
                  text-[10px] font-medium
                  px-1.5 py-0.5
                  rounded-md
                  bg-gray-100 dark:bg-white/[0.06]
                  text-gray-500 dark:text-gray-500
                "
              >
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2.5 text-[11.5px]">
          {/* Assignee */}
          {task.assignee ? (
            <Avatar
              name={task.assignee.name}
              email={task.assignee.email}
              image={task.assignee.avatarUrl}
              muted={isDone}
            />
          ) : (
            <span
              className={`
                w-5 h-5 rounded-full border border-dashed flex-shrink-0
                ${
                  isDone
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-300 dark:border-gray-600'
                }
              `}
              title="Unassigned"
            />
          )}

          {/* Comment count */}
          {task.commentCount > 0 && (
            <span
              className={`
                flex items-center gap-1
                ${
                  isDone
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-500 dark:text-gray-400'
                }
              `}
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
                strokeWidth="1.8"
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

          {/* Due date */}
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
                strokeWidth="1.8"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  strokeLinecap="round"
                />
              </svg>
              {due.label}
            </span>
          )}

          {/* Done badge */}
          {isDone && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1 font-medium">
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
    </div>
  );
};

// =============================================================
// Avatar - small avatar or initials
// =============================================================
const Avatar = ({ name, email, image, muted = false }) => {
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
        alt={name || 'Assignee'}
        title={name || email}
        className={`
          w-5 h-5 rounded-full object-cover flex-shrink-0
          ${muted ? 'opacity-60' : ''}
        `}
      />
    );
  }

  return (
    <div
      className={`
        w-5 h-5 rounded-full text-white flex items-center justify-center
        text-[9px] font-semibold flex-shrink-0
        ${muted ? 'bg-gray-400 dark:bg-gray-600' : 'bg-indigo-600'}
      `}
      title={name || email}
    >
      {initials}
    </div>
  );
};

export default TaskCard;