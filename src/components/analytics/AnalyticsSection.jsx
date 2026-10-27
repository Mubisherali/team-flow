"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  TeamWorkloadChart,
  PriorityMixChart,
  VelocityChart,
  DueDateHealthChart,
} from "./AnalyticsCharts";

const AnalyticsSection = ({ analytics, title = "Analytics" }) => {
  const safe = analytics || {};

  const totalTasks = Number(safe.totalTasks || 0);
  const completedTasks = Number(
    safe.byStatus?.DONE ??
    safe.byStatus?.done ??
    0
  );

  const completionRate =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const chartItems = [
    {
      title: "Team Workload",
      description: "Task distribution across your team",
      icon: BarChart3,
      color: "text-blue-500",
      background: "bg-blue-500/10",
      data: safe.workloadData || [],
    },
    {
      title: "Priority Distribution",
      description: "Understand where priority work sits",
      icon: ChartNoAxesCombined,
      color: "text-amber-500",
      background: "bg-amber-500/10",
      data: safe.priorityMixData || [],
    },
    {
      title: "Completion Velocity",
      description: "Completed tasks over the last 14 days",
      icon: Activity,
      color: "text-emerald-500",
      background: "bg-emerald-500/10",
      data: safe.velocityData || [],
    },
    {
      title: "Due Date Health",
      description: "Monitor deadlines and overdue work",
      icon: ArrowUpRight,
      color: "text-violet-500",
      background: "bg-violet-500/10",
      data: safe.dueDateData || [],
    },
  ];

  return (
    <section
      aria-labelledby="analytics-heading"
      className="mb-10 space-y-5"
    >
      {/* Section heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            <ChartNoAxesCombined
              size={20}
              className="text-gray-700 dark:text-gray-200"
            />
          </div>

          <div>
            <h2
              id="analytics-heading"
              className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white"
            >
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Insights into workload, priorities, and delivery.
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Project insights
        </div>
      </div>

      {/* Summary strip */}
      {totalTasks > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0f1115]">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total tasks
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
              {totalTasks}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Across this workspace or project
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0f1115]">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Completed
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {completedTasks}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Tasks marked as done
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#0f1115]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Completion rate
              </p>

              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {completionRate}%
              </span>
            </div>

            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.07]"
              role="progressbar"
              aria-label="Task completion rate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionRate}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {totalTasks - completedTasks} tasks remaining
            </p>
          </div>
        </div>
      )}

      {/* Chart grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {chartItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="min-w-0">
              <div className="mb-2 flex items-center gap-3 px-1">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.background}`}
                >
                  <Icon size={17} className={item.color} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.title === "Team Workload" && (
                <TeamWorkloadChart data={item.data} />
              )}

              {item.title === "Priority Distribution" && (
                <PriorityMixChart data={item.data} />
              )}

              {item.title === "Completion Velocity" && (
                <VelocityChart data={item.data} />
              )}

              {item.title === "Due Date Health" && (
                <DueDateHealthChart data={item.data} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AnalyticsSection;
