
// -------------------------------------------------------------
// TaskRow - A single task item in the My Tasks list
// -------------------------------------------------------------

import Link from "next/link";
import { priorityMeta } from "@/lib/task-constants";

const TaskRow = ({ task, href }) => {
  const priority = priorityMeta(task.priority);
  const isDone = task.status === "DONE";

  const project = task.project || {};
  const workspace = project.workspace || {};

  const projectName = project.name || "Untitled project";
  const workspaceName = workspace.name || "Workspace";

  const projectColor = project.color || "#6366f1";
  const initials = projectName.trim().slice(0, 2).toUpperCase() || "PR";

  const getDueDateLabel = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        label: "Today",
        classes:
          "border-amber-500/15 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300",
      };
    }

    if (diffDays === 1) {
      return {
        label: "Tomorrow",
        classes:
          "border-gray-200 bg-gray-50 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/55",
      };
    }

    if (diffDays < 0) {
      return {
        label: "Overdue",
        classes:
          "border-red-500/15 bg-red-500/[0.07] text-red-600 dark:text-red-400",
      };
    }

    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      classes:
        "border-gray-200 bg-gray-50 text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-white/40",
    };
  };

  const due = getDueDateLabel(task.dueDate);

  return (
    <Link
      href={href}
      aria-label={`Open task: ${task.title}`}
      className={`
        group relative flex items-center gap-3 overflow-hidden
        rounded-xl border p-3.5 sm:gap-4 sm:p-4
        transition-all duration-200
        hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-950/[0.035]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        dark:hover:border-indigo-400/30 dark:hover:bg-white/[0.035]
        dark:hover:shadow-black/10 dark:focus-visible:ring-offset-[#0a0a0a]
        ${
          isDone
            ? "border-gray-200/70 bg-gray-50/70 opacity-70 hover:opacity-100 dark:border-white/[0.05] dark:bg-white/[0.015]"
            : "border-gray-200/80 bg-white dark:border-white/[0.07] dark:bg-[#101010]"
        }
      `}
    >
      {/* Project avatar */}
      <div
        className="
          relative flex h-10 w-10 shrink-0 items-center justify-center
          overflow-hidden rounded-xl
          text-[11px] font-bold tracking-wide text-white
          shadow-sm ring-1 ring-inset ring-white/15
          sm:h-11 sm:w-11
        "
        style={{ backgroundColor: projectColor }}
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
        <span className="relative">{initials}</span>
      </div>

      {/* Task title and breadcrumbs */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {isDone && (
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              aria-label="Completed"
            >
              <CheckIcon />
            </span>
          )}

          <p
            className={`
              truncate text-[12px] font-semibold transition-colors sm:text-[13px]
              ${
                isDone
                  ? "text-gray-500 line-through dark:text-white/40"
                  : "text-gray-900 group-hover:text-indigo-600 dark:text-[#f5f5f0] dark:group-hover:text-indigo-300"
              }
            `}
          >
            {task.title}
          </p>
        </div>

        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] text-gray-400 dark:text-white/35 sm:text-[11px]">
          <span className="max-w-[100px] truncate">{workspaceName}</span>

          <span aria-hidden="true" className="text-gray-300 dark:text-white/20">
            /
          </span>

          <span className="max-w-[130px] truncate font-medium text-gray-600 dark:text-white/55 sm:max-w-[180px]">
            {projectName}
          </span>
        </div>
      </div>

      {/* Priority */}
      {!isDone && (
        <span
          className={`
            hidden shrink-0 items-center gap-1.5 rounded-md border
            border-transparent px-2 py-1.5
            text-[10px] font-medium sm:inline-flex
            ${priority.badge}
          `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${priority.dot}`}
          />
          {priority.label}
        </span>
      )}

      {/* Due date / completion status */}
      <div className="flex shrink-0 items-center justify-end">
        {isDone ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 sm:text-[11px]">
            <CheckIcon />
            <span className="hidden sm:inline">Done</span>
          </span>
        ) : due ? (
          <span
            className={`
              inline-flex items-center justify-center rounded-md border
              px-2 py-1.5 text-[10px] font-medium sm:min-w-[76px] sm:text-[11px]
              ${due.classes}
            `}
          >
            {due.label}
          </span>
        ) : (
          <span className="hidden text-[10px] text-gray-400 dark:text-white/25 sm:inline">
            No date
          </span>
        )}
      </div>

      {/* Navigation indicator */}
      <span
        aria-hidden="true"
        className="
          hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg
          text-gray-300 transition-all duration-200
          group-hover:translate-x-0.5 group-hover:bg-indigo-500/[0.06]
          group-hover:text-indigo-500
          dark:text-white/20 dark:group-hover:text-indigo-300
          sm:flex
        "
      >
        <ArrowRightIcon />
      </span>
    </Link>
  );
};

// =============================================================
// Inline SVG icons
// =============================================================

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default TaskRow;
