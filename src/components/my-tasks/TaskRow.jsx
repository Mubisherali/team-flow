// -------------------------------------------------------------
// TaskRow - A single task item in the My Tasks list
// -------------------------------------------------------------

import Link from 'next/link';
import { priorityMeta } from '@/lib/task-constants';

const TaskRow = ({ task, href }) => {
  const priority = priorityMeta(task.priority);
  const isDone = task.status === 'DONE';
  
  // Get project initials and fallback color
  const projectColor = task.project.color || '#6366f1';
  const initials = task.project.name.trim().slice(0, 2).toUpperCase();

  // Simple relative date formatting
  const getDueDateLabel = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', color: 'text-amber-600 dark:text-amber-400' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'text-gray-600 dark:text-gray-400' };
    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 dark:text-red-400' };
    
    return {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: 'text-gray-500 dark:text-gray-500',
    };
  };

  const due = getDueDateLabel(task.dueDate);

  return (
    <Link
      href={href}
      className="
        group flex items-center gap-4 p-3.5 mb-2
        rounded-2xl
        border border-gray-200/60 dark:border-white/[0.04]
        bg-white dark:bg-[#0f1115]
        hover:border-indigo-400 dark:hover:border-indigo-500/50
        hover:shadow-sm
        transition-all duration-150
        opacity-100
        ${isDone ? 'opacity-60 hover:opacity-100' : ''}
      "
    >
      {/* Project Avatar */}
      <div
        className="
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 
          text-white font-bold text-[12px] shadow-sm ring-1 ring-inset ring-white/20
        "
        style={{ backgroundColor: projectColor }}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Title & Context */}
      <div className="flex-1 min-w-0">
        <p className={`
          text-[13.5px] font-medium truncate transition-colors
          ${isDone ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}
        `}>
          {task.title}
        </p>
        
        {/* Breadcrumb (Workspace / Project) */}
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="truncate max-w-[100px]">{task.project.workspace.name}</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="truncate max-w-[150px] font-medium text-gray-700 dark:text-gray-300">{task.project.name}</span>
        </div>
      </div>

      {/* Metadata (Priority & Due Date) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Priority Pill */}
        {!isDone && (
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10.5px] font-medium border border-transparent ${priority.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
        )}

        {/* Due Date / Done Label */}
        {isDone ? (
          <span className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Done
          </span>
        ) : due ? (
          <span className={`text-[11.5px] font-medium w-16 text-right ${due.color}`}>
            {due.label}
          </span>
        ) : (
          <span className="text-[11.5px] text-gray-300 dark:text-gray-600 w-16 text-right">
            No date
          </span>
        )}
      </div>

      {/* Chevron */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 -ml-2 transition-opacity"
      >
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
};

export default TaskRow;