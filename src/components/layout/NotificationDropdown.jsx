// -------------------------------------------------------------
// NotificationDropdown - Panel for the notification bell
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by <NotificationBell> inside the sidebar. Opens
//   ABOVE the trigger and extends RIGHT past the sidebar edge
//   so it can hold readable content without squeezing.
//
// STRUCTURE:
//   Floating panel (fixed width 380px)
//     - Tail arrow (points at the bell)
//     - Header (title + unread count + "Mark all as read")
//     - Body (loading / empty / list with thin scrollbar)
//
// WIDTH STRATEGY:
//   The trigger is only ~246px wide (sidebar width minus padding).
//   A same-width dropdown can't show notifications without
//   wrapping every message to 3+ lines. So we:
//     - Anchor at bottom-left of the trigger
//     - Extend to the RIGHT with a fixed 380px width
//     - Cap at calc(100vw-24px) for small desktop windows
//
// POLISH:
//   - Framer Motion entry + exit
//   - Surface #111318 (elevated pattern)
//   - Thin scrollbar via Tailwind arbitrary selectors
//   - Left tail arrow points at the bell
//   - Type scale aligned (13/11.5)
//   - focus-visible ring on "Mark all as read"
//
// PRESERVED:
//   - Props (all 8)
//   - Click-outside + Escape close handlers
//   - LoadingState / EmptyState sub-components
//   - NotificationItem rendering logic
// -------------------------------------------------------------

'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import NotificationItem from './NotificationItem';

const NotificationDropdown = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onSelect,
}) => {
  const wrapRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const hasNotifications = notifications.length > 0;
  const hasUnread = unreadCount > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={wrapRef}
          key="notif-dropdown"
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="
            absolute bottom-full left-0 mb-3 z-40
            w-[380px] max-w-[calc(100vw-24px)]
            rounded-2xl
            bg-white dark:bg-[#111318]
            border border-gray-200 dark:border-white/[0.08]
            shadow-2xl shadow-black/20 dark:shadow-black/50
            overflow-hidden
            origin-bottom-left
          "
        >
          {/* ─── Tail arrow (points at the bell) ─── */}
          <span
            aria-hidden="true"
            className="
              absolute -bottom-[7px] left-6
              w-3 h-3 rotate-45
              bg-white dark:bg-[#111318]
              border-r border-b
              border-gray-200 dark:border-white/[0.08]
            "
          />

          {/* ─── Header ─── */}
          <div
            className="
              flex items-center justify-between gap-3
              px-4 py-3
              border-b border-gray-200 dark:border-white/[0.06]
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                Notifications
              </h3>
              {hasUnread && (
                <span
                  className="
                    flex-shrink-0
                    text-[10px] font-bold px-1.5 py-0.5 rounded-md
                    bg-indigo-500/10 dark:bg-indigo-500/15
                    text-indigo-700 dark:text-indigo-300
                  "
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {hasUnread && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="
                  flex-shrink-0
                  text-[11.5px] font-medium
                  text-indigo-600 dark:text-indigo-400
                  hover:text-indigo-700 dark:hover:text-indigo-300
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                  rounded
                  transition-colors duration-150
                "
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* ─── Body ─── */}
          <div
            className="
              max-h-[420px] overflow-y-auto

              [scrollbar-width:thin]
              [scrollbar-color:rgba(120,120,120,0.35)_transparent]

              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[rgba(120,120,120,0.35)]
              hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(120,120,120,0.55)]
            "
          >
            {loading && !hasNotifications ? (
              <LoadingState />
            ) : !hasNotifications ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={(notification) => {
                      if (!notification.isRead) {
                        onMarkRead?.(notification.id);
                      }
                      onSelect?.(notification);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================================
// Loading
// =============================================================
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <span
      className="
        w-5 h-5 rounded-full animate-spin
        border-2 border-gray-300 dark:border-white/10
        border-t-gray-500 dark:border-t-gray-400
      "
    />
  </div>
);

// =============================================================
// Empty
// =============================================================
const EmptyState = () => (
  <div className="py-12 px-6 text-center">
    <div
      className="
        w-12 h-12 mx-auto mb-3 rounded-full
        bg-emerald-500/10 dark:bg-emerald-500/15
        flex items-center justify-center
      "
      aria-hidden="true"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-emerald-600 dark:text-emerald-400"
      >
        <path
          d="M20 6L9 17l-5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-0.5">
      You&apos;re all caught up
    </p>
    <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
      New notifications will appear here.
    </p>
  </div>
);

export default NotificationDropdown;