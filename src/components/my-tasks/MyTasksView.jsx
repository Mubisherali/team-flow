
// -------------------------------------------------------------
// MyTasksView - Grouped list of user's tasks across workspaces
// -------------------------------------------------------------
//
// FEATURES:
//   - Summary statistics
//   - All / Overdue / Today / High Priority filters
//   - Group by date or project
//   - Animated task sections
//   - Responsive, premium TeamFlow styling
// -------------------------------------------------------------

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskRow from "./TaskRow";

// -------------------------------------------------------------
// MAIN
// -------------------------------------------------------------

const MyTasksView = ({ tasks = [] }) => {
  const [filter, setFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("date");

  // -----------------------------------------------------------
  // SUMMARY STATS
  // -----------------------------------------------------------

  const stats = useMemo(() => {
    let overdue = 0;
    let dueThisWeek = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    tasks.forEach((task) => {
      if (task.status === "DONE" || !task.dueDate) return;

      const due = new Date(task.dueDate);

      if (Number.isNaN(due.getTime())) return;

      due.setHours(0, 0, 0, 0);

      if (due < now) {
        overdue++;
      } else if (due <= nextWeek) {
        dueThisWeek++;
      }
    });

    return {
      total: tasks.filter((task) => task.status !== "DONE").length,
      dueThisWeek,
      overdue,
    };
  }, [tasks]);

  // -----------------------------------------------------------
  // FILTER TASKS
  // -----------------------------------------------------------

  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (task.status === "DONE") return false;

      if (filter === "high") {
        return (
          task.priority === "HIGH" ||
          task.priority === "URGENT"
        );
      }

      if (!task.dueDate) return false;

      const due = new Date(task.dueDate);

      if (Number.isNaN(due.getTime())) return false;

      due.setHours(0, 0, 0, 0);

      if (filter === "overdue") return due < now;
      if (filter === "today") return due.getTime() === now.getTime();

      return false;
    });
  }, [tasks, filter]);

  // -----------------------------------------------------------
  // GROUP TASKS
  // -----------------------------------------------------------

  const grouped = useMemo(() => {
    if (groupBy === "project") {
      const map = new Map();

      filteredTasks.forEach((task) => {
        const projectId = task.project?.id || task.projectId;

        if (!map.has(projectId)) {
          map.set(projectId, {
            id: projectId,
            title: task.project?.name || "Untitled project",
            workspace: task.project?.workspace?.name || "Workspace",
            tasks: [],
          });
        }

        map.get(projectId).tasks.push(task);
      });

      return Array.from(map.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    const groups = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
      completed: [],
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    filteredTasks.forEach((task) => {
      if (task.status === "DONE") {
        groups.completed.push(task);
        return;
      }

      if (!task.dueDate) {
        groups.noDate.push(task);
        return;
      }

      const due = new Date(task.dueDate);

      if (Number.isNaN(due.getTime())) {
        groups.noDate.push(task);
        return;
      }

      due.setHours(0, 0, 0, 0);

      if (due < now) {
        groups.overdue.push(task);
      } else if (due.getTime() === now.getTime()) {
        groups.today.push(task);
      } else if (due <= nextWeek) {
        groups.upcoming.push(task);
      } else {
        // Keep the original grouping behavior for tasks
        // scheduled beyond the next seven days.
        groups.noDate.push(task);
      }
    });

    return groups;
  }, [filteredTasks, groupBy]);

  // -----------------------------------------------------------
  // EMPTY ACCOUNT STATE
  // -----------------------------------------------------------

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Summary */}
      <section aria-label="Task summary">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">
              Overview
            </p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900 dark:text-[#f5f5f0]">
              Your workload
            </h2>
          </div>

          <span className="font-mono text-[10px] text-gray-400 dark:text-white/25">
            TASK SUMMARY
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            label="Open tasks"
            value={stats.total}
            detail="Still to be completed"
            icon={<CheckSquareIcon />}
          />

          <StatCard
            label="Due this week"
            value={stats.dueThisWeek}
            detail="Within the next 7 days"
            icon={<CalendarIcon />}
          />

          <StatCard
            label="Overdue"
            value={stats.overdue}
            detail={stats.overdue > 0 ? "Needs your attention" : "You're all caught up"}
            danger={stats.overdue > 0}
            icon={<AlertIcon />}
          />
        </div>
      </section>

      {/* Filters and grouping controls */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-white/30">
              Task management
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900 dark:text-[#f5f5f0]">
              My tasks
            </h2>
          </div>

          <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.025]">
            <GroupButton
              active={groupBy === "date"}
              onClick={() => setGroupBy("date")}
              icon={<CalendarIcon />}
            >
              By date
            </GroupButton>

            <GroupButton
              active={groupBy === "project"}
              onClick={() => setGroupBy("project")}
              icon={<FolderIcon />}
            >
              By project
            </GroupButton>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
            <FilterPill
              label="All tasks"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />

            <FilterPill
              label="Overdue"
              active={filter === "overdue"}
              onClick={() => setFilter("overdue")}
              count={stats.overdue}
              danger
            />

            <FilterPill
              label="Today"
              active={filter === "today"}
              onClick={() => setFilter("today")}
            />

            <FilterPill
              label="High priority"
              active={filter === "high"}
              onClick={() => setFilter("high")}
            />
          </div>

          <span
            aria-live="polite"
            className="shrink-0 text-[11px] text-gray-400 dark:text-white/30"
          >
            {filteredTasks.length}{" "}
            {filteredTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </section>

      {/* Task list */}
      <div aria-label="Filtered tasks">
        {filteredTasks.length === 0 ? (
          <NoMatchingTasks filter={filter} onReset={() => setFilter("all")} />
        ) : groupBy === "date" ? (
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filter}-${groupBy}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
                className="space-y-8"
              >
                {grouped.overdue.length > 0 && (
                  <Section
                    title="Overdue"
                    subtitle="Past due date"
                    count={grouped.overdue.length}
                    color="danger"
                    tasks={grouped.overdue}
                  />
                )}

                {grouped.today.length > 0 && (
                  <Section
                    title="Today"
                    subtitle="Due today"
                    count={grouped.today.length}
                    color="warning"
                    tasks={grouped.today}
                  />
                )}

                {grouped.upcoming.length > 0 && (
                  <Section
                    title="Upcoming"
                    subtitle="Within seven days"
                    count={grouped.upcoming.length}
                    tasks={grouped.upcoming}
                  />
                )}

                {grouped.noDate.length > 0 && (
                  <Section
                    title="No due date"
                    count={grouped.noDate.length}
                    tasks={grouped.noDate}
                  />
                )}

                {grouped.completed.length > 0 && (
                  <Section
                    title="Completed"
                    count={grouped.completed.length}
                    muted
                    tasks={grouped.completed.slice(0, 10)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${groupBy}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
              className="space-y-8"
            >
              {grouped.map((group) => (
                <Section
                  key={group.id}
                  title={group.title}
                  subtitle={group.workspace}
                  count={group.tasks.length}
                  tasks={group.tasks}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// =============================================================
// StatCard
// =============================================================

const StatCard = ({ label, value, detail, icon, danger = false }) => (
  <div
    className={`
      relative overflow-hidden rounded-2xl border p-4 sm:p-5
      transition-colors duration-200
      ${
        danger
          ? "border-red-200/80 bg-red-50/50 dark:border-red-500/15 dark:bg-red-500/[0.035]"
          : "border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#101010]"
      }
    `}
  >
    {danger && (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/[0.06] blur-2xl"
      />
    )}

    <div className="relative flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium text-gray-500 dark:text-white/45">
          {label}
        </p>

        <p
          className={`mt-3 text-3xl font-semibold tracking-[-0.05em] ${
            danger
              ? "text-red-600 dark:text-red-400"
              : "text-gray-950 dark:text-[#f5f5f0]"
          }`}
        >
          {value}
        </p>

        <p className="mt-2 text-[10px] text-gray-400 dark:text-white/30">
          {detail}
        </p>
      </div>

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          danger
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-indigo-500/[0.08] text-indigo-600 dark:text-indigo-300"
        }`}
      >
        {icon}
      </span>
    </div>
  </div>
);

// =============================================================
// FilterPill
// =============================================================

const FilterPill = ({
  label,
  active,
  onClick,
  count,
  danger = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`
      inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2
      text-[11px] font-medium transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
      ${
        active
          ? danger
            ? "border-red-500/20 bg-red-500/[0.08] text-red-700 dark:text-red-300"
            : "border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-700 dark:text-indigo-300"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-white/45 dark:hover:border-white/[0.14] dark:hover:text-white/75"
      }
    `}
  >
    {label}

    {typeof count === "number" && count > 0 && (
      <span
        className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] ${
          active
            ? "bg-black/[0.05] dark:bg-white/[0.08]"
            : "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/45"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

// =============================================================
// GroupButton
// =============================================================

const GroupButton = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`
      inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2
      text-[11px] font-medium transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
      ${
        active
          ? "bg-gray-100 text-gray-900 shadow-sm dark:bg-white/[0.09] dark:text-white"
          : "text-gray-500 hover:text-gray-800 dark:text-white/40 dark:hover:text-white/75"
      }
    `}
  >
    {icon}
    {children}
  </button>
);

// =============================================================
// Section
// =============================================================

const SECTION_COLORS = {
  danger: {
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  default: {
    dot: "bg-indigo-500",
    text: "text-gray-900 dark:text-[#f5f5f0]",
  },
};

const Section = ({
  title,
  subtitle,
  count,
  color = "default",
  muted = false,
  tasks,
}) => {
  const style = SECTION_COLORS[color] || SECTION_COLORS.default;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-white/[0.07]">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            muted ? "bg-gray-300 dark:bg-white/20" : style.dot
          }`}
        />

        <div className="min-w-0">
          <h3
            className={`text-[12px] font-semibold ${
              muted
                ? "text-gray-400 dark:text-white/35"
                : style.text
            }`}
          >
            {title}
          </h3>

          {subtitle && (
            <p className="mt-0.5 text-[10px] text-gray-400 dark:text-white/30">
              {subtitle}
            </p>
          )}
        </div>

        <span className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] text-gray-500 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-white/40">
          {String(count).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            href={`/workspaces/${task.project.workspaceId}/projects/${task.projectId}/tasks/${task.id}`}
          />
        ))}
      </div>
    </section>
  );
};

// =============================================================
// NoMatchingTasks
// =============================================================

const NoMatchingTasks = ({ filter, onReset }) => {
  const messages = {
    overdue: {
      title: "Nothing overdue",
      description: "Great work. You have no overdue open tasks.",
    },
    today: {
      title: "Nothing due today",
      description: "There are no open tasks due today.",
    },
    high: {
      title: "No high-priority tasks",
      description: "You have no open high or urgent priority tasks.",
    },
    all: {
      title: "No tasks to show",
      description: "There are no tasks matching this view.",
    },
  };

  const message = messages[filter] || messages.all;

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 px-5 py-14 text-center dark:border-white/[0.08] dark:bg-white/[0.015]">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/35">
        <CheckSquareIcon />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
        {message.title}
      </h3>

      <p className="mt-1.5 text-[12px] text-gray-500 dark:text-white/40">
        {message.description}
      </p>

      {filter !== "all" && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:border-indigo-500/30 hover:text-indigo-600 dark:border-white/[0.08] dark:text-white/60 dark:hover:text-indigo-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

// =============================================================
// EmptyState
// =============================================================

const EmptyState = () => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-white/[0.08] dark:bg-[#101010] sm:px-10">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(99,102,241,0.09),transparent_55%)]"
    />

    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400">
      <CheckSquareIcon className="h-6 w-6" />
    </div>

    <h2 className="relative mt-5 text-xl font-semibold tracking-tight text-gray-950 dark:text-[#f5f5f0]">
      Your task list is clear.
    </h2>

    <p className="relative mx-auto mt-2 max-w-sm text-[12px] leading-6 text-gray-500 dark:text-white/40">
      Tasks assigned to you across your workspaces will appear here. When
      something needs your attention, you will find it in this view.
    </p>

    <div className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      All caught up
    </div>
  </div>
);

// =============================================================
// Inline SVG icons
// =============================================================

function CheckSquareIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

export default MyTasksView;
