// -------------------------------------------------------------
// NotificationBell - Bell + badge + dropdown for the sidebar
// -------------------------------------------------------------
//
// SELF-CONTAINED:
//   Owns:
//     - Dropdown open state
//     - useNotifications hook (polling, unread count)
//     - Click handlers (mark read, mark all read, navigate)
//
// VISUAL STYLE:
//   Matches the sidebar's user menu button (bottom of sidebar)
//   — rounded-xl, icon + label, chevron when open.
//
// BEHAVIOR:
//   - Click → toggle dropdown
//   - Click a notification → mark as read + navigate to link
//   - Click outside / Escape → close
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotifications();

  const router = useRouter();

  const handleToggle = () => {
    setIsOpen((v) => !v);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Click a notification → mark as read + navigate
  const handleSelect = (notification) => {
    if (notification.link) {
      router.push(notification.link);
    }
    handleClose();
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  // Badge display: cap at "9+"
  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative">
      {/* Dropdown (rendered above the bell) */}
      <NotificationDropdown
        isOpen={isOpen}
        onClose={handleClose}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onMarkRead={markRead}
        onMarkAllRead={handleMarkAllRead}
        onSelect={handleSelect}
      />

      {/* Bell button */}
      <button
        type="button"
        onClick={handleToggle}
        className="
          group w-full flex items-center gap-3
          p-2 rounded-xl
          hover:bg-gray-100 dark:hover:bg-white/[0.04]
          transition-all duration-200
        "
        aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Icon tile */}
        <span
          className="
            relative w-9 h-9 rounded-xl
            bg-gray-100 dark:bg-white/[0.06]
            flex items-center justify-center flex-shrink-0
          "
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-gray-600 dark:text-gray-400"
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

          {/* Unread badge */}
          {hasUnread && (
            <span
              className="
                absolute -top-1 -right-1
                min-w-[18px] h-[18px] px-1
                rounded-full
                bg-indigo-600 text-white
                text-[10px] font-bold
                flex items-center justify-center
                ring-2 ring-white dark:ring-[#0b0d12]
              "
            >
              {badgeText}
            </span>
          )}
        </span>

        {/* Label */}
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
            Notifications
          </span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-500 truncate mt-0.5">
            {hasUnread
              ? `${unreadCount} unread`
              : 'You\u2019re all caught up'}
          </span>
        </span>

        {/* Chevron */}
        <span
          className={`
            w-5 h-5 flex items-center justify-center
            text-gray-400
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="m6 9 6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default NotificationBell;