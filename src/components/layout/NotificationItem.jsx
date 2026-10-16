// -------------------------------------------------------------
// NotificationItem - Single row in the notification dropdown
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by <NotificationDropdown> for each notification.
//
// STRUCTURE:
//   Unread dot · icon tile (by type) · message + relative time
//
// POLISH:
//   - Icon tiles use glass tints (matches Wave-3 pattern)
//   - Unread bg uses glass indigo
//   - Type scale aligned to Wave-3
//   - focus-visible ring on row
//   - active:scale-[0.99]
//   - aria-hidden on decorative SVGs
//
// PRESERVED:
//   - Props (notification, onClick)
//   - getIconForType() switch (all 6 types + default)
//   - formatRelative helper (custom, per Wave-3 convention)
// -------------------------------------------------------------

'use client';

const NotificationItem = ({ notification, onClick }) => {
  const { type, message, isRead, createdAt } = notification;

  const icon = getIconForType(type);

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
        active:scale-[0.99]
        transition-all duration-150
        hover:bg-gray-50 dark:hover:bg-white/[0.03]
        ${!isRead ? 'bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06]' : ''}
      `}
    >
      {/* Unread dot */}
      <span className="w-2 pt-2.5 flex-shrink-0" aria-hidden="true">
        {!isRead && (
          <span className="block w-2 h-2 rounded-full bg-indigo-500" />
        )}
      </span>

      {/* Icon */}
      <span
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${icon.bg}
        `}
        aria-hidden="true"
      >
        {icon.svg}
      </span>

      {/* Content */}
      <span className="flex-1 min-w-0">
        <span
          className={`
            block text-[13px] leading-snug line-clamp-3
            ${
              !isRead
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-gray-600 dark:text-gray-400'
            }
          `}
        >
          {message}
        </span>
        <span className="block text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
          {formatRelative(createdAt)}
        </span>
      </span>
    </button>
  );
};

// =============================================================
// Icon config per notification type
// =============================================================
function getIconForType(type) {
  switch (type) {
    case 'TASK_COMMENTED':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
        svg: (
          <svg
            width="15"
            height="15"
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
        ),
      };

    case 'TASK_STATUS_CHANGED':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        svg: (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };

    case 'TASK_ASSIGNED':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
        svg: (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0116 0" strokeLinecap="round" />
          </svg>
        ),
      };

    case 'INVITATION_ACCEPTED':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
        svg: (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M22 11.08V12a10 10 0 11-5.93-9.14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 4L12 14.01l-3-3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };

    case 'PROJECT_ADDED':
      return {
        bg: 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
        svg: (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M3 6.5A2.5 2.5 0 015.5 4H10l2 2h6.5A2.5 2.5 0 0121 8.5v9A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5v-11z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };

    default:
      return {
        bg: 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400',
        svg: (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        ),
      };
  }
}

// =============================================================
// formatRelative - custom helper (per project convention)
// =============================================================
function formatRelative(isoString) {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default NotificationItem;