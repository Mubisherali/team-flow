// -------------------------------------------------------------
// AnalyticsSection - 4-chart grid for dashboards
// -------------------------------------------------------------
//
// USED BY:
//   - Workspace detail page (/workspaces/[id])
//   - Project detail page (/workspaces/[id]/projects/[projectId])
//
// PROPS:
//   analytics : {
//     totalTasks,
//     byStatus,
//     byPriority,
//     perMember,
//     unassigned,
//     velocityData,     // provided by server pages
//     priorityMixData,  // provided by server pages
//     dueDateData,      // provided by server pages
//   }
//   title?    : string  — defaults to "Analytics"
// -------------------------------------------------------------

'use client';

import {
  TeamWorkloadChart,
  PriorityMixChart,
  VelocityChart,
  DueDateHealthChart,
} from './AnalyticsCharts';

const AnalyticsSection = ({ analytics, title = 'Analytics' }) => {
  const safe = analytics || {};

  return (
    <section aria-labelledby="analytics-heading" className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="analytics-heading"
          className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          {title}
        </h2>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamWorkloadChart data={safe.workloadData || []} />
        <PriorityMixChart data={safe.priorityMixData || []} />
        <VelocityChart data={safe.velocityData || []} />
        <DueDateHealthChart data={safe.dueDateData || []} />
      </div>
    </section>
  );
};

export default AnalyticsSection;