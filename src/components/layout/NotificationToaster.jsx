// -------------------------------------------------------------
// NotificationToaster - Toast on new notification arrivals
// -------------------------------------------------------------
//
// VISUAL:
//   Slides down from the top-center of the viewport, like a
//   mobile push notification. Larger, more prominent, with a
//   colored accent bar and clickable body.
//
// BEHAVIOR:
//   - Fires when a new notification arrives via polling
//   - Auto-dismisses after 5 seconds
//   - Clickable → marks read + navigates
// -------------------------------------------------------------

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useNotificationsCtx } from '@/context/NotificationsContext';

const NotificationToaster = () => {
  const { latestArrival, acknowledgeArrival, markRead } =
    useNotificationsCtx();
  const router = useRouter();

  useEffect(() => {
    if (!latestArrival) return;

    const { id, message, link, isRead, type } = latestArrival;

    const accent = getAccentForType(type);

    toast.custom(
      (t) => (
        <div
          className={`
            pointer-events-auto
            w-[400px] max-w-[92vw]
            rounded-2xl
            bg-white dark:bg-[#111318]
            border border-gray-200 dark:border-white/[0.08]
            shadow-2xl shadow-black/25 dark:shadow-black/60
            overflow-hidden
            transition-all duration-300 ease-out
            ${t.visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-[0.98]'}
          `}
        >
          {/* Top accent bar */}
          <div className={`h-1 w-full ${accent.bar}`} />

          <button
            type="button"
            onClick={() => {
              if (!isRead) markRead(id);
              if (link) router.push(link);
              toast.dismiss(t.id);
            }}
            className="w-full flex items-start gap-3.5 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            {/* Icon */}
            <span
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                flex-shrink-0 mt-0.5
                ${accent.iconBg}
              `}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 01-3.46 0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            {/* Content */}
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  New notification
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  Just now
                </span>
              </span>

              <span className="block text-[14px] font-medium text-gray-900 dark:text-white leading-snug">
                {message}
              </span>

              <span className="block text-[12px] text-indigo-600 dark:text-indigo-400 font-medium mt-2">
                Click to open →
              </span>
            </span>

            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </button>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-center',
      }
    );

    acknowledgeArrival();
  }, [latestArrival, acknowledgeArrival, markRead, router]);

  return null;
};

// =============================================================
// Accent color per notification type
// =============================================================
function getAccentForType(type) {
  switch (type) {
    case 'TASK_COMMENTED':
      return {
        bar: 'bg-blue-500',
        iconBg:
          'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
      };
    case 'TASK_STATUS_CHANGED':
      return {
        bar: 'bg-emerald-500',
        iconBg:
          'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      };
    case 'TASK_ASSIGNED':
      return {
        bar: 'bg-indigo-500',
        iconBg:
          'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      };
    case 'INVITATION_ACCEPTED':
      return {
        bar: 'bg-amber-500',
        iconBg:
          'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
      };
    case 'PROJECT_ADDED':
      return {
        bar: 'bg-violet-500',
        iconBg:
          'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
      };
    default:
      return {
        bar: 'bg-indigo-500',
        iconBg:
          'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      };
  }
}

export default NotificationToaster;