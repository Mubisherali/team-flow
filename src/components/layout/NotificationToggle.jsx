// -------------------------------------------------------------
// NotificationToggle - Toggle items for the user menu
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered inside the user menu dropdown, above "Profile
//   settings". Two rows: Desktop notifications + Sound.
//
// STRUCTURE:
//   Row 1: Desktop notifications (with permission awareness)
//   Row 2: Sound
//
// POLISH:
//   - All badge/pill tints → glass (matches Wave-3)
//   - focus-visible rings on both buttons
//   - active:scale-[0.99]
//   - aria-hidden on decorative SVGs
//   - Icon tile background simplified (was redundant ternary)
//   - duration-150 normalized
//
// PRESERVED:
//   - Props (onAfterToggle)
//   - Context reads (soundEnabled, desktopEnabled,
//     desktopPermission, toggleSound, toggleDesktop)
//   - desktopLabel logic (Blocked / On / Off)
//   - desktopDisabled logic (permission === 'denied')
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
    // Keep menu open by default (user may toggle desktop too).
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
      {/* ─── Desktop notifications ─── */}
      <button
        type="button"
        onClick={desktopDisabled ? undefined : handleToggleDesktop}
        disabled={desktopDisabled}
        className={`
          w-full flex items-center gap-3
          px-3 py-2 rounded-xl
          text-[13px]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          transition-all duration-150
          ${
            desktopDisabled
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] active:scale-[0.99]'
          }
        `}
      >
        <span
          className="
            w-7 h-7 rounded-lg flex-shrink-0
            bg-gray-100 dark:bg-white/[0.06]
            flex items-center justify-center
          "
          aria-hidden="true"
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
                ? 'bg-red-500/10 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                : desktopEnabled
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {desktopLabel}
        </span>
      </button>

      {/* ─── Sound ─── */}
      <button
        type="button"
        onClick={handleToggleSound}
        className="
          w-full flex items-center gap-3
          px-3 py-2 rounded-xl
          text-[13px] text-gray-700 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-white/[0.05]
          active:scale-[0.99]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          transition-all duration-150
        "
      >
        <span
          className="
            w-7 h-7 rounded-lg flex-shrink-0
            bg-gray-100 dark:bg-white/[0.06]
            flex items-center justify-center
          "
          aria-hidden="true"
        >
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
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
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