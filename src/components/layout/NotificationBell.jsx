// -------------------------------------------------------------
// NotificationBell - Bell + badge + dropdown for the sidebar
// -------------------------------------------------------------
//
// READS FROM CONTEXT (not from the hook directly). This ensures
// there's only one polling loop in the app — the provider's.
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import NotificationDropdown from './NotificationDropdown';
import { useNotificationsCtx } from '@/context/NotificationsContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotificationsCtx();

  const router = useRouter();

  const handleToggle = () => setIsOpen((v) => !v);
  const handleClose = () => setIsOpen(false);

  const handleSelect = (notification) => {
    if (notification.link) router.push(notification.link);
    handleClose();
  };

  const handleMarkAllRead = () => markAllRead();

  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative">
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

        <span
          className={`
            w-5 h-5 flex items-center justify-center
            text-gray-400
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default NotificationBell;