// -------------------------------------------------------------
// SettingsNav - Sub-navigation for the settings section
// -------------------------------------------------------------
//
// CLIENT COMPONENT because it uses usePathname() to highlight
// the active link.
//
// ITEMS:
//   - Profile       (live)
//   - Appearance    (disabled — future)
//   - Notifications (disabled — future)
//
// Disabled items are visually muted and non-clickable, but still
// visible so users can see what's coming.
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
        strokeWidth="2"
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
        strokeWidth="2"
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
        strokeWidth="2"
      >
        <path
          d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
          strokeLinecap="round"
        />
        <path
          d="M13.73 21a2 2 0 01-3.46 0"
          strokeLinecap="round"
        />
      </svg>
    ),
    enabled: false,
  },
];

const SettingsNav = () => {
  const pathname = usePathname() || '';

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:sticky md:top-8 md:self-start">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed whitespace-nowrap"
              title="Coming soon"
            >
              <span className="flex-shrink-0 opacity-60">{item.icon}</span>
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default SettingsNav;