// -------------------------------------------------------------
// SettingsNav - Sub-navigation for the settings section
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered by settings/layout.jsx on the left side of the
//   two-column settings shell.
//
// STRUCTURE:
//   <nav> with items:
//     - Profile       (live)
//     - Appearance    (disabled — future)
//     - Notifications (disabled — future)
//
// POLISH:
//   - Active state uses glass indigo (matches Wave-3)
//   - Links get active:scale + focus-visible ring
//   - Disabled items get aria-disabled + title
//   - Icon strokeWidth normalized to 1.8
//   - A11y: aria-current="page" on active link, aria-hidden on icons
//
// PRESERVED:
//   - Same NAV_ITEMS structure
//   - Same usePathname() active logic
//   - Same disabled visual pattern (muted, non-clickable)
//   - Same responsive behavior (horizontal on mobile, vertical on desktop)
// -------------------------------------------------------------

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/settings/profile',
    label: 'Profile',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    enabled: true,
  },
  {
    href: '/settings/appearance',
    label: 'Appearance',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
    enabled: false,
  },
  {
    href: '/settings/notifications',
    label: 'Notifications',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
          strokeLinecap="round"
        />
        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
      </svg>
    ),
    enabled: false,
  },
];

const SettingsNav = () => {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label="Settings sections"
      className="
        flex md:flex-col gap-1
        overflow-x-auto md:overflow-x-visible
        md:sticky md:top-8 md:self-start
        -mx-1 px-1
      "
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              title="Coming soon"
              className="
                flex items-center gap-2 flex-shrink-0
                px-3 py-2 rounded-lg
                text-[13px]
                text-gray-400 dark:text-gray-600
                cursor-not-allowed whitespace-nowrap
              "
            >
              <span className="flex-shrink-0 opacity-60" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`
              flex items-center gap-2 flex-shrink-0
              px-3 py-2 rounded-lg
              text-[13px] font-medium
              whitespace-nowrap
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
              transition-all duration-150
              ${
                isActive
                  ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
              }
            `}
          >
            <span className="flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default SettingsNav;