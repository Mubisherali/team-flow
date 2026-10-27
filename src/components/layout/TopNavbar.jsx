
// -------------------------------------------------------------
// TopNavbar - Contextual navbar for the TeamFlow dashboard
// -------------------------------------------------------------
//
// PRESERVED:
//   - Global search shortcut (Ctrl/Cmd + K)
//   - Context label
//   - Member avatars and members navigation
//   - NotificationDropdown and notification actions
//   - NotificationToggleItems
//   - User menu, profile settings and logout
//   - Outside-click dropdown dismissal
//
// POLISH:
//   - Refined translucent navbar
//   - Cleaner search control
//   - Improved avatar and notification indicators
//   - Better dropdown focus states
//   - Responsive spacing
// -------------------------------------------------------------

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

import NotificationDropdown from "./NotificationDropdown";
import NotificationToggleItems from "./NotificationToggle";
import { useNotificationsCtx } from "@/context/NotificationsContext";

const TopNavbar = ({
  user,
  members = [],
  contextLabel,
  membersHref,
}) => {
  const safeUser = user || {};
  const safeMembers = Array.isArray(members) ? members : [];

  const router = useRouter();

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotificationsCtx();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const notifWrapRef = useRef(null);
  const userWrapRef = useRef(null);

  const hasUnread = unreadCount > 0;
  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  // Close menus when the user clicks outside either dropdown.
  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;

    const handler = (event) => {
      if (
        notifWrapRef.current &&
        !notifWrapRef.current.contains(event.target)
      ) {
        setNotifOpen(false);
      }

      if (
        userWrapRef.current &&
        !userWrapRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [notifOpen, userMenuOpen]);

  // Escape closes open menus.
  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notifOpen, userMenuOpen]);

  const openSearch = () => {
    setNotifOpen(false);
    setUserMenuOpen(false);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);
  };

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await signOut({ redirect: false });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to log out:", error);
      setLoggingOut(false);
    }
  };

  const visibleMembers = safeMembers.slice(0, 4);
  const remaining = Math.max(0, safeMembers.length - visibleMembers.length);

  return (
    <header
      className="
        sticky top-0 z-40 flex h-16 shrink-0
        items-center justify-between gap-3
        border-b border-gray-200/70
        bg-white/85 px-4 backdrop-blur-xl
        dark:border-white/[0.07]
        dark:bg-[#0b0d12]/85
        sm:gap-4 sm:px-6
      "
    >
      {/* Left: context and search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {contextLabel && (
          <div className="hidden min-w-0 shrink-0 items-center gap-2 md:flex">
            <span
              className="
                max-w-[180px] truncate text-[13px]
                font-semibold tracking-tight
                text-gray-900 dark:text-gray-100
              "
              title={contextLabel}
            >
              {contextLabel}
            </span>

            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-gray-300 dark:text-gray-700"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        )}

        {/* Global search */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Open global search"
          className="
            group flex w-full max-w-[340px] min-w-0
            items-center gap-2.5 rounded-xl
            border border-gray-200/80
            bg-gray-50/80 px-3 py-2
            text-left transition-all duration-150
            hover:border-indigo-300/80
            hover:bg-white hover:shadow-sm
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-indigo-500
            dark:border-white/[0.07]
            dark:bg-white/[0.035]
            dark:hover:border-indigo-400/30
            dark:hover:bg-white/[0.055]
          "
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="
              shrink-0 text-gray-400
              transition-colors
              group-hover:text-indigo-500
            "
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7.5" />
            <path d="m16.5 16.5 4 4" />
          </svg>

          <span
            className="
              min-w-0 flex-1 truncate text-[12px]
              text-gray-500 dark:text-gray-400
            "
          >
            Search or jump to...
          </span>

          <kbd
            className="
              hidden shrink-0 items-center gap-0.5
              rounded-md border border-gray-200
              bg-white px-1.5 py-0.5
              text-[10px] font-medium text-gray-500
              shadow-sm sm:inline-flex
              dark:border-white/[0.09]
              dark:bg-white/[0.04]
              dark:text-gray-400
            "
          >
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: members, notifications and profile */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* Member avatars */}
        {safeMembers.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (membersHref) router.push(membersHref);
            }}
            disabled={!membersHref}
            aria-label={`View ${safeMembers.length} members`}
            className="
              group mr-1 hidden items-center
              rounded-full py-1 pl-1
              transition-opacity
              hover:opacity-90
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500
              disabled:cursor-default
              md:flex
            "
          >
            {visibleMembers.map((member) => {
              const isAdmin =
                member.role === "OWNER" ||
                member.role === "MANAGER";

              const isMe = member.userId === safeUser.id;

              return (
                <span
                  key={member.userId}
                  className={`
                    relative -ml-1 flex h-8 w-8 shrink-0
                    items-center justify-center rounded-full
                    ring-2 ring-white transition-transform duration-150
                    first:ml-0 group-hover:-translate-y-0.5
                    dark:ring-[#0b0d12]
                    ${
                      isAdmin
                        ? "z-10 ring-indigo-300 dark:ring-indigo-500/80"
                        : ""
                    }
                  `}
                  title={`${member.name || member.email}${
                    isAdmin ? ` · ${member.role}` : ""
                  }${isMe ? " (You)" : ""}`}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={`
                        flex h-full w-full items-center
                        justify-center rounded-full
                        text-[10px] font-bold text-white
                        ${
                          isAdmin
                            ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                            : "bg-gray-400 dark:bg-gray-600"
                        }
                      `}
                    >
                      {getInitials(member.name || member.email)}
                    </span>
                  )}

                  {isAdmin && (
                    <span
                      aria-label="Workspace manager"
                      className="
                        absolute -bottom-0.5 -right-0.5
                        h-2.5 w-2.5 rounded-full
                        border-2 border-white bg-amber-400
                        dark:border-[#0b0d12]
                      "
                    />
                  )}

                  {isMe && !isAdmin && (
                    <span
                      aria-hidden="true"
                      className="
                        absolute inset-0 rounded-full
                        ring-1 ring-inset ring-emerald-400
                        dark:ring-emerald-500
                      "
                    />
                  )}
                </span>
              );
            })}

            {remaining > 0 && (
              <span
                className="
                  relative -ml-1 flex h-8 w-8 shrink-0
                  items-center justify-center rounded-full
                  bg-gray-100 text-[10px] font-semibold
                  text-gray-600 ring-2 ring-white
                  dark:bg-white/[0.07] dark:text-gray-300
                  dark:ring-[#0b0d12]
                "
              >
                +{remaining}
              </span>
            )}
          </button>
        )}

        {safeMembers.length > 0 && (
          <span
            aria-hidden="true"
            className="
              hidden h-5 w-px bg-gray-200
              dark:bg-white/[0.08] md:block
            "
          />
        )}

        {/* Notifications */}
        <div ref={notifWrapRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((open) => !open);
              setUserMenuOpen(false);
            }}
            aria-label={`Notifications${
              hasUnread ? ` (${unreadCount} unread)` : ""
            }`}
            aria-expanded={notifOpen}
            aria-haspopup="true"
            className="
              relative flex h-9 w-9 items-center
              justify-center rounded-xl
              text-gray-600 transition-colors
              hover:bg-gray-100 hover:text-gray-900
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500
              dark:text-gray-300
              dark:hover:bg-white/[0.06]
              dark:hover:text-white
            "
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>

            {hasUnread && (
              <span
                className="
                  absolute right-1 top-1 flex h-[15px]
                  min-w-[15px] items-center justify-center
                  rounded-full border-2 border-white
                  bg-indigo-600 px-0.5 text-[8px]
                  font-bold leading-none text-white
                  dark:border-[#0b0d12]
                "
              >
                {badgeText}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onSelect={(notification) => {
              if (notification.link) router.push(notification.link);
              setNotifOpen(false);
            }}
            position="bottom"
          />
        </div>

        {/* Profile menu */}
        <div
          ref={userWrapRef}
          className="
            relative border-l border-gray-200 pl-2
            dark:border-white/[0.08] sm:pl-3
          "
        >
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setNotifOpen(false);
            }}
            aria-label="Open user menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            className="
              group flex items-center gap-2 rounded-full
              py-0.5 pl-0.5 pr-1.5
              transition-colors duration-150
              hover:bg-gray-100
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500
              dark:hover:bg-white/[0.06]
              sm:pr-2
            "
          >
            {safeUser.image ? (
              <img
                src={safeUser.image}
                alt=""
                className="
                  h-8 w-8 rounded-full object-cover
                  ring-1 ring-black/[0.06]
                  dark:ring-white/[0.1]
                "
              />
            ) : (
              <span
                className="
                  flex h-8 w-8 items-center justify-center
                  rounded-full bg-gradient-to-br
                  from-indigo-500 to-violet-600
                  text-[11px] font-bold text-white
                  ring-1 ring-inset ring-white/20
                "
              >
                {getInitials(safeUser.name)}
              </span>
            )}

            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`
                hidden text-gray-400 transition-transform
                duration-150 sm:block
                ${userMenuOpen ? "rotate-180" : ""}
              `}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="
                  absolute right-0 top-full z-50 mt-2
                  w-[min(240px,calc(100vw-24px))]
                  overflow-hidden rounded-2xl
                  border border-gray-200/90
                  bg-white p-1.5
                  shadow-xl shadow-black/[0.08]
                  dark:border-white/[0.09]
                  dark:bg-[#111318]
                  dark:shadow-black/40
                "
              >
                {/* User identity */}
                <div className="mb-1 border-b border-gray-100 px-3 py-3 dark:border-white/[0.07]">
                  <div className="flex items-center gap-2.5">
                    {safeUser.image ? (
                      <img
                        src={safeUser.image}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="
                          flex h-9 w-9 shrink-0 items-center
                          justify-center rounded-full
                          bg-gradient-to-br from-indigo-500 to-violet-600
                          text-xs font-bold text-white
                        "
                      >
                        {getInitials(safeUser.name)}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                        {safeUser.name || "User"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {safeUser.email || ""}
                      </p>
                    </div>
                  </div>
                </div>

                <NotificationToggleItems />

                <div className="my-1.5 border-t border-gray-100 dark:border-white/[0.07]" />

                <Link
                  href="/settings/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="
                    flex items-center gap-2.5 rounded-xl
                    px-3 py-2.5 text-[12px] font-medium
                    text-gray-700 transition-colors
                    hover:bg-gray-100
                    focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-indigo-500
                    dark:text-gray-300
                    dark:hover:bg-white/[0.05]
                  "
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                  </svg>
                  Profile settings
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="
                    flex w-full items-center gap-2.5 rounded-xl
                    px-3 py-2.5 text-left text-[12px]
                    font-medium text-red-600 transition-colors
                    hover:bg-red-50
                    focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-red-500
                    disabled:cursor-wait disabled:opacity-60
                    dark:text-red-400 dark:hover:bg-red-500/[0.09]
                  "
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                  </svg>

                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
