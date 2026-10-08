// -------------------------------------------------------------
// NotificationDropdown - Panel for the notification bell
// -------------------------------------------------------------
//
// PROPS:
//   isOpen        : boolean
//   onClose       : () => void
//   notifications : array
//   unreadCount   : number
//   loading       : boolean
//   onMarkRead    : (id) => void
//   onMarkAllRead : () => void
//   onSelect      : (notification) => void — navigate
//
// BEHAVIOR:
//   - Click outside → close
//   - Escape       → close
//   - Click a row  → mark read + navigate (parent handles)
//   - "Mark all as read" → calls onMarkAllRead
//
// The parent (NotificationBell) owns the state and passes it in.
// -------------------------------------------------------------

'use client';

import { useEffect, useRef } from 'react';

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

  if (!isOpen) return null;

  const hasNotifications = notifications.length > 0;
  const hasUnread = unreadCount > 0;

  return (
    <div
      ref={wrapRef}
      className="
        absolute bottom-full left-3 right-3 mb-2 z-40
        rounded-2xl overflow-hidden
        bg-white dark:bg-[#111318]
        border border-gray-200 dark:border-white/[0.08]
        shadow-2xl shadow-black/20 dark:shadow-black/50
      "
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {hasUnread && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
              {unreadCount}
            </span>
          )}
        </div>

        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ─── Body ─── */}
      <div className="max-h-96 overflow-y-auto">
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

      {/* ─── Footer (future: "View all" link) ─── */}
      {/* Not adding for now — keep it simple. */}
    </div>
  );
};

// =============================================================
// Loading
// =============================================================
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
  </div>
);

// =============================================================
// Empty
// =============================================================
const EmptyState = () => (
  <div className="py-12 px-6 text-center">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
      <svg
        width="20"
        height="20"
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
    <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
      You&apos;re all caught up
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      New notifications will appear here.
    </p>
  </div>
);

export default NotificationDropdown;