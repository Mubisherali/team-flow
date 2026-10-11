// -------------------------------------------------------------
// MobileTopbar - Top bar shown on mobile / tablet
// -------------------------------------------------------------
//
// LAYOUT:
//   [☰]  [TF] TeamFlow         [🔔 3]   [MA]
//
// VISIBLE ONLY:
//   < 1024px viewport. Hidden on desktop via `lg:hidden`.
//
// PROPS:
//   user              : { id, name, email, image }
//   onOpenSidebar     : () => void — opens the mobile drawer
//
// CONTENTS:
//   - Hamburger button (opens drawer)
//   - Brand link to /workspaces
//   - Compact notification bell (icon + badge)
//   - User avatar (opens a small dropdown)
//
// WHY A COMPACT BELL:
//   The desktop <NotificationBell /> is a wide button with a
//   label. On mobile we need just the icon + badge. So we
//   render a compact version here that opens the same dropdown.
// -------------------------------------------------------------

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

import NotificationDropdown from './NotificationDropdown';
import { useNotificationsCtx } from '@/context/NotificationsContext';

const MobileTopbar = ({ user, onOpenSidebar }) => {
  const safeUser = user || {};
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotificationsCtx();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifWrapRef = useRef(null);
  const userWrapRef = useRef(null);

  const router = useRouter();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
  const hasUnread = unreadCount > 0;

  // ─── Close user menu on outside click ───
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleSelectNotification = (notification) => {
    if (notification.link) router.push(notification.link);
    setNotifOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <header
      className="
        lg:hidden
        sticky top-0 z-30
        h-14 flex items-center justify-between
        px-3
        bg-white/95 dark:bg-[#0b0d12]/95
        backdrop-blur-md
        border-b border-gray-200 dark:border-white/[0.06]
      "
    >
      {/* ─── Left: Hamburger + Brand ─── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-lg
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-white/[0.06]
            transition-colors flex-shrink-0
          "
          aria-label="Open menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <Link
          href="/workspaces"
          className="flex items-center gap-2 min-w-0"
        >
          <div
            className="
              relative w-7 h-7 rounded-lg
              
            "
          >
            <img src="/logo.png" alt="" width={30}/>
            <span className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0b0d12]" />
          </div>

          <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
            TeamFlow
          </span>
        </Link>
      </div>

      {/* ─── Right: Bell + User ─── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* ─── Bell ─── */}
        <div ref={notifWrapRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserMenuOpen(false);
            }}
            className="
              relative w-9 h-9 flex items-center justify-center
              rounded-lg
              text-gray-700 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-white/[0.06]
              transition-colors
            "
            aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
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

            {hasUnread && (
              <span
                className="
                  absolute top-0.5 right-0.5
                  min-w-[16px] h-4 px-1
                  rounded-full
                  bg-indigo-600 text-white
                  text-[9px] font-bold
                  flex items-center justify-center
                  ring-2 ring-white dark:ring-[#0b0d12]
                "
              >
                {badgeText}
              </span>
            )}
          </button>

          {/* Notification dropdown — anchored below the icon.
              We reuse <NotificationDropdown /> which handles
              the content. But its positioning is designed for
              the sidebar (bottom-full). On mobile we want it
              below. We wrap it in a small custom container. */}
          {notifOpen && (
            <div
              className="
                absolute top-full right-0 mt-2 z-50
                w-[calc(100vw-24px)] max-w-sm
                rounded-2xl overflow-hidden
                bg-white dark:bg-[#111318]
                border border-gray-200 dark:border-white/[0.08]
                shadow-2xl shadow-black/20 dark:shadow-black/50
              "
            >
              {/* Header */}
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
                    onClick={markAllRead}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="max-h-80 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 px-6 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      You&apos;re all caught up
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                    {notifications.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onClick={() => {
                          if (!n.isRead) markRead(n.id);
                          handleSelectNotification(n);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── User avatar ─── */}
        <div ref={userWrapRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="
              w-9 h-9 rounded-full overflow-hidden
              flex-shrink-0
              hover:ring-2 hover:ring-indigo-500/30
              transition-all
            "
            aria-label="Open user menu"
          >
            {safeUser.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeUser.image}
                alt={safeUser.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-[11px] font-bold">
                {getInitials(safeUser.name)}
              </div>
            )}
          </button>

          {/* Small user dropdown */}
          {userMenuOpen && (
            <div
              className="
                absolute top-full right-0 mt-2 z-50
                w-56
                rounded-2xl overflow-hidden
                bg-white dark:bg-[#111318]
                border border-gray-200 dark:border-white/[0.08]
                shadow-2xl shadow-black/20 dark:shadow-black/50
                p-1.5
              "
            >
              <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/[0.06] mb-1">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {safeUser.name || 'User'}
                </p>
                <p className="text-[10.5px] text-gray-500 dark:text-gray-500 truncate mt-0.5">
                  {safeUser.email || ''}
                </p>
              </div>

              <Link
                href="/settings/profile"
                onClick={() => setUserMenuOpen(false)}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-xl
                  text-[13px] text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-white/[0.05]
                  transition-colors
                "
              >
                Profile settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-2 px-3 py-2 rounded-xl
                  text-[13px] text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-500/10
                  transition-colors
                "
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// =============================================================
// NotificationRow - small row used in the mobile bell dropdown
// =============================================================
const NotificationRow = ({ notification, onClick }) => {
  const { type, message, isRead, createdAt } = notification;

  const iconColor = (() => {
    switch (type) {
      case 'TASK_COMMENTED':
        return 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400';
      case 'TASK_STATUS_CHANGED':
        return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      case 'TASK_ASSIGNED':
        return 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
    }
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left
        transition-colors
        hover:bg-gray-50 dark:hover:bg-white/[0.03]
        ${!isRead ? 'bg-indigo-50/40 dark:bg-indigo-500/[0.06]' : ''}
      `}
    >
      <span className="w-2 pt-2 flex-shrink-0">
        {!isRead && (
          <span className="block w-2 h-2 rounded-full bg-indigo-500" />
        )}
      </span>

      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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

      <span className="flex-1 min-w-0">
        <span
          className={`block text-[13px] leading-snug line-clamp-3 ${
            !isRead
              ? 'text-gray-900 dark:text-white font-medium'
              : 'text-gray-600 dark:text-gray-400'
          }`}
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
// formatRelative
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

export default MobileTopbar;