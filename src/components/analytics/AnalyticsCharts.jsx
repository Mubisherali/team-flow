"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

// -------------------------------------------------------------
// COLORS
// -------------------------------------------------------------

const COLORS = {
  TODO: "#9CA3AF",
  IN_PROGRESS: "#3B82F6",
  REVIEW: "#F59E0B",
  DONE: "#10B981",
};

const PRIORITY_COLORS = {
  LOW: "#9CA3AF",
  MEDIUM: "#3B82F6",
  HIGH: "#F59E0B",
  URGENT: "#EF4444",
};

const GRID_COLOR = "#94A3B8";

const axisProps = {
  tick: {
    fontSize: 11,
    fill: "#9CA3AF",
  },
  axisLine: {
    stroke: "#374151",
    strokeOpacity: 0.2,
  },
  tickLine: {
    stroke: "#374151",
    strokeOpacity: 0.2,
  },
};

// -------------------------------------------------------------
// SHARED CHART CARD
// -------------------------------------------------------------

const ChartCard = ({ title, subtitle, empty, children }) => (
  <div className="group flex h-[330px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-colors duration-200 hover:border-gray-300 sm:p-5 dark:border-white/[0.08] dark:bg-[#0f1115] dark:hover:border-white/[0.14]">
    <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-300 transition-colors group-hover:bg-emerald-400 dark:bg-white/20" />
    </div>

    <div className="relative min-h-0 w-full flex-1">
      {children}

      {empty && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/85 px-4 backdrop-blur-[3px] dark:bg-[#0f1115]/85">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path
                  d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Not enough data yet
            </p>

            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
              Activity will appear here as tasks are updated.
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// -------------------------------------------------------------
// CUSTOM TOOLTIP
// -------------------------------------------------------------

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const visiblePayload = payload.filter(
    (item) => Number(item.value) !== 0
  );

  return (
    <div className="min-w-[145px] rounded-xl border border-gray-200 bg-white/95 px-3 py-2.5 shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#15171c]/95 dark:shadow-black/40">
      {label != null && (
        <p className="mb-2 border-b border-gray-100 pb-2 text-xs font-semibold text-gray-900 dark:border-white/[0.08] dark:text-white">
          {label}
        </p>
      )}

      <div className="space-y-2">
        {visiblePayload.map((item, index) => (
          <div
            key={`${item.dataKey || item.name}-${index}`}
            className="flex items-center justify-between gap-5"
          >
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: item.color || item.fill || "#9CA3AF",
                }}
              />

              {item.name || item.dataKey}
            </span>

            <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 1. TEAM WORKLOAD
// -------------------------------------------------------------

export const TeamWorkloadChart = ({ data = [] }) => {
  const totalTasks = data.reduce(
    (sum, member) =>
      sum +
      Number(member.TODO || 0) +
      Number(member.IN_PROGRESS || 0) +
      Number(member.REVIEW || 0) +
      Number(member.DONE || 0),
    0
  );

  const isEmpty = data.length === 0 || totalTasks === 0;

  return (
    <ChartCard
      title="Team Workload"
      subtitle="Current task distribution per member"
      empty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 8, left: -16, bottom: 2 }}
          barSize={20}
          barCategoryGap={12}
        >
          <CartesianGrid
            strokeDasharray="3 5"
            horizontal={false}
            stroke={GRID_COLOR}
            strokeOpacity={0.2}
          />

          <XAxis
            type="number"
            {...axisProps}
            allowDecimals={false}
            tickLine={false}
          />

          <YAxis
            dataKey="name"
            type="category"
            width={78}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />

          <Bar
            dataKey="TODO"
            name="To do"
            stackId="workload"
            fill={COLORS.TODO}
          />

          <Bar
            dataKey="IN_PROGRESS"
            name="In progress"
            stackId="workload"
            fill={COLORS.IN_PROGRESS}
          />

          <Bar
            dataKey="REVIEW"
            name="Review"
            stackId="workload"
            fill={COLORS.REVIEW}
          />

          <Bar
            dataKey="DONE"
            name="Done"
            stackId="workload"
            fill={COLORS.DONE}
            radius={[0, 5, 5, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// -------------------------------------------------------------
// 2. PRIORITY MIX
// -------------------------------------------------------------

export const PriorityMixChart = ({ data = [] }) => {
  const total = data.reduce(
    (sum, item) =>
      sum +
      Number(item.URGENT || 0) +
      Number(item.HIGH || 0) +
      Number(item.MEDIUM || 0) +
      Number(item.LOW || 0),
    0
  );

  const isEmpty = data.length === 0 || total === 0;

  return (
    <ChartCard
      title="Priority Mix"
      subtitle="Priority levels across task statuses"
      empty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
          barSize={34}
          barCategoryGap={18}
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke={GRID_COLOR}
            strokeOpacity={0.2}
          />

          <XAxis
            dataKey="status"
            {...axisProps}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            {...axisProps}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />

          <Bar
            dataKey="LOW"
            name="Low"
            stackId="priority"
            fill={PRIORITY_COLORS.LOW}
          />

          <Bar
            dataKey="MEDIUM"
            name="Medium"
            stackId="priority"
            fill={PRIORITY_COLORS.MEDIUM}
          />

          <Bar
            dataKey="HIGH"
            name="High"
            stackId="priority"
            fill={PRIORITY_COLORS.HIGH}
          />

          <Bar
            dataKey="URGENT"
            name="Urgent"
            stackId="priority"
            fill={PRIORITY_COLORS.URGENT}
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// -------------------------------------------------------------
// 3. COMPLETION VELOCITY
// -------------------------------------------------------------

export const VelocityChart = ({ data = [] }) => {
  const isEmpty =
    data.length === 0 ||
    data.every((item) => Number(item.completed || 0) === 0);

  return (
    <ChartCard
      title="Completion Velocity"
      subtitle="Tasks completed over the last 14 days"
      empty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="teamflowVelocityGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#10B981"
                stopOpacity={0.28}
              />

              <stop
                offset="95%"
                stopColor="#10B981"
                stopOpacity={0.01}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke={GRID_COLOR}
            strokeOpacity={0.2}
          />

          <XAxis
            dataKey="date"
            {...axisProps}
            tickLine={false}
            axisLine={false}
            dy={7}
          />

          <YAxis
            {...axisProps}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#10B981"
            strokeWidth={2.5}
            fill="url(#teamflowVelocityGradient)"
            activeDot={{
              r: 5,
              stroke: "#10B981",
              strokeWidth: 2,
              fill: "#ffffff",
            }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// -------------------------------------------------------------
// 4. DUE DATE HEALTH
// -------------------------------------------------------------

export const DueDateHealthChart = ({ data = [] }) => {
  const normalizedData = data.map((item) => ({
    ...item,
    value: Number(item.value || 0),
  }));

  const total = normalizedData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const isEmpty = total === 0;

  return (
    <ChartCard
      title="Due Date Health"
      subtitle="A breakdown of task deadline health"
      empty={isEmpty}
    >
      <div className="flex h-full min-w-0 items-center">
        <div className="relative h-full min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={normalizedData}
                innerRadius="62%"
                outerRadius="83%"
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {normalizedData.map((item, index) => (
                  <Cell
                    key={`${item.name}-${index}`}
                    fill={item.color || "#9CA3AF"}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {total}
            </span>

            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Tasks
            </span>
          </div>
        </div>

        <div className="ml-2 w-[44%] min-w-0 space-y-3 pl-1 sm:ml-4 sm:space-y-4 sm:pl-2">
          {normalizedData.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-start justify-between gap-2"
            >
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: item.color || "#9CA3AF",
                  }}
                />

                <span className="break-words text-xs leading-4 text-gray-600 dark:text-gray-400">
                  {item.name}
                </span>
              </div>

              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-900 dark:text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
};
