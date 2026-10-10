// -------------------------------------------------------------
// NotificationToggle - Toggle items for the user menu
// -------------------------------------------------------------
//
// Renders two menu items:
//   1. Desktop notifications (with permission awareness)
//   2. Sound
//
// PROPS: none — reads state + toggles from context.
//
// USAGE:
//   Inside the user menu dropdown, above "Profile settings".
// -------------------------------------------------------------

'use client';

import { useNotificationsCtx } from '@/context/NotificationsContext';

export default function NotificationToggleItems({ onAfterToggle }) {
  const {
    soundEnabled,
    desktopEnabled,
    desktopPermission,
    toggleSound,
    toggleDesktop,
  } = useNotificationsCtx();

  const handleToggleSound = () => {
    toggleSound();
    // Optional: parent can close the menu, or we can keep it open
    // for multiple toggles. Keep open by default.
  };

  const handleToggleDesktop = async () => {
    await toggleDesktop();
    onAfterToggle?.();
  };

  // Determine desktop notification label
  const desktopLabel = (() => {
    if (desktopPermission === 'denied') return 'Blocked by browser';
    return desktopEnabled ? 'On' : 'Off';
  })();

  const desktopDisabled = desktopPermission === 'denied';

  return (
    <>
      {/* Desktop notifications */}
      <button
        type="button"
        onClick={desktopDisabled ? undefined : handleToggleDesktop}
        disabled={desktopDisabled}
        className={`
          w-full flex items-center gap-3
          px-3 py-2 rounded-xl
          text-[13px]
          ${
            desktopDisabled
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
          }
          transition-colors
        `}
      >
        <span
          className={`
            w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
            ${
              desktopDisabled
                ? 'bg-gray-100 dark:bg-white/[0.06]'
                : 'bg-gray-100 dark:bg-white/[0.06]'
            }
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="2" y="4" width="20" height="14" rx="2" />
            <path d="M8 20h8" strokeLinecap="round" />
          </svg>
        </span>

        <span className="flex-1 text-left">Desktop notifications</span>

        <span
          className={`
            text-[11px] font-semibold px-2 py-0.5 rounded-md
            ${
              desktopDisabled
                ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                : desktopEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {desktopLabel}
        </span>
      </button>

      {/* Sound */}
      <button
        type="button"
        onClick={handleToggleSound}
        className="
          w-full flex items-center gap-3
          px-3 py-2 rounded-xl
          text-[13px] text-gray-700 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-white/[0.05]
          transition-colors
        "
      >
        <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          {soundEnabled ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M11 5L6 9H2v6h4l5 4V5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M11 5L6 9H2v6h4l5 4V5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M23 9l-6 6M17 9l6 6" strokeLinecap="round" />
            </svg>
          )}
        </span>

        <span className="flex-1 text-left">Sound</span>

        <span
          className={`
            text-[11px] font-semibold px-2 py-0.5 rounded-md
            ${
              soundEnabled
                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {soundEnabled ? 'On' : 'Off'}
        </span>
      </button>
    </>
  );
}