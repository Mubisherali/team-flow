// -------------------------------------------------------------
// MyTasksView - Grouped list of user's tasks across workspaces
// -------------------------------------------------------------
//
// FEATURES:
//   - Summary Stats (Total, Due This Week, Overdue)
//   - Filter Pills (All, Overdue, High Priority)
//   - Grouping Toggle (By Date vs By Project)
// -------------------------------------------------------------

"use client";

import { useState, useMemo } from "react";
import TaskRow from "./TaskRow";

const MyTasksView = ({ tasks }) => {
  const [filter, setFilter] = useState("all"); // 'all' | 'overdue' | 'today' | 'high'
  const [groupBy, setGroupBy] = useState("date"); // 'date' | 'project'

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    let overdue = 0;
    let dueThisWeek = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    tasks.forEach((t) => {
      if (t.status === "DONE") return;
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < now) overdue++;
        else if (due <= nextWeek) dueThisWeek++;
      }
    });

    return {
      total: tasks.filter((t) => t.status !== "DONE").length,
      dueThisWeek,
      overdue,
    };
  }, [tasks]);

  // 2. Apply Filters
  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return tasks.filter((t) => {
      if (t.status === "DONE") return false; // Hide completed on specific filters

      if (filter === "high")
        return t.priority === "HIGH" || t.priority === "URGENT";

      if (t.dueDate) {
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        if (filter === "overdue") return due < now;
        if (filter === "today") return due.getTime() === now.getTime();
      }
      return false;
    });
  }, [tasks, filter]);

  // 3. Group Data
  const grouped = useMemo(() => {
    if (groupBy === "project") {
      // Group by Project
      const map = new Map();
      filteredTasks.forEach((t) => {
        if (!map.has(t.project.id)) {
          map.set(t.project.id, {
            title: t.project.name,
            workspace: t.project.workspace.name,
            tasks: [],
          });
        }
        map.get(t.project.id).tasks.push(t);
      });
      return Array.from(map.values()).sort((a, b) =>
        a.title.localeCompare(b.title),
      );
    }

    // Group by Date (Urgency)
    const groups = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
      completed: [],
    };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    filteredTasks.forEach((t) => {
      if (t.status === "DONE") {
        groups.completed.push(t);
        return;
      }
      if (!t.dueDate) {
        groups.noDate.push(t);
        return;
      }

      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < now) groups.overdue.push(t);
      else if (due.getTime() === now.getTime()) groups.today.push(t);
      else if (due <= nextWeek) groups.upcoming.push(t);
      else groups.noDate.push(t);
    });

    return groups;
  }, [filteredTasks, groupBy]);

  if (tasks.length === 0) return <EmptyState />;

  return (
    <div className="space-y-8">
      {/* ─── SUMMARY STATS ─── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Open Tasks"
          value={stats.total}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Due This Week"
          value={stats.dueThisWeek}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          danger={stats.overdue > 0}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          }
        />
      </div>

      {/* ─── CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <FilterPill
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterPill
            label="Overdue"
            active={filter === "overdue"}
            onClick={() => setFilter("overdue")}
            count={stats.overdue}
          />
          <FilterPill
            label="Today"
            active={filter === "today"}
            onClick={() => setFilter("today")}
          />
          <FilterPill
            label="High Priority"
            active={filter === "high"}
            onClick={() => setFilter("high")}
          />
        </div>

        {/* Group Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.04] p-1 rounded-lg flex-shrink-0">
          <button
            onClick={() => setGroupBy("date")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${groupBy === "date" ? "bg-white dark:bg-[#111318] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
          >
            By Date
          </button>
          <button
            onClick={() => setGroupBy("project")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${groupBy === "project" ? "bg-white dark:bg-[#111318] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
          >
            By Project
          </button>
        </div>
      </div>

      {/* ─── LIST ─── */}
      <div>
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-gray-200 dark:border-white/[0.08] rounded-2xl">
            <p className="text-[13px] text-gray-500">
              No tasks match this filter.
            </p>
          </div>
        ) : groupBy === "date" ? (
          <div className="space-y-8">
            {grouped.overdue.length > 0 && (
              <Section
                title="Overdue"
                count={grouped.overdue.length}
                color="text-red-600 dark:text-red-400"
                tasks={grouped.overdue}
              />
            )}
            {grouped.today.length > 0 && (
              <Section
                title="Today"
                count={grouped.today.length}
                color="text-amber-600 dark:text-amber-400"
                tasks={grouped.today}
              />
            )}
            {grouped.upcoming.length > 0 && (
              <Section
                title="Upcoming"
                count={grouped.upcoming.length}
                tasks={grouped.upcoming}
              />
            )}
            {grouped.noDate.length > 0 && (
              <Section
                title="No Due Date"
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
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <Section
                key={group.title}
                title={group.title}
                subtitle={group.workspace}
                count={group.tasks.length}
                tasks={group.tasks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================
// Sub-components
// =============================================================
const StatCard = ({ label, value, icon, danger }) => (
  <div className="rounded-2xl p-4 border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115] flex items-center gap-3">
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"}`}
    >
      {icon}
    </div>
    <div>
      <p
        className={`text-[18px] font-semibold leading-tight ${danger ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
      >
        {value}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
);

const FilterPill = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 flex-shrink-0 border ${active ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300" : "bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
  >
    {label}
    {count > 0 && (
      <span
        className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? "bg-indigo-200/50 dark:bg-indigo-500/30" : "bg-gray-100 dark:bg-white/[0.06]"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const Section = ({
  title,
  subtitle,
  count,
  color = "text-gray-900 dark:text-white",
  muted = false,
  tasks,
}) => (
  <div>
    <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-white/[0.06] pb-2">
      <h2
        className={`text-[13px] font-semibold ${muted ? "text-gray-400 dark:text-gray-500" : color}`}
      >
        {title}
      </h2>
      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
        {count}
      </span>
      {subtitle && (
        <span className="text-[11px] text-gray-400 ml-1">• {subtitle}</span>
      )}
    </div>
    <div className="flex flex-col gap-2.5">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          href={`/workspaces/${task.project.workspaceId}/projects/${task.projectId}/tasks/${task.id}`}
        />
      ))}
    </div>
  </div>
);

const EmptyState = () => (
  <div className="rounded-2xl py-16 px-6 text-center border border-dashed border-gray-300 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02]">
    <div
      className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-emerald-600 dark:text-emerald-400"
      >
        <path
          d="M20 6L9 17l-5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
      No assigned tasks
    </h3>
    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
      When someone assigns a task to you, it will show up here.
    </p>
  </div>
);

export default MyTasksView;
