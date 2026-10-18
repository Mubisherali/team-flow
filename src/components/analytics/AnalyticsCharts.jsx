// -------------------------------------------------------------
// AnalyticsCharts - Realistic, high-signal charts for PMs
// -------------------------------------------------------------
// FIXES:
//   - Forced fixed heights on the charts (fixes blank bars)
//   - Forced text visibility for Light + Dark mode
// -------------------------------------------------------------

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
// Shared Card Shell (Fixed Height to prevent Recharts collapse)
// -------------------------------------------------------------
const ChartCard = ({ title, subtitle, empty, children }) => (
  <div
    className="
      rounded-2xl p-5
      border border-gray-200 dark:border-white/[0.08]
      bg-white dark:bg-[#0f1115]
      flex flex-col h-[340px] /* FIXED HEIGHT */
    "
  >
    <div className="mb-4 flex-shrink-0">
      <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5">
        {subtitle}
      </p>
    </div>

    {/* Chart Area */}
    <div className="flex-1 relative w-full">
      {empty && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-[2px]">
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 italic">
            Not enough data to display
          </p>
        </div>
      )}
      {children}
    </div>
  </div>
);

// -------------------------------------------------------------
// Custom Tooltip
// -------------------------------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="
        rounded-xl px-3 py-2.5
        bg-white/95 dark:bg-[#111318]/95
        backdrop-blur-md
        border border-gray-200 dark:border-white/[0.1]
        shadow-xl shadow-black/10 dark:shadow-black/40
        min-w-[140px]
      "
    >
      <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white mb-1.5 pb-1.5 border-b border-gray-100 dark:border-white/[0.06]">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[11.5px] text-gray-600 dark:text-gray-400">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color || item.fill }}
              />
              {item.name}
            </span>
            <span className="text-[12px] font-medium text-gray-900 dark:text-white tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Colors & Global Axis Styles
// -------------------------------------------------------------
const COLORS = {
  TODO: "#9ca3af",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  DONE: "#10b981",
};
const PRIORITY_COLORS = {
  LOW: "#9ca3af",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

// Force axes to use a visible gray, regardless of light/dark mode
const axisProps = {
  tick: { fontSize: 11, fill: "#6b7280" },
  axisLine: { stroke: "#d1d5db" },
  tickLine: { stroke: "#d1d5db" },
};

// =============================================================
// 1. TEAM WORKLOAD
// =============================================================
export const TeamWorkloadChart = ({ data = [] }) => {
  const totalTasks = data.reduce(
    (sum, m) => sum + m.TODO + m.IN_PROGRESS + m.REVIEW + m.DONE,
    0,
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
          margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
          barSize={24}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e5e7eb"
            className="dark:opacity-20"
          />
          <XAxis type="number" {...axisProps} allowDecimals={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={80}
            {...axisProps}
            tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(150,150,150,0.1)" }}
          />

          <Bar dataKey="TODO" name="To do" stackId="a" fill={COLORS.TODO} />
          <Bar
            dataKey="IN_PROGRESS"
            name="In progress"
            stackId="a"
            fill={COLORS.IN_PROGRESS}
          />
          <Bar
            dataKey="REVIEW"
            name="Review"
            stackId="a"
            fill={COLORS.REVIEW}
          />
          <Bar
            dataKey="DONE"
            name="Done"
            stackId="a"
            fill={COLORS.DONE}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// =============================================================
// 2. PRIORITY MIX
// =============================================================
export const PriorityMixChart = ({ data = [] }) => {
  const total = data.reduce(
    (sum, d) => sum + d.URGENT + d.HIGH + d.MEDIUM + d.LOW,
    0,
  );
  const isEmpty = data.length === 0 || total === 0;

  return (
    <ChartCard
      title="Priority Mix by Status"
      subtitle="Where high-priority work is clustering"
      empty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          barSize={40}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
            className="dark:opacity-20"
          />
          <XAxis
            dataKey="status"
            {...axisProps}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(150,150,150,0.1)" }}
          />

          <Bar
            dataKey="LOW"
            name="Low"
            stackId="a"
            fill={PRIORITY_COLORS.LOW}
          />
          <Bar
            dataKey="MEDIUM"
            name="Medium"
            stackId="a"
            fill={PRIORITY_COLORS.MEDIUM}
          />
          <Bar
            dataKey="HIGH"
            name="High"
            stackId="a"
            fill={PRIORITY_COLORS.HIGH}
          />
          <Bar
            dataKey="URGENT"
            name="Urgent"
            stackId="a"
            fill={PRIORITY_COLORS.URGENT}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// =============================================================
// 3. VELOCITY
// =============================================================
export const VelocityChart = ({ data = [] }) => {
  const isEmpty = data.length === 0 || data.every((d) => d.completed === 0);

  return (
    <ChartCard
      title="Velocity"
      subtitle="Tasks completed over the last 14 days"
      empty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
            className="dark:opacity-20"
          />
          <XAxis
            dataKey="date"
            {...axisProps}
            dy={10}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVelocity)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// =============================================================
// 4. DUE DATE HEALTH
// =============================================================
export const DueDateHealthChart = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = total === 0;

  return (
    <ChartCard
      title="Due Date Health"
      subtitle="Time-sensitive task breakdown"
      empty={isEmpty}
    >
      <div className="flex h-full items-center">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius="65%"
                outerRadius="90%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[20px] font-semibold text-gray-900 dark:text-white leading-none">
              {total}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
              Tasks
            </span>
          </div>
        </div>

        <div className="w-1/2 pl-4 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="text-[12.5px] font-semibold text-gray-900 dark:text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
};
