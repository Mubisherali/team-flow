// -------------------------------------------------------------
// TaskViewMode - Read-only display of a task
// -------------------------------------------------------------
//
// USED BY:
//   - TaskPageView (task page in view mode)
//
// LAYOUT:
//   Desktop: two columns (main + right rail)
//   Mobile:  single column, rail stacks below
//
// DESIGN GOALS:
//   - Nothing looks like an input
//   - Title is the star
//   - Metadata is scannable, not form-like
//   - Plenty of whitespace
// -------------------------------------------------------------

'use client';

import {
  statusMeta,
  priorityMeta,
  dueDateMeta,
} from '@/lib/task-constants';

const TaskViewMode = ({ task }) => {
  const statusInfo = statusMeta(task.status);
  const priorityInfo = priorityMeta(task.priority);
  const due = dueDateMeta(task.dueDate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 md:gap-12">
      {/* ─── Main column ─── */}
      <div className="min-w-0 space-y-6">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
          {task.title}
        </h1>

        {/* Description */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Description
          </h2>
          {task.description && task.description.trim() ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
              {task.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-600 italic">
              No description
            </p>
          )}
        </div>
      </div>

      {/* ─── Right rail ─── */}
      <aside className="space-y-5 md:pt-1">
        {/* Status */}
        <ViewField label="Status">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
            <span className="text-sm text-gray-900 dark:text-white">
              {statusInfo.label}
            </span>
          </div>
        </ViewField>

        {/* Priority */}
        <ViewField label="Priority">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${priorityInfo.dot}`} />
            <span className="text-sm text-gray-900 dark:text-white">
              {priorityInfo.label}
            </span>
          </div>
        </ViewField>

        {/* Assignee */}
        <ViewField label="Assignee">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <UserAvatar
                name={task.assignee.name}
                email={task.assignee.email}
                image={task.assignee.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {task.assignee.name || task.assignee.email}
                </p>
                {task.assignee.name && task.assignee.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {task.assignee.email}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                Unassigned
              </span>
            </div>
          )}
        </ViewField>

        {/* Due date */}
        <ViewField label="Due date">
          {due ? (
            <span className={`text-sm ${due.className}`}>{due.label}</span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
              No due date
            </span>
          )}
        </ViewField>

        {/* Labels */}
        <ViewField label="Labels">
          {task.labels && task.labels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => (
                <span
                  key={label}
                  className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
              No labels
            </span>
          )}
        </ViewField>

        {/* Divider */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800" />

        {/* Meta */}
        <ViewField label="Created by">
          <p className="text-sm text-gray-900 dark:text-white">
            {task.createdBy?.name || task.createdBy?.email || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(task.createdAt)}
          </p>
        </ViewField>

        {task.updatedAt !== task.createdAt && (
          <ViewField label="Last updated">
            <p className="text-sm text-gray-900 dark:text-white">
              {formatRelative(task.updatedAt)}
            </p>
          </ViewField>
        )}
      </aside>
    </div>
  );
};

// =============================================================
// ViewField - label + value pair
// =============================================================
const ViewField = ({ label, children }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-1.5">
      {label}
    </p>
    {children}
  </div>
);

// =============================================================
// UserAvatar
// =============================================================
const UserAvatar = ({ name, email, image, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

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
        alt={name || 'User'}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold flex-shrink-0 ${textSize}`}
    >
      {initials}
    </div>
  );
};

// =============================================================
// Date helpers
// =============================================================
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default TaskViewMode;